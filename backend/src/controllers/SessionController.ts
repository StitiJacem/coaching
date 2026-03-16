import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Session } from "../entities/Session";
import { Athlete } from "../entities/Athlete";
import { Program } from "../entities/Program";
const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) throw new Error("Missing parameter");
    return Array.isArray(param) ? param[0] : param;
};

export class SessionController {
    // GET /api/sessions - Get all sessions (with filters)
    static getAll = async (req: Request, res: Response) => {
        try {
            const sessionRepo = AppDataSource.getRepository(Session);
            const { athleteId, programId, date, status } = req.query;

            const queryBuilder = sessionRepo.createQueryBuilder("session")
                .leftJoinAndSelect("session.athlete", "athlete")
                .leftJoinAndSelect("athlete.user", "athleteUser")
                .leftJoinAndSelect("session.program", "program");

            if (athleteId) {
                queryBuilder.where("session.athleteId = :athleteId", { athleteId });
            }
            if (programId) {
                queryBuilder.andWhere("session.programId = :programId", { programId });
            }
            if (date) {
                const targetDate = new Date(date as string);
                const nextDay = new Date(targetDate);
                nextDay.setDate(nextDay.getDate() + 1);
                queryBuilder.andWhere("session.date >= :date AND session.date < :nextDay", {
                    date: targetDate,
                    nextDay
                });
            } else if (req.query.startDate && req.query.endDate) {
                queryBuilder.andWhere("session.date >= :startDate AND session.date <= :endDate", {
                    startDate: req.query.startDate,
                    endDate: req.query.endDate
                });
            }
            if (status) {
                queryBuilder.andWhere("session.status = :status", { status });
            }

            queryBuilder.orderBy("session.date", "ASC").addOrderBy("session.time", "ASC");

            const sessions = await queryBuilder.getMany();
            res.json(sessions);
        } catch (error) {
            console.error("Error fetching sessions:", error);
            res.status(500).json({ message: "Error fetching sessions" });
        }
    };

    // GET /api/sessions/:id - Get single session
    static getById = async (req: Request, res: Response) => {
        try {
            const sessionRepo = AppDataSource.getRepository(Session);
            const session = await sessionRepo.findOne({
                where: { id: parseInt(req.params.id as string) },
                relations: ["athlete", "athlete.user", "program"]
            });

            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            res.json(session);
        } catch (error) {
            console.error("Error fetching session:", error);
            res.status(500).json({ message: "Error fetching session" });
        }
    };

    // POST /api/sessions - Create new session
    static create = async (req: Request, res: Response) => {
        try {
            const sessionRepo = AppDataSource.getRepository(Session);
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const programRepo = AppDataSource.getRepository(Program);

            const { athleteId, programId, date, time, type, duration, notes } = req.body;

            if (!athleteId || !date || !time || !type) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            // Verify athlete exists
            const athlete = await athleteRepo.findOne({ where: { id: athleteId } });
            if (!athlete) {
                return res.status(404).json({ message: "Athlete not found" });
            }

            // Verify program exists if provided
            if (programId) {
                const program = await programRepo.findOne({ where: { id: programId } });
                if (!program) {
                    return res.status(404).json({ message: "Program not found" });
                }
            }

            const session = new Session();
            session.athleteId = athleteId;
            session.programId = programId;
            session.date = new Date(date);
            session.time = time;
            session.type = type;
            session.duration = duration;
            session.notes = notes;
            session.title = req.body.title;
            session.workoutData = req.body.workoutData;
            session.status = "upcoming";

            const savedSession = await sessionRepo.save(session);

            const sessionWithRelations = await sessionRepo.findOne({
                where: { id: savedSession.id },
                relations: ["athlete", "athlete.user", "program"]
            });

            res.status(201).json(sessionWithRelations);
        } catch (error) {
            console.error("Error creating session:", error);
            res.status(500).json({ message: "Error creating session" });
        }
    };

    // PUT /api/sessions/:id - Update session
    static update = async (req: Request, res: Response) => {
        try {
            const sessionRepo = AppDataSource.getRepository(Session);
            const session = await sessionRepo.findOne({
                where: { id: parseInt(req.params.id as string) }
            });

            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            const { date, time, type, duration, notes, status } = req.body;

            if (date) session.date = new Date(date);
            if (time) session.time = time;
            if (type) session.type = type;
            if (duration !== undefined) session.duration = duration;
            if (notes !== undefined) session.notes = notes;
            if (req.body.title !== undefined) session.title = req.body.title;
            if (req.body.workoutData !== undefined) session.workoutData = req.body.workoutData;
            if (status) session.status = status;

            const updatedSession = await sessionRepo.save(session);

            const sessionWithRelations = await sessionRepo.findOne({
                where: { id: updatedSession.id },
                relations: ["athlete", "athlete.user", "program"]
            });

            res.json(sessionWithRelations);
        } catch (error) {
            console.error("Error updating session:", error);
            res.status(500).json({ message: "Error updating session" });
        }
    };

    // DELETE /api/sessions/:id - Delete session
    static delete = async (req: Request, res: Response) => {
        try {
            const sessionRepo = AppDataSource.getRepository(Session);
            const session = await sessionRepo.findOne({
                where: { id: parseInt(req.params.id as string) }
            });

            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            await sessionRepo.remove(session);
            res.json({ message: "Session deleted successfully" });
        } catch (error) {
            console.error("Error deleting session:", error);
            res.status(500).json({ message: "Error deleting session" });
        }
    };
}
