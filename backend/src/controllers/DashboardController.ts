import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Athlete } from "../entities/Athlete";
import { Program } from "../entities/Program";
import { Session } from "../entities/Session";
import { CoachProfile } from "../entities/Coach";
import { ActivityEvent } from "../entities/ActivityEvent";
import { WorkoutLog } from "../entities/WorkoutLog";
import { ExerciseLog } from "../entities/ExerciseLog";
import { Brackets, In } from "typeorm";

export class DashboardController {

    static getStats = async (req: Request, res: Response) => {
        try {

            const role: string =
                typeof req.query.role === "string"
                    ? req.query.role
                    : "coach";

            let stats: any = {};

            if (role === "coach") {

                const athleteRepo = AppDataSource.getRepository(Athlete);
                const programRepo = AppDataSource.getRepository(Program);
                const sessionRepo = AppDataSource.getRepository(Session);

                const coachId = (req as any).user.id;
                const coachProfile = await AppDataSource.getRepository(CoachProfile).findOne({ where: { userId: coachId } });

                const totalAthletes: number = await athleteRepo.createQueryBuilder("athlete")
                    .where(new Brackets(qb => {
                        qb.where('EXISTS (SELECT 1 FROM programs p WHERE p."athleteId" = athlete.id AND p."coachId" = :coachId)', { coachId });
                        if (coachProfile) {
                            qb.orWhere('EXISTS (SELECT 1 FROM coaching_requests r WHERE r."athleteId" = athlete.id AND r."coachProfileId" = :profileId AND r.status = \'accepted\')', { profileId: coachProfile.id });
                        }
                    }))
                    .getCount();

                const totalPrograms: number = await programRepo.count({ where: { coachId } });

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const todaySessions: number =
                    await sessionRepo
                        .createQueryBuilder("session")
                        .where(
                            "session.date >= :today AND session.date < :tomorrow",
                            { today, tomorrow }
                        )
                        .getCount();

                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const workoutLogRepo = AppDataSource.getRepository(WorkoutLog);
                const logs = await workoutLogRepo.createQueryBuilder("log")
                    .leftJoin("log.athlete", "athlete")
                    .leftJoin("programs", "p", 'p."athleteId" = athlete.id AND p."coachId" = :coachId')
                    .where("log.scheduledDate >= :thirtyDaysAgo", { thirtyDaysAgo })
                    .andWhere("p.id IS NOT NULL")
                    .getMany();

                let avgAdherence = 0;
                if (logs.length > 0) {
                    const completed = logs.filter(l => l.status === 'completed').length;
                    avgAdherence = Math.round((completed / logs.length) * 100);
                }

                stats = [
                    {
                        label: "Active Athletes",
                        value: totalAthletes.toString(),
                        subtext: `${totalAthletes} total athletes`,
                        icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    },
                    {
                        label: "Programs",
                        value: totalPrograms.toString(),
                        subtext: "Active programs",
                        icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    },
                    {
                        label: "Sessions Today",
                        value: todaySessions.toString(),
                        subtext: "Scheduled for today",
                        icon: "M13 10V3L4 14h7v7l9-11h-7z"
                    },
                    {
                        label: "Avg Adherence",
                        value: `${avgAdherence}%`,
                        subtext: "Average adherence",
                        icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    }
                ];

            } else if (role === "athlete") {

                const userId = (req as any).user.id;
                const athleteRepo = AppDataSource.getRepository(Athlete);
                const athlete = await athleteRepo.findOne({ where: { userId } });

                if (athlete) {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const logRepo = AppDataSource.getRepository(WorkoutLog);
                    const logs = await logRepo.find({
                        where: { athleteId: athlete.id }
                    });

                    const recentLogs = logs.filter((l) => new Date(l.scheduledDate) >= thirtyDaysAgo);
                    const completedLogs = recentLogs.filter((l) => l.status === "completed");

                    const totalWorkouts = completedLogs.length;
                    const activeTimeMinutes = completedLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
                    const activeHours = Math.floor(activeTimeMinutes / 60);
                    const activeMins = activeTimeMinutes % 60;

                    let totalVolume = 0;
                    if (completedLogs.length > 0) {
                        const exerciseLogRepo = AppDataSource.getRepository(ExerciseLog);
                        const completedLogIds = completedLogs.map(l => l.id);
                        const exerciseLogs = await exerciseLogRepo.find({
                            where: { workoutLogId: In(completedLogIds) }
                        });
                        
                        exerciseLogs.forEach(el => {
                            if (el.repsPerSet && el.weightKgPerSet) {
                                for (let i = 0; i < el.repsPerSet.length; i++) {
                                    totalVolume += (el.repsPerSet[i] || 0) * (el.weightKgPerSet[i] || 0);
                                }
                            }
                        });
                    }

                    stats = [
                        {
                            label: "Workouts",
                            value: totalWorkouts.toString(),
                            subtext: "Completed in 30 days",
                            icon: "M13 10V3L4 14h7v7l9-11h-7z"
                        },
                        {
                            label: "Total Volume",
                            value: totalVolume > 1000 ? (totalVolume/1000).toFixed(1) + "k" : totalVolume.toString(),
                            subtext: "Kg lifted in 30 days",
                            icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                        },
                        {
                            label: "Active Time",
                            value: `${activeHours}H ${activeMins}M`,
                            subtext: "Spent training (30d)",
                            icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        },
                        {
                            label: "Avg Adherence",
                            value: recentLogs.length > 0 ? Math.round((totalWorkouts / recentLogs.length) * 100) + "%" : "0%",
                            subtext: "Completion rate",
                            icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        }
                    ];
                } else {
                    stats = [];
                }
            }

            res.json(stats);

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            res.status(500).json({ message: "Error fetching dashboard stats" });
        }
    };

    static getTodaySessions = async (req: Request, res: Response) => {
        try {

            const sessionRepo = AppDataSource.getRepository(Session);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const coachId = (req as any).user.id;
            const coachProfile = await AppDataSource.getRepository(CoachProfile).findOne({ where: { userId: coachId } });

            const sessions: Session[] = await sessionRepo.createQueryBuilder("session")
                .leftJoinAndSelect("session.athlete", "athlete")
                .leftJoinAndSelect("athlete.user", "user")
                .leftJoinAndSelect("session.program", "program")
                .where(new Brackets(qb => {
                    qb.where("program.coachId = :coachId", { coachId });
                    if (coachProfile) {
                        qb.orWhere('EXISTS (SELECT 1 FROM coaching_requests r WHERE r."athleteId" = athlete.id AND r."coachProfileId" = :profileId AND r.status = \'accepted\')', { profileId: coachProfile.id });
                    }
                }))
                .orderBy("session.time", "ASC")
                .getMany();

            const todaySessions = sessions
                .filter((s: Session) => {
                    const sessionDate = new Date(s.date);
                    return sessionDate >= today && sessionDate < tomorrow;
                })
                .map((s: Session) => ({
                    id: s.id,
                    time: s.time,
                    athlete: s.athlete?.user
                        ? `${s.athlete.user.first_name || ""} ${s.athlete.user.last_name || ""}`.trim()
                        : "Unknown",
                    type: s.type,
                    status: s.status,
                    date: s.date
                }));

            res.json(todaySessions);

        } catch (error) {
            console.error("Error fetching today's sessions:", error);
            res.status(500).json({ message: "Error fetching sessions" });
        }
    };

    static getRecentAthletes = async (req: Request, res: Response) => {
        try {
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const coachId = (req as any).user.id;
            const coachProfile = await AppDataSource.getRepository(CoachProfile).findOne({ where: { userId: coachId } });

            const athletes: Athlete[] = await athleteRepo.createQueryBuilder("athlete")
                .leftJoinAndSelect("athlete.user", "user")
                .where(new Brackets(qb => {
                    qb.where('EXISTS (SELECT 1 FROM programs p WHERE p."athleteId" = athlete.id AND p."coachId" = :coachId)', { coachId });
                    if (coachProfile) {
                        qb.orWhere('EXISTS (SELECT 1 FROM coaching_requests r WHERE r."athleteId" = athlete.id AND r."coachProfileId" = :profileId AND r.status = \'accepted\')', { profileId: coachProfile.id });
                    }
                }))
                .orderBy("athlete.lastActive", "DESC")
                .take(5)
                .getMany();

            const formattedAthletes = athletes.map((a: Athlete) => ({
                id: a.id,
                name:
                    `${a.user?.first_name || ""} ${a.user?.last_name || ""}`.trim()
                    || a.user?.email
                    || "Unknown",
                program: a.sport || "No Program",
                lastActive: a.lastActive,

            }));

            res.json(formattedAthletes);

        } catch (error) {
            console.error("Error fetching recent athletes:", error);
            res.status(500).json({ message: "Error fetching recent athletes" });
        }
    };

    static getRecentPRs = async (req: Request, res: Response) => {
        try {
            const role = typeof req.query.role === "string" ? req.query.role : "athlete";
            if (role === "coach") {
                const coachId = (req as any).user.id;
                const coachProfile = await AppDataSource.getRepository(CoachProfile).findOne({ where: { userId: coachId } });
                
                const eventRepo = AppDataSource.getRepository(ActivityEvent);
                const prs = await eventRepo.createQueryBuilder("event")
                    .leftJoinAndSelect("event.athlete", "athlete")
                    .leftJoinAndSelect("athlete.user", "user")
                    .where(new Brackets(qb => {
                        qb.where('EXISTS (SELECT 1 FROM programs p WHERE p."athleteId" = athlete.id AND p."coachId" = :coachId)', { coachId });
                        if (coachProfile) {
                            qb.orWhere('EXISTS (SELECT 1 FROM coaching_requests r WHERE r."athleteId" = athlete.id AND r."coachProfileId" = :profileId AND r.status = \'accepted\')', { profileId: coachProfile.id });
                        }
                    }))
                    .andWhere("event.type = :type", { type: "new_pr" })
                    .orderBy("event.created_at", "DESC")
                    .take(5)
                    .getMany();

                const formattedPrs = prs.map(pr => ({
                    id: pr.id,
                    athleteName: `${pr.athlete?.user?.first_name || ""} ${pr.athlete?.user?.last_name || ""}`.trim() || pr.athlete?.user?.username || "Athlete",
                    exercise: pr.payload?.exercise_name || "Unknown",
                    weight: pr.payload?.weightKg || "0",
                    date: pr.created_at
                }));
                return res.json(formattedPrs);
            }

            const eventRepo = AppDataSource.getRepository(ActivityEvent);
            const athleteRepo = AppDataSource.getRepository(Athlete);

            const userId = (req as any).user.id;
            const athlete = await athleteRepo.findOne({ where: { userId } });
            if (!athlete) return res.json([]);

            const prs = await eventRepo.find({
                where: { athleteId: athlete.id, type: "new_pr" },
                order: { created_at: "DESC" },
                take: 5
            });

            const formattedPrs = prs.map(pr => ({
                id: pr.id,
                exercise: pr.payload?.exercise_name || "Unknown",
                weight: pr.payload?.weightKg || "0",
                date: pr.created_at
            }));

            res.json(formattedPrs);
        } catch (error) {
            console.error("Error fetching recent PRs:", error);
            res.status(500).json({ message: "Error fetching recent PRs" });
        }
    };
}
