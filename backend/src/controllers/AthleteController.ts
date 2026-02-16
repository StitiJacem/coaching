import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Athlete } from "../entities/Athlete";
import { User } from "../entities/User";

export class AthleteController {
    // GET /api/athletes - Get all athletes
    static getAll = async (req: Request, res: Response) => {
        try {
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const { search, sport } = req.query;

            const queryBuilder = athleteRepo.createQueryBuilder("athlete")
                .leftJoinAndSelect("athlete.user", "user");

            if (search) {
                queryBuilder.where(
                    "(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)",
                    { search: `%${search}%` }
                );
            }
            if (sport) {
                queryBuilder.andWhere("athlete.sport = :sport", { sport });
            }

            queryBuilder.orderBy("athlete.lastActive", "DESC");

            const athletes = await queryBuilder.getMany();
            res.json(athletes);
        } catch (error) {
            console.error("Error fetching athletes:", error);
            res.status(500).json({ message: "Error fetching athletes" });
        }
    };

    // GET /api/athletes/:id - Get single athlete
    static getById = async (req: Request, res: Response) => {
        try {
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const athlete = await athleteRepo.findOne({
                where: { id: parseInt(req.params.id as string) },
                relations: ["user"]
            });

            if (!athlete) {
                return res.status(404).json({ message: "Athlete not found" });
            }

            res.json(athlete);
        } catch (error) {
            console.error("Error fetching athlete:", error);
            res.status(500).json({ message: "Error fetching athlete" });
        }
    };

    // PUT /api/athletes/:id - Update athlete profile
    static update = async (req: Request, res: Response) => {
        try {
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const athlete = await athleteRepo.findOne({
                where: { id: parseInt(req.params.id as string) },
                relations: ["user"]
            });

            if (!athlete) {
                return res.status(404).json({ message: "Athlete not found" });
            }

            const { age, height, weight, sport, goals, profilePicture } = req.body;

            if (age !== undefined) athlete.age = age;
            if (height !== undefined) athlete.height = height;
            if (weight !== undefined) athlete.weight = weight;
            if (sport !== undefined) athlete.sport = sport;
            if (goals !== undefined) athlete.goals = goals;
            if (profilePicture !== undefined) athlete.profilePicture = profilePicture;

            athlete.lastActive = new Date();

            const updatedAthlete = await athleteRepo.save(athlete);

            const athleteWithRelations = await athleteRepo.findOne({
                where: { id: updatedAthlete.id },
                relations: ["user"]
            });

            res.json(athleteWithRelations);
        } catch (error) {
            console.error("Error updating athlete:", error);
            res.status(500).json({ message: "Error updating athlete" });
        }
    };

    // GET /api/athletes/:id/stats - Get athlete statistics
    static getStats = async (req: Request, res: Response) => {
        try {
            const athleteId = parseInt(req.params.id as string);
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const { Program } = await import("../entities/Program");
            const { Session } = await import("../entities/Session");
            const { Goal } = await import("../entities/Goal");

            const programRepo = AppDataSource.getRepository(Program);
            const sessionRepo = AppDataSource.getRepository(Session);
            const goalRepo = AppDataSource.getRepository(Goal);

            const athlete = await athleteRepo.findOne({ where: { id: athleteId } });
            if (!athlete) {
                return res.status(404).json({ message: "Athlete not found" });
            }

            // Get stats
            const totalPrograms = await programRepo.count({ where: { athleteId } });
            const totalSessions = await sessionRepo.count({ where: { athleteId } });
            const completedSessions = await sessionRepo.count({
                where: { athleteId, status: "completed" }
            });
            const activeGoals = await goalRepo.count({
                where: { athleteId, status: "active" }
            });

            // Calculate adherence (completed sessions / total sessions)
            const adherence = totalSessions > 0
                ? Math.round((completedSessions / totalSessions) * 100)
                : 0;

            res.json({
                totalPrograms,
                totalSessions,
                completedSessions,
                activeGoals,
                adherence
            });
        } catch (error) {
            console.error("Error fetching athlete stats:", error);
            res.status(500).json({ message: "Error fetching athlete stats" });
        }
    };
}
