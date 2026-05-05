import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Session } from "../entities/Session";
import { WorkoutLog } from "../entities/WorkoutLog";
import { Athlete } from "../entities/Athlete";
import { BodyMetric } from "../entities/BodyMetric";

export class SessionController {
    static async createSession(req: Request, res: Response) {
        try {
            const { athleteId, date, time, type, status, title, notes, duration, workoutData, programId } = req.body;
            const coachId = (req as any).user?.id;

            const sessionRepository = AppDataSource.getRepository(Session);
            const workoutLogRepository = AppDataSource.getRepository(WorkoutLog);

            // Rest & Overtraining check: Has the athlete already worked out today?
            // Check for a completed WorkoutLog on this date
            const existingLog = await workoutLogRepository.findOne({
                where: { 
                    athleteId: athleteId,
                    scheduledDate: new Date(date) 
                }
            });

            if (existingLog && existingLog.completedAt) {
                // If they have completed a workout today, warning
                return res.status(400).json({ 
                    message: "Athlete has already completed a session on this date. Ensure adequate rest before adding another.",
                    overtrainingWarning: true
                });
            }

            const newSession = sessionRepository.create({
                athleteId,
                coachId,
                programId,
                date: date ? new Date(date) : new Date(),
                time: time || "12:00",
                type,
                status: status || "upcoming",
                title,
                workoutData: {
                    ...(workoutData || {}),
                    notes: notes || '',
                    duration: duration || null
                }
            });

            await sessionRepository.save(newSession);

            res.status(201).json(newSession);
        } catch (error) {
            console.error("Error creating session:", error);
            res.status(500).json({ message: "Server error creating session" });
        }
    }

    static async getSessions(req: Request, res: Response) {
        try {
            const { athleteId, programId, date } = req.query;
            const sessionRepository = AppDataSource.getRepository(Session);

            let whereClause: any = {};
            if (athleteId) whereClause.athleteId = Number(athleteId);
            if (programId) whereClause.programId = Number(programId);
            if (date) whereClause.date = new Date(date as string);

            const sessions = await sessionRepository.find({
                where: whereClause,
                order: { date: "ASC", time: "ASC" }
            });

            res.json(sessions);
        } catch (error) {
            console.error("Error fetching sessions:", error);
            res.status(500).json({ message: "Server error fetching sessions" });
        }
    }

    static async getSessionById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const sessionRepository = AppDataSource.getRepository(Session);

            const session = await sessionRepository.findOne({ where: { id: Number(id) } });
            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            res.json(session);
        } catch (error) {
            console.error("Error fetching session:", error);
            res.status(500).json({ message: "Server error fetching session" });
        }
    }

    static async updateSession(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const sessionRepository = AppDataSource.getRepository(Session);

            const session = await sessionRepository.findOne({ where: { id: Number(id) } });
            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            if (updateData.date) {
                updateData.date = new Date(updateData.date);
            }

            // Move notes and duration into workoutData if present
            if (updateData.notes !== undefined || updateData.duration !== undefined) {
                updateData.workoutData = updateData.workoutData || session.workoutData || {};
                if (updateData.notes !== undefined) updateData.workoutData.notes = updateData.notes;
                if (updateData.duration !== undefined) updateData.workoutData.duration = updateData.duration;
                delete updateData.notes;
                delete updateData.duration;
            }

            sessionRepository.merge(session, updateData);
            await sessionRepository.save(session);

            res.json(session);
        } catch (error) {
            console.error("Error updating session:", error);
            res.status(500).json({ message: "Server error updating session" });
        }
    }

    static async deleteSession(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const sessionRepository = AppDataSource.getRepository(Session);

            const session = await sessionRepository.findOne({ where: { id: Number(id) } });
            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            await sessionRepository.remove(session);

            res.json({ message: "Session deleted successfully" });
        } catch (error) {
            console.error("Error deleting session:", error);
            res.status(500).json({ message: "Server error deleting session" });
        }
    }
}
