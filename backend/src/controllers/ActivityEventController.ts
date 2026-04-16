import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { ActivityEvent } from "../entities/ActivityEvent";
import { Program } from "../entities/Program";
import { WorkoutLog } from "../entities/WorkoutLog";
import { canAccessAthlete } from "../utils/authorization";

export class ActivityEventController {
    static getTimeline = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const athleteId = parseInt(req.params.id as string);
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view this athlete's timeline" });
            }

            const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
            const offset = parseInt(req.query.offset as string) || 0;

            const repo = AppDataSource.getRepository(ActivityEvent);
            const [events, total] = await repo.findAndCount({
                where: { athleteId },
                order: { created_at: "DESC" },
                take: limit,
                skip: offset,
            });

            const programRepo = AppDataSource.getRepository(Program);
            const workoutRepo = AppDataSource.getRepository(WorkoutLog);
            const assignedPrograms = await programRepo.count({ where: { athleteId, status: "assigned" } });
            const activePrograms = await programRepo.count({ where: { athleteId, status: "active" } });
            const recentWorkouts = await workoutRepo.find({
                where: { athleteId },
                order: { scheduledDate: "DESC" },
                take: 5,
            });

            res.json({
                events,
                total,
                limit,
                offset,
                context: {
                    assignedProgramsPending: assignedPrograms,
                    hasActiveProgram: activePrograms > 0,
                    recentWorkouts: recentWorkouts.map((w) => ({
                        id: w.id,
                        scheduledDate: w.scheduledDate,
                        status: w.status,
                        programId: w.programId,
                    })),
                },
            });
        } catch (error) {
            console.error("Error fetching timeline:", error);
            res.status(500).json({ message: "Error fetching timeline" });
        }
    };

    static create = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const athleteId = parseInt(req.params.id as string);
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to create events for this athlete" });
            }

            const { type, payload } = req.body;
            if (!type) {
                return res.status(400).json({ message: "type is required" });
            }

            const repo = AppDataSource.getRepository(ActivityEvent);
            const event = repo.create({
                athleteId,
                type,
                payload: payload || undefined,
            });
            const saved = await repo.save(event);
            res.status(201).json(saved);
        } catch (error) {
            console.error("Error creating activity event:", error);
            res.status(500).json({ message: "Error creating activity event" });
        }
    };
}
