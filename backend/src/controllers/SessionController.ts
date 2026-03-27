import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Session } from "../entities/Session";
import { Athlete } from "../entities/Athlete";
import { Program } from "../entities/Program";
import { canAccessAthlete } from "../utils/authorization";

const getStringParam = (param: string | string[] | undefined): string => {
    if (!param) throw new Error("Missing parameter");
    return Array.isArray(param) ? param[0] : param;
};

export class SessionController {
    static getAll = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const sessionRepo = AppDataSource.getRepository(Session);
            const { athleteId, programId, date, status } = req.query;

            if (!athleteId) {
                return res.status(400).json({ message: "athleteId is required" });
            }

            const targetAthleteId = parseInt(athleteId as string);
            if (!(await canAccessAthlete(user, targetAthleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view these sessions" });
            }

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
                queryBuilder.andWhere("CAST(session.date AS DATE) = :date", { date });
            }
 else if (req.query.startDate && req.query.endDate) {
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


    static getById = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const sessionRepo = AppDataSource.getRepository(Session);
            const session = await sessionRepo.findOne({
                where: { id: parseInt(req.params.id as string) },
                relations: ["athlete", "athlete.user", "program"]
            });

            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            if (!(await canAccessAthlete(user, session.athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view this session" });
            }

            res.json(session);
        } catch (error) {
            console.error("Error fetching session:", error);
            res.status(500).json({ message: "Error fetching session" });
        }
    };


    static create = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const sessionRepo = AppDataSource.getRepository(Session);
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const programRepo = AppDataSource.getRepository(Program);

            const { athleteId, programId, coachId, date, time, type, duration, notes } = req.body;

            if (!athleteId || !date || !time || !type) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            if (!(await canAccessAthlete(user, parseInt(athleteId as string)))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to create sessions for this athlete" });
            }


            const athlete = await athleteRepo.findOne({ where: { id: athleteId } });
            if (!athlete) {
                return res.status(404).json({ message: "Athlete not found" });
            }


            if (programId) {
                const program = await programRepo.findOne({ where: { id: programId } });
                if (!program) {
                    return res.status(404).json({ message: "Program not found" });
                }
            }

            const session = new Session();
            session.athleteId = athleteId;
            session.programId = programId;
            session.coachId = coachId;
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


    static update = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const sessionRepo = AppDataSource.getRepository(Session);
            const session = await sessionRepo.findOne({
                where: { id: parseInt(req.params.id as string) }
            });

            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            if (!(await canAccessAthlete(user, session.athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to update this session" });
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


    static delete = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const sessionRepo = AppDataSource.getRepository(Session);
            const session = await sessionRepo.findOne({
                where: { id: parseInt(req.params.id as string) }
            });

            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            if (!(await canAccessAthlete(user, session.athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to delete this session" });
            }

            await sessionRepo.remove(session);
            res.json({ message: "Session deleted successfully" });
        } catch (error) {
            console.error("Error deleting session:", error);
        }
    };

    static sync = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { athleteId, sessions } = req.body;

            if (!athleteId) {
                return res.status(400).json({ message: "athleteId is required" });
            }

            if (!(await canAccessAthlete(user, parseInt(athleteId)))) {
                return res.status(403).json({ message: "Access denied" });
            }

            await AppDataSource.transaction(async transactionalEntityManager => {
                // 1. Delete all upcoming sessions for this athlete
                // Note: We only delete upcoming ones to preserve history/logs
                await transactionalEntityManager.delete(Session, {
                    athleteId: athleteId,
                    status: "upcoming"
                });

                // 2. Insert new sessions
                if (sessions && sessions.length > 0) {
                    const sessionsToSave = sessions.map((s: any) => {
                        const newSession = new Session();
                        newSession.athleteId = athleteId;
                        newSession.coachId = s.coachId || user.id;
                        newSession.programId = s.programId;
                        newSession.date = new Date(s.date);
                        newSession.time = s.time || "08:00";
                        newSession.title = s.title;
                        newSession.type = s.type;
                        newSession.duration = s.duration || 45;
                        newSession.status = "upcoming";
                        newSession.workoutData = s.workoutData;
                        return newSession;
                    });
                    await transactionalEntityManager.save(Session, sessionsToSave);
                }
            });

            res.json({ message: "Sessions synchronized successfully" });
        } catch (error) {
            console.error("Error syncing sessions:", error);
            res.status(500).json({ message: "Error syncing sessions" });
        }
    };
}
