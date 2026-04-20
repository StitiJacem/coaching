import { Request, Response } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../orm/data-source";
import { WorkoutLog } from "../entities/WorkoutLog";
import { Program } from "../entities/Program";
import { CoachingRequest } from "../entities/CoachingRequest";
import { CoachProfile } from "../entities/Coach";
import { canAccessAthlete } from "../utils/authorization";

async function getAthleteIdsForCoach(userId: number): Promise<number[]> {
    const ids = new Set<number>();

    const programsByCoach = await AppDataSource.getRepository(Program).find({
        where: { coachId: userId },
    });
    programsByCoach.forEach((p) => p.athleteId && ids.add(p.athleteId));

    const coachProfile = await AppDataSource.getRepository(CoachProfile).findOne({
        where: { userId },
    });
    if (coachProfile) {
        const programsByProfile = await AppDataSource.getRepository(Program).find({
            where: { coachProfileId: coachProfile.id },
        });
        programsByProfile.forEach((p) => p.athleteId && ids.add(p.athleteId));

        const requests = await AppDataSource.getRepository(CoachingRequest).find({
            where: { coachProfileId: coachProfile.id, status: "accepted" },
        });
        requests.forEach((r) => ids.add(r.athleteId));
    }

    return Array.from(ids);
}

export class ReportController {
    static coachOverview = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            if (user.role !== "coach") {
                return res.status(403).json({ message: "Coach access only" });
            }

            const allAthleteIds = await getAthleteIdsForCoach(user.id);
            if (allAthleteIds.length === 0) {
                return res.json({
                    period: "last_4_weeks",
                    totalAthletes: 0,
                    totalWorkouts: 0,
                    completedWorkouts: 0,
                    adherencePercent: 0,
                    totalVolumeMinutes: 0,
                    maxStreak: 0,
                });
            }

            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

            const logRepo = AppDataSource.getRepository(WorkoutLog);
            const logs = await logRepo.find({
                where: { athleteId: In(allAthleteIds) },
            });

            const recentLogs = logs.filter((l) => new Date(l.scheduledDate) >= fourWeeksAgo);
            const completed = recentLogs.filter((l) => l.status === "completed");
            const total = recentLogs.length;
            const adherence = total > 0 ? Math.round((completed.length / total) * 100) : 0;
            const totalVolume = completed.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

            let maxStreak = 0;
            const byAthlete = new Map<number, WorkoutLog[]>();
            for (const l of completed) {
                if (!byAthlete.has(l.athleteId)) byAthlete.set(l.athleteId, []);
                byAthlete.get(l.athleteId)!.push(l);
            }
            for (const arr of byAthlete.values()) {
                const dates = [...new Set(arr.map((l) => new Date(l.scheduledDate).toISOString().split("T")[0]))].sort();
                let streak = 0;
                const today = new Date().toISOString().split("T")[0];
                for (let i = dates.length - 1; i >= 0; i--) {
                    const expect = new Date();
                    expect.setDate(expect.getDate() - (dates.length - 1 - i));
                    if (dates[i] === expect.toISOString().split("T")[0]) streak++;
                    else break;
                }
                if (streak > maxStreak) maxStreak = streak;
            }

            res.json({
                period: "last_4_weeks",
                totalAthletes: allAthleteIds.length,
                totalWorkouts: total,
                completedWorkouts: completed.length,
                adherencePercent: adherence,
                totalVolumeMinutes: totalVolume,
                maxStreak,
            });
        } catch (error) {
            console.error("Error fetching coach overview:", error);
            res.status(500).json({ message: "Error fetching coach overview" });
        }
    };

    static athleteProgress = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const athleteId = parseInt(req.params.id as string);
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied" });
            }

            const fourWeeksAgo = new Date();
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

            const logRepo = AppDataSource.getRepository(WorkoutLog);
            const logs = await logRepo.find({
                where: { athleteId },
                order: { scheduledDate: "DESC" },
            });

            const recentLogs = logs.filter((l) => new Date(l.scheduledDate) >= fourWeeksAgo);
            const completed = recentLogs.filter((l) => l.status === "completed");
            const total = recentLogs.length;
            const adherence = total > 0 ? Math.round((completed.length / total) * 100) : 0;
            const totalVolume = completed.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

            const dates = [...new Set(completed.map((l) => new Date(l.scheduledDate).toISOString().split("T")[0]))].sort();
            let streak = 0;
            const today = new Date().toISOString().split("T")[0];
            for (let i = dates.length - 1; i >= 0; i--) {
                const expect = new Date();
                expect.setDate(expect.getDate() - (dates.length - 1 - i));
                if (dates[i] === expect.toISOString().split("T")[0]) streak++;
                else break;
            }

            const weeklyData = Array.from({ length: 4 }, (_, i) => {
                const start = new Date();
                start.setDate(start.getDate() - 28 + i * 7);
                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                const weekLogs = completed.filter((l) => {
                    const d = new Date(l.scheduledDate);
                    return d >= start && d <= end;
                });
                return {
                    week: i + 1,
                    label: `Week ${i + 1}`,
                    completed: weekLogs.length,
                    minutes: weekLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0),
                };
            });

            res.json({
                athleteId,
                period: "last_4_weeks",
                totalWorkouts: total,
                completedWorkouts: completed.length,
                adherencePercent: adherence,
                totalVolumeMinutes: totalVolume,
                currentStreak: streak,
                weeklyBreakdown: weeklyData,
            });
        } catch (error) {
            console.error("Error fetching athlete progress:", error);
            res.status(500).json({ message: "Error fetching athlete progress" });
        }
    };
}
