import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { WorkoutLog } from "../entities/WorkoutLog";
import { ExerciseLog } from "../entities/ExerciseLog";
import { ActivityEvent } from "../entities/ActivityEvent";
import { canAccessAthlete } from "../utils/authorization";
import { notifyCoachesOfAthlete } from "../utils/notificationHelper";

export class WorkoutLogController {
    static getAthleteHistory = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const athleteId = parseInt(req.params.athleteId as string);
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view this athlete's workout history" });
            }
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;

            const repo = AppDataSource.getRepository(WorkoutLog);
            const [logs, total] = await repo.findAndCount({
                where: { athleteId },
                relations: ["program", "programDay", "programDay.exercises"],
                order: { scheduledDate: "DESC" },
                take: limit,
                skip: offset,
            });

            res.json({ logs, total, limit, offset });
        } catch (error) {
            console.error("Error fetching workout history:", error);
            res.status(500).json({ message: "Error fetching workout history" });
        }
    };


    static getAthleteStats = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const athleteId = parseInt(req.params.athleteId as string);
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view this athlete's stats" });
            }
            const repo = AppDataSource.getRepository(WorkoutLog);

            const allLogs = await repo.find({
                where: { athleteId },
                order: { scheduledDate: "DESC" },
            });

            const completed = allLogs.filter(l => l.status === "completed");
            const missed = allLogs.filter(l => l.status === "missed");
            const total = allLogs.length;

            const adherence = total > 0 ? Math.round((completed.length / total) * 100) : 0;


            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let checkDate = new Date(today);

            for (let i = 0; i < 365; i++) {
                const dateStr = checkDate.toISOString().split("T")[0];
                const log = allLogs.find(l => {
                    const logDate = new Date(l.scheduledDate).toISOString().split("T")[0];
                    return logDate === dateStr && l.status === "completed";
                });
                if (log) {
                    streak++;
                } else if (i > 0) {

                    break;
                }
                checkDate.setDate(checkDate.getDate() - 1);
            }

            const totalMinutes = completed.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

            res.json({
                totalSessions: total,
                completedSessions: completed.length,
                missedSessions: missed.length,
                adherencePercent: adherence,
                currentStreak: streak,
                totalMinutes,
            });
        } catch (error) {
            console.error("Error fetching athlete stats:", error);
            res.status(500).json({ message: "Error fetching athlete stats" });
        }
    };


    static getById = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const repo = AppDataSource.getRepository(WorkoutLog);
            const log = await repo.findOne({
                where: { id: parseInt(req.params.id as string) },
                relations: ["program", "programDay", "programDay.exercises", "session"],
            });

            if (!log) return res.status(404).json({ message: "Workout log not found" });
            if (!(await canAccessAthlete(user, log.athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view this workout log" });
            }


            const exerciseLogRepo = AppDataSource.getRepository(ExerciseLog);
            const exerciseLogs = await exerciseLogRepo.find({ where: { workoutLogId: log.id }, order: { created_at: "ASC" } });

            res.json({ ...log, exerciseLogs });
        } catch (error) {
            console.error("Error fetching workout log:", error);
            res.status(500).json({ message: "Error fetching workout log" });
        }
    };


    static create = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { athleteId, programId, programDayId, sessionId, scheduledDate } = req.body;

            if (!athleteId) return res.status(400).json({ message: "athleteId is required" });
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to create a workout for this athlete" });
            }

            const repo = AppDataSource.getRepository(WorkoutLog);


            const today = scheduledDate || new Date().toISOString().split("T")[0];
            const existing = await repo.findOne({
                where: { athleteId, scheduledDate: new Date(today) }
            });

            if (existing && existing.status === "in_progress") {
                return res.json(existing);
            }
            if (existing && existing.status === "completed") {
                return res.json(existing);
            }

            const log = new WorkoutLog();
            log.athleteId = athleteId;
            log.programId = programId;
            log.programDayId = programDayId || null;
            log.sessionId = sessionId || null;
            log.scheduledDate = new Date(today);
            log.status = "in_progress";

            const saved = await repo.save(log);
            const withRelations = await repo.findOne({
                where: { id: saved.id },
                relations: ["program", "programDay", "programDay.exercises", "session"],
            });
            res.status(201).json(withRelations);
        } catch (error) {
            console.error("Error creating workout log:", error);
            res.status(500).json({ message: "Error creating workout log" });
        }
    };


    static update = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const repo = AppDataSource.getRepository(WorkoutLog);
            const log = await repo.findOne({ where: { id: parseInt(req.params.id as string) } });

            if (!log) return res.status(404).json({ message: "Workout log not found" });
            if (!(await canAccessAthlete(user, log.athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to update this workout log" });
            }

            const { status, durationMinutes, notes, overallRating } = req.body;

            if (status) log.status = status;
            if (status === "completed") {
                log.completedAt = new Date();
                const eventRepo = AppDataSource.getRepository(ActivityEvent);
                await eventRepo.save(
                    eventRepo.create({
                        athleteId: log.athleteId,
                        type: "workout_completed",
                        payload: {
                            workoutLogId: log.id,
                            durationMinutes: durationMinutes,
                            overallRating,
                        },
                    })
                );
                notifyCoachesOfAthlete(
                    log.athleteId,
                    "workout_completed",
                    "Workout completed",
                    `An athlete completed their workout.`,
                    { workoutLogId: log.id }
                );
            }
            if (status === "missed") {
                notifyCoachesOfAthlete(
                    log.athleteId,
                    "workout_missed",
                    "Workout missed",
                    `An athlete missed their scheduled workout.`,
                    { workoutLogId: log.id }
                );
            }
            if (durationMinutes !== undefined) log.durationMinutes = durationMinutes;
            if (notes !== undefined) log.notes = notes;
            if (overallRating !== undefined) log.overallRating = overallRating;

            const saved = await repo.save(log);
            res.json(saved);
        } catch (error) {
            console.error("Error updating workout log:", error);
            res.status(500).json({ message: "Error updating workout log" });
        }
    };


    static quit = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const repo = AppDataSource.getRepository(WorkoutLog);
            const log = await repo.findOne({ where: { id: parseInt(req.params.id as string) } });

            if (!log) return res.status(404).json({ message: "Workout log not found" });
            if (!(await canAccessAthlete(user, log.athleteId))) {
                return res.status(403).json({ message: "Access denied" });
            }

            log.status = "missed";
            await repo.save(log);

            notifyCoachesOfAthlete(
                log.athleteId,
                "workout_missed",
                "Workout Quit",
                `An athlete has quit their workout.`,
                { workoutLogId: log.id }
            );

            res.json(log);
        } catch (error) {
            console.error("Error quitting workout log:", error);
            res.status(500).json({ message: "Error quitting workout log" });
        }
    };


    static logExercise = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const workoutLogId = parseInt(req.params.id as string);

            const logRepo = AppDataSource.getRepository(WorkoutLog);
            const workoutLog = await logRepo.findOne({ where: { id: workoutLogId } });
            if (!workoutLog) return res.status(404).json({ message: "Workout log not found" });
            if (!(await canAccessAthlete(user, workoutLog.athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to log exercises for this workout" });
            }

            const { programExerciseId, exercise_name, exercise_id, setsCompleted, repsPerSet, weightKgPerSet, notes } = req.body;

            const exerciseLogRepo = AppDataSource.getRepository(ExerciseLog);


            let existingLog = await exerciseLogRepo.findOne({
                where: { workoutLogId, ...(programExerciseId ? { programExerciseId } : {}) }
            });

            if (!existingLog) {
                existingLog = new ExerciseLog();
                existingLog.workoutLogId = workoutLogId;
            }

            existingLog.exercise_name = exercise_name;
            if (exercise_id) existingLog.exercise_id = exercise_id;
            if (programExerciseId) existingLog.programExerciseId = programExerciseId;
            if (setsCompleted !== undefined) existingLog.setsCompleted = setsCompleted;
            if (repsPerSet) existingLog.repsPerSet = repsPerSet;
            if (weightKgPerSet) existingLog.weightKgPerSet = weightKgPerSet;
            if (notes !== undefined) existingLog.notes = notes;

            const saved = await exerciseLogRepo.save(existingLog);

            // PR Detection Logic
            let isPr = false;
            let currentMaxWeight = 0;
            if (weightKgPerSet && Array.isArray(weightKgPerSet) && weightKgPerSet.length > 0) {
                currentMaxWeight = Math.max(...weightKgPerSet);
            }

            if (currentMaxWeight > 0) {
                const prevLogs = await exerciseLogRepo.createQueryBuilder("el")
                    .innerJoin("el.workoutLog", "wl")
                    .where("wl.athleteId = :athleteId", { athleteId: workoutLog.athleteId })
                    .andWhere("el.exercise_name = :exercise_name", { exercise_name })
                    .andWhere("el.workoutLogId != :currentLogId", { currentLogId: workoutLogId })
                    .getMany();

                let historicalMaxWeight = 0;
                prevLogs.forEach(pl => {
                    if (pl.weightKgPerSet && Array.isArray(pl.weightKgPerSet)) {
                        const m = Math.max(...pl.weightKgPerSet);
                        if (m > historicalMaxWeight) historicalMaxWeight = m;
                    }
                });

                if (currentMaxWeight > historicalMaxWeight && historicalMaxWeight > 0) {
                    isPr = true;
                    const eventRepo = AppDataSource.getRepository(ActivityEvent);
                    await eventRepo.save(
                        eventRepo.create({
                            athleteId: workoutLog.athleteId,
                            type: "new_pr",
                            payload: { exercise_name, weightKg: currentMaxWeight },
                        })
                    );
                }
            }

            res.status(201).json({ ...saved, isPr });
        } catch (error) {
            console.error("Error logging exercise:", error);
            res.status(500).json({ message: "Error logging exercise" });
        }
    };

    static start = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const workoutLogId = parseInt(req.params.id as string);

            const logRepo = AppDataSource.getRepository(WorkoutLog);
            const workoutLog = await logRepo.findOne({
                where: { id: workoutLogId },
                relations: ["program", "programDay", "programDay.exercises"],
            });
            if (!workoutLog) return res.status(404).json({ message: "Workout log not found" });
            if (!(await canAccessAthlete(user, workoutLog.athleteId))) {
                return res.status(403).json({ message: "Access denied" });
            }

            if (workoutLog.status === "scheduled") {
                workoutLog.status = "in_progress";
                await logRepo.save(workoutLog);

                const eventRepo = AppDataSource.getRepository(ActivityEvent);
                await eventRepo.save(
                    eventRepo.create({
                        athleteId: workoutLog.athleteId,
                        type: "workout_started",
                        payload: {
                            workoutLogId,
                            programId: workoutLog.programId,
                            programDayId: workoutLog.programDayId,
                        },
                    })
                );
            }

            res.json(workoutLog);
        } catch (error) {
            console.error("Error starting workout:", error);
            res.status(500).json({ message: "Error starting workout" });
        }
    };

    static emitEvent = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const workoutLogId = parseInt(req.params.id as string);
            const { type, payload } = req.body;

            if (!type) return res.status(400).json({ message: "type is required" });

            const logRepo = AppDataSource.getRepository(WorkoutLog);
            const workoutLog = await logRepo.findOne({ where: { id: workoutLogId } });
            if (!workoutLog) return res.status(404).json({ message: "Workout log not found" });
            if (!(await canAccessAthlete(user, workoutLog.athleteId))) {
                return res.status(403).json({ message: "Access denied" });
            }

            const eventRepo = AppDataSource.getRepository(ActivityEvent);
            const event = eventRepo.create({
                athleteId: workoutLog.athleteId,
                type,
                payload: { workoutLogId, ...(payload || {}) },
            });
            const saved = await eventRepo.save(event);

            if (type === "workout_completed") {
                workoutLog.status = "completed";
                workoutLog.completedAt = new Date();
                if (payload?.durationMinutes) workoutLog.durationMinutes = payload.durationMinutes;
                if (payload?.notes) workoutLog.notes = payload.notes;
                if (payload?.overallRating) workoutLog.overallRating = payload.overallRating;
                await logRepo.save(workoutLog);
                notifyCoachesOfAthlete(
                    workoutLog.athleteId,
                    "workout_completed",
                    "Workout completed",
                    `An athlete completed their workout.`,
                    { workoutLogId }
                );
            }
            if (type === "quiz_answer" && payload?.pain) {
                notifyCoachesOfAthlete(
                    workoutLog.athleteId,
                    "pain_reported",
                    "Pain reported",
                    `An athlete reported pain during ${payload.exercise_name || "an exercise"}.`,
                    { workoutLogId, ...payload }
                );
            }

            res.status(201).json(saved);
        } catch (error) {
            console.error("Error emitting workout event:", error);
            res.status(500).json({ message: "Error emitting workout event" });
        }
    };
}
