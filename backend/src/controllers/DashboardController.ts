import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Athlete } from "../entities/Athlete";
import { Program } from "../entities/Program";
import { Session } from "../entities/Session";
import { CoachProfile } from "../entities/Coach";
import { Brackets } from "typeorm";

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

                const avgAdherence = 87;

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

                stats = [
                    {
                        label: "Workouts",
                        value: "5",
                        subtext: "On track for weekly goal",
                        icon: "M13 10V3L4 14h7v7l9-11h-7z"
                    },
                    {
                        label: "Calories",
                        value: "2,450",
                        subtext: "Kcal burned this week",
                        icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                    },
                    {
                        label: "Active Time",
                        value: "4H 30M",
                        subtext: "+45m vs last week",
                        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    },
                    {
                        label: "Avg Intensity",
                        value: "8.5",
                        subtext: "High performance zone",
                        icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    }
                ];
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
}
