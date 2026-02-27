import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { WorkoutLog } from "../entities/WorkoutLog";
import { ExerciseLog } from "../entities/ExerciseLog";
import { Athlete } from "../entities/Athlete";

export class WorkoutLogController {

    // GET /api/workout-logs/athlete/:athleteId — paginated history
    static getAthleteHistory = async (req: Request, res: Response) => {
        try {
            const athleteId = parseInt(req.params.athleteId as string);
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

    // GET /api/workout-logs/athlete/:athleteId/stats
    static getAthleteStats = async (req: Request, res: Response) => {
        try {
            const athleteId = parseInt(req.params.athleteId as string);
            const repo = AppDataSource.getRepository(WorkoutLog);

            const allLogs = await repo.find({
                where: { athleteId },
                order: { scheduledDate: "DESC" },
            });

            const completed = allLogs.filter(l => l.status === "completed");
            const missed = allLogs.filter(l => l.status === "missed");
            const total = allLogs.length;

            const adherence = total > 0 ? Math.round((completed.length / total) * 100) : 0;

            // Calculate streak: consecutive completed days from today backwards
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
                    // Allow today to be not completed yet without breaking streak
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

    // GET /api/workout-logs/:id — single workout log with exercise logs
    static getById = async (req: Request, res: Response) => {
        try {
            const repo = AppDataSource.getRepository(WorkoutLog);
            const log = await repo.findOne({
                where: { id: parseInt(req.params.id as string) },
                relations: ["program", "programDay", "programDay.exercises"],
            });

            if (!log) return res.status(404).json({ message: "Workout log not found" });

            // Fetch exercise logs for this workout
            const exerciseLogRepo = AppDataSource.getRepository(ExerciseLog);
            const exerciseLogs = await exerciseLogRepo.find({ where: { workoutLogId: log.id }, order: { created_at: "ASC" } });

            res.json({ ...log, exerciseLogs });
        } catch (error) {
            console.error("Error fetching workout log:", error);
            res.status(500).json({ message: "Error fetching workout log" });
        }
    };

    // POST /api/workout-logs — start a workout
    static create = async (req: Request, res: Response) => {
        try {
            const { athleteId, programId, programDayId, scheduledDate } = req.body;

            if (!athleteId) return res.status(400).json({ message: "athleteId is required" });

            const repo = AppDataSource.getRepository(WorkoutLog);

            // Check if there's already an in-progress or completed log for this day
            const today = scheduledDate || new Date().toISOString().split("T")[0];
            const existing = await repo.findOne({
                where: { athleteId, scheduledDate: new Date(today) }
            });

            if (existing && existing.status === "in_progress") {
                return res.json(existing); // Return existing in-progress log
            }
            if (existing && existing.status === "completed") {
                return res.json(existing); // Already completed today
            }

            const log = new WorkoutLog();
            log.athleteId = athleteId;
            log.programId = programId;
            log.programDayId = programDayId;
            log.scheduledDate = new Date(today);
            log.status = "in_progress";

            const saved = await repo.save(log);
            const withRelations = await repo.findOne({
                where: { id: saved.id },
                relations: ["program", "programDay", "programDay.exercises"],
            });
            res.status(201).json(withRelations);
        } catch (error) {
            console.error("Error creating workout log:", error);
            res.status(500).json({ message: "Error creating workout log" });
        }
    };

    // PUT /api/workout-logs/:id — update workout (complete, miss, add notes/rating)
    static update = async (req: Request, res: Response) => {
        try {
            const repo = AppDataSource.getRepository(WorkoutLog);
            const log = await repo.findOne({ where: { id: parseInt(req.params.id as string) } });

            if (!log) return res.status(404).json({ message: "Workout log not found" });

            const { status, durationMinutes, notes, overallRating } = req.body;

            if (status) log.status = status;
            if (status === "completed") log.completedAt = new Date();
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

    // POST /api/workout-logs/:id/exercises — log an exercise within a workout
    static logExercise = async (req: Request, res: Response) => {
        try {
            const workoutLogId = parseInt(req.params.id as string);

            // Verify workout log exists
            const logRepo = AppDataSource.getRepository(WorkoutLog);
            const workoutLog = await logRepo.findOne({ where: { id: workoutLogId } });
            if (!workoutLog) return res.status(404).json({ message: "Workout log not found" });

            const { programExerciseId, exercise_name, exercise_id, setsCompleted, repsPerSet, weightKgPerSet, notes } = req.body;

            const exerciseLogRepo = AppDataSource.getRepository(ExerciseLog);

            // Upsert: if already logged this exercise in this workout, update it
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
            res.status(201).json(saved);
        } catch (error) {
            console.error("Error logging exercise:", error);
            res.status(500).json({ message: "Error logging exercise" });
        }
    };
}
