import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Goal } from "../entities/Goal";
import { Athlete } from "../entities/Athlete";
import { canAccessAthlete } from "../utils/authorization";

export class GoalController {
    static getAll = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const goalRepo = AppDataSource.getRepository(Goal);
            const { athleteId, status } = req.query;

            if (!athleteId) {
                return res.status(400).json({ message: "athleteId is required" });
            }
            const targetAthleteId = parseInt(athleteId as string);
            if (!(await canAccessAthlete(user, targetAthleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view these goals" });
            }

            const queryBuilder = goalRepo.createQueryBuilder("goal")
                .leftJoinAndSelect("goal.athlete", "athlete")
                .leftJoinAndSelect("athlete.user", "athleteUser");

            queryBuilder.where("goal.athleteId = :athleteId", { athleteId: targetAthleteId });
            if (status) {
                queryBuilder.andWhere("goal.status = :status", { status });
            }

            queryBuilder.orderBy("goal.created_at", "DESC");

            const goals = await queryBuilder.getMany();
            res.json(goals);
        } catch (error) {
            console.error("Error fetching goals:", error);
            res.status(500).json({ message: "Error fetching goals" });
        }
    };


    static getById = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const goalRepo = AppDataSource.getRepository(Goal);
            const goal = await goalRepo.findOne({
                where: { id: parseInt(req.params.id as string) },
                relations: ["athlete", "athlete.user"]
            });

            if (!goal) {
                return res.status(404).json({ message: "Goal not found" });
            }
            if (!(await canAccessAthlete(user, goal.athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view this goal" });
            }

            res.json(goal);
        } catch (error) {
            console.error("Error fetching goal:", error);
            res.status(500).json({ message: "Error fetching goal" });
        }
    };


    static create = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const goalRepo = AppDataSource.getRepository(Goal);
            const athleteRepo = AppDataSource.getRepository(Athlete);

            const { athleteId, name, targetValue, currentValue, unit, deadline } = req.body;

            if (!athleteId || !name) {
                return res.status(400).json({ message: "Missing required fields" });
            }
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to create goals for this athlete" });
            }

            const athlete = await athleteRepo.findOne({ where: { id: athleteId } });
            if (!athlete) {
                return res.status(404).json({ message: "Athlete not found" });
            }

            const goal = new Goal();
            goal.athleteId = athleteId;
            goal.name = name;
            goal.targetValue = targetValue;
            goal.currentValue = currentValue || 0;
            goal.unit = unit;
            goal.deadline = deadline ? new Date(deadline) : undefined;
            goal.status = "active";

            const savedGoal = await goalRepo.save(goal);

            const goalWithRelations = await goalRepo.findOne({
                where: { id: savedGoal.id },
                relations: ["athlete", "athlete.user"]
            });

            res.status(201).json(goalWithRelations);
        } catch (error) {
            console.error("Error creating goal:", error);
            res.status(500).json({ message: "Error creating goal" });
        }
    };


    static update = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const goalRepo = AppDataSource.getRepository(Goal);
            const goal = await goalRepo.findOne({
                where: { id: parseInt(req.params.id as string) }
            });

            if (!goal) {
                return res.status(404).json({ message: "Goal not found" });
            }
            if (!(await canAccessAthlete(user, goal.athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to update this goal" });
            }

            const { name, targetValue, currentValue, unit, deadline, status } = req.body;

            if (name) goal.name = name;
            if (targetValue !== undefined) goal.targetValue = targetValue;
            if (currentValue !== undefined) goal.currentValue = currentValue;
            if (unit !== undefined) goal.unit = unit;
            if (deadline !== undefined) goal.deadline = deadline ? new Date(deadline) : undefined;
            if (status) goal.status = status;

            const updatedGoal = await goalRepo.save(goal);

            const goalWithRelations = await goalRepo.findOne({
                where: { id: updatedGoal.id },
                relations: ["athlete", "athlete.user"]
            });

            res.json(goalWithRelations);
        } catch (error) {
            console.error("Error updating goal:", error);
            res.status(500).json({ message: "Error updating goal" });
        }
    };


    static delete = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const goalRepo = AppDataSource.getRepository(Goal);
            const goal = await goalRepo.findOne({
                where: { id: parseInt(req.params.id as string) }
            });

            if (!goal) {
                return res.status(404).json({ message: "Goal not found" });
            }
            if (!(await canAccessAthlete(user, goal.athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to delete this goal" });
            }

            await goalRepo.remove(goal);
            res.json({ message: "Goal deleted successfully" });
        } catch (error) {
            console.error("Error deleting goal:", error);
            res.status(500).json({ message: "Error deleting goal" });
        }
    };
}
