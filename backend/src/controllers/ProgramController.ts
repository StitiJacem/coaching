import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Program } from "../entities/Program";
import { Athlete } from "../entities/Athlete";
import { User } from "../entities/User";
import { ProgramDay } from "../entities/ProgramDay";
import { ProgramExercise } from "../entities/ProgramExercise";
import { WorkoutLog } from "../entities/WorkoutLog";

export class ProgramController {
    // GET /api/programs/athlete/:userId/today – returns the current day's workout for an athlete
    static getTodayWorkout = async (req: Request, res: Response) => {
        try {
            const userId = parseInt(req.params.userId as string);
            const programRepo = AppDataSource.getRepository(Program);
            const workoutLogRepo = AppDataSource.getRepository(WorkoutLog);

            // Find the user's athlete record
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const athlete = await athleteRepo.findOne({ where: { userId } });
            if (!athlete) {
                return res.json({ program: null, day: null, workoutLog: null, message: "No athlete profile found" });
            }

            // Find active program for this athlete
            const program = await programRepo.findOne({
                where: { athleteId: athlete.id, status: "active" },
                relations: ["days", "days.exercises", "coach"],
                order: { created_at: "DESC" },
            });

            if (!program || !program.days || program.days.length === 0) {
                return res.json({ program: null, day: null, workoutLog: null, message: "No active program assigned" });
            }

            // Sort days by day_number
            const sortedDays = [...program.days].sort((a, b) => a.day_number - b.day_number);

            // Compute which day in the cycle to show
            const start = new Date(program.startDate);
            start.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const dayIndex = daysSinceStart % sortedDays.length;
            const currentDay = sortedDays[dayIndex];

            // Check for existing workout log today
            const todayStr = today.toISOString().split("T")[0];
            const existingLog = await workoutLogRepo.findOne({
                where: { athleteId: athlete.id, scheduledDate: today },
            });

            res.json({
                program: { id: program.id, name: program.name, description: program.description, type: program.type, startDate: program.startDate, coachName: program.coach ? `Coach` : null },
                day: currentDay,
                workoutLog: existingLog || null,
                athleteId: athlete.id,
                daysSinceStart,
            });
        } catch (error) {
            console.error("Error fetching today's workout:", error);
            res.status(500).json({ message: "Error fetching today's workout" });
        }
    };

    // GET /api/programs - Get all programs (with filters)
    static getAll = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const { coachId, athleteId, status } = req.query;

            const queryBuilder = programRepo.createQueryBuilder("program")
                .leftJoinAndSelect("program.athlete", "athlete")
                .leftJoinAndSelect("athlete.user", "athleteUser")
                .leftJoinAndSelect("program.coach", "coach")
                .leftJoinAndSelect("program.days", "days")
                .leftJoinAndSelect("days.exercises", "exercises");

            if (coachId) {
                queryBuilder.andWhere("program.coachId = :coachId", { coachId });
            }
            if (athleteId) {
                queryBuilder.andWhere("program.athleteId = :athleteId", { athleteId });
            }
            if (status) {
                queryBuilder.andWhere("program.status = :status", { status });
            }

            const programs = await queryBuilder.orderBy("program.id", "DESC").getMany();
            res.json(programs);
        } catch (error) {
            console.error("Error fetching programs:", error);
            res.status(500).json({ message: "Error fetching programs" });
        }
    };

    // GET /api/programs/:id - Get single program
    static getById = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const program = await programRepo.findOne({
                where: { id: parseInt(req.params.id as string) },
                relations: ["athlete", "athlete.user", "coach", "days", "days.exercises"]
            });

            if (!program) {
                return res.status(404).json({ message: "Program not found" });
            }

            res.json(program);
        } catch (error) {
            console.error("Error fetching program:", error);
            res.status(500).json({ message: "Error fetching program" });
        }
    };

    // POST /api/programs - Create new program
    static create = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const { name, description, athleteId, coachId, startDate, endDate, type, days } = req.body;

            const program = new Program();
            program.name = name;
            program.description = description;
            program.athleteId = athleteId;
            program.coachId = coachId;
            program.startDate = new Date(startDate);
            program.endDate = endDate ? new Date(endDate) : undefined;
            program.type = type;
            program.status = "active";

            if (days && Array.isArray(days)) {
                program.days = days.map((dayData: any) => {
                    const day = new ProgramDay();
                    day.day_number = dayData.day_number;
                    day.title = dayData.title;

                    if (dayData.exercises && Array.isArray(dayData.exercises)) {
                        day.exercises = dayData.exercises.map((exData: any, index: number) => {
                            const ex = new ProgramExercise();
                            ex.exercise_id = exData.exercise_id;
                            ex.exercise_name = exData.exercise_name;
                            ex.exercise_gif = exData.exercise_gif;
                            ex.sets = exData.sets || 3;
                            ex.reps = exData.reps || 12;
                            ex.order = exData.order || index;
                            return ex;
                        });
                    }
                    return day;
                });
            }

            const savedProgram = await programRepo.save(program);

            const programWithRelations = await programRepo.findOne({
                where: { id: savedProgram.id },
                relations: ["athlete", "athlete.user", "coach", "days", "days.exercises"]
            });

            res.status(201).json(programWithRelations);
        } catch (error) {
            console.error("Error creating program:", error);
            res.status(500).json({ message: "Error creating program" });
        }
    };

    // PUT /api/programs/:id - Update program
    static update = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const dayRepo = AppDataSource.getRepository(ProgramDay);

            const programId = parseInt(req.params.id as string);
            const program = await programRepo.findOne({
                where: { id: programId },
                relations: ["days", "days.exercises"]
            });

            if (!program) {
                return res.status(404).json({ message: "Program not found" });
            }

            const { name, description, status, endDate, type, days } = req.body;

            if (name) program.name = name;
            if (description !== undefined) program.description = description;
            if (status) program.status = status;
            if (endDate) program.endDate = new Date(endDate);
            if (type) program.type = type;

            if (days && Array.isArray(days)) {
                // Clear existing days to rebuild hierarchy (prevents orphaned records in this MVP)
                if (program.days && program.days.length > 0) {
                    await dayRepo.remove(program.days);
                }

                program.days = days.map((dayData: any) => {
                    const day = new ProgramDay();
                    day.day_number = dayData.day_number;
                    day.title = dayData.title;
                    day.programId = program.id;

                    if (dayData.exercises && Array.isArray(dayData.exercises)) {
                        day.exercises = dayData.exercises.map((exData: any, index: number) => {
                            const ex = new ProgramExercise();
                            ex.exercise_id = exData.exercise_id;
                            ex.exercise_name = exData.exercise_name;
                            ex.exercise_gif = exData.exercise_gif;
                            ex.sets = exData.sets || 3;
                            ex.reps = exData.reps || 12;
                            ex.order = exData.order || index;
                            return ex;
                        });
                    }
                    return day;
                });
            }

            const updatedProgram = await programRepo.save(program);

            const programWithRelations = await programRepo.findOne({
                where: { id: updatedProgram.id },
                relations: ["athlete", "athlete.user", "coach", "days", "days.exercises"]
            });

            res.json(programWithRelations);
        } catch (error) {
            console.error("Error updating program:", error);
            res.status(500).json({ message: "Error updating program" });
        }
    };

    // DELETE /api/programs/:id - Delete program
    static delete = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const program = await programRepo.findOne({
                where: { id: parseInt(req.params.id as string) }
            });

            if (!program) {
                return res.status(404).json({ message: "Program not found" });
            }

            await programRepo.remove(program);
            res.json({ message: "Program deleted successfully" });
        } catch (error) {
            console.error("Error deleting program:", error);
            res.status(500).json({ message: "Error deleting program" });
        }
    };
}
