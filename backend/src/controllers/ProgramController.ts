import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Program } from "../entities/Program";
import { Athlete } from "../entities/Athlete";
import { User } from "../entities/User";
import { ProgramDay } from "../entities/ProgramDay";
import { ProgramExercise } from "../entities/ProgramExercise";
import { WorkoutLog } from "../entities/WorkoutLog";
import { EmailService } from "../utils/EmailService";
import { CoachProfile } from "../entities/Coach";
import { canAccessAthlete } from "../utils/authorization";
import { notifyUser } from "../utils/notificationHelper";
import { Session } from "../entities/Session";

export class ProgramController {
    static getTodayWorkout = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            let userId = parseInt(req.params.userId as string);


            if (user.role === 'athlete' && user.id !== userId) {
                console.warn(`Security Warning: User ${user.id} attempted to access workout for user ${userId}`);
                userId = user.id;
            }

            const programRepo = AppDataSource.getRepository(Program);
            const workoutLogRepo = AppDataSource.getRepository(WorkoutLog);
            const sessionRepo = AppDataSource.getRepository(Session);
            const athleteRepo = AppDataSource.getRepository(Athlete);

            const athlete = await athleteRepo.findOne({ where: { userId } });
            if (!athlete) {
                return res.json({ program: null, day: null, workoutLog: null, message: "No athlete profile found" });
            }


            const activeProgram = await programRepo.findOne({
                where: { athleteId: athlete.id, status: "active", isConfigured: true },
                relations: ["coach"],
                order: { created_at: "DESC" },
            });

            if (!activeProgram) {
                return res.json({ program: null, day: null, workoutLog: null, athleteId: athlete.id, message: "No active program found" });
            }


            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];


            const session = await sessionRepo.createQueryBuilder("session")
                .where("session.athleteId = :athleteId", { athleteId: athlete.id })
                .andWhere("CAST(session.date AS DATE) = :today", { today: todayStr })
                .getOne();


            const existingLog = await workoutLogRepo.createQueryBuilder("log")
                .where("log.athleteId = :athleteId", { athleteId: athlete.id })
                .andWhere("CAST(log.scheduledDate AS DATE) = :today", { today: todayStr })
                .getOne();


            const startDateStr = new Date(activeProgram.startDate).toISOString().split('T')[0];
            
            if (todayStr < startDateStr) {

                const start = new Date(startDateStr);
                const diffTime = start.getTime() - today.getTime();
                const daysUntilStart = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                res.json({
                    program: activeProgram,
                    day: null,
                    isRestDay: true,
                    notStarted: true,
                    daysUntilStart: daysUntilStart,
                    workoutLog: existingLog || null,
                    athleteId: athlete.id,
                });
                return;
            }


            let dayData = null;
            if (session) {
                dayData = {
                    id: session.id,
                    title: session.title,
                    exercises: session.workoutData?.exercises || []
                };
            }

            res.json({
                program: { 
                    id: activeProgram.id, 
                    name: activeProgram.name, 
                    description: activeProgram.description, 
                    type: activeProgram.type, 
                    startDate: activeProgram.startDate, 
                    coachName: activeProgram.coach ? `Coach` : null 
                },
                day: dayData,
                isRestDay: !session,
                workoutLog: existingLog || null,
                athleteId: athlete.id,
            });
        } catch (error) {
            console.error("Error fetching today's workout:", error);
            res.status(500).json({ message: "Error fetching today's workout" });
        }
    };


    static getAll = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const user = (req as any).user;
            let { coachId, athleteId, status } = req.query;

            const queryBuilder = programRepo.createQueryBuilder("program")
                .leftJoinAndSelect("program.athlete", "athlete")
                .leftJoinAndSelect("athlete.user", "athleteUser")
                .leftJoinAndSelect("program.coach", "coach")
                .leftJoinAndSelect("program.days", "days")
                .leftJoinAndSelect("days.exercises", "exercises");


            if (user.role === 'athlete') {
                let athlete = await athleteRepo.findOne({ where: { userId: user.id } });
                if (!athlete) {
                    console.log(`[DEBUG] Auto-creating missing athlete profile for user ${user.id} in ProgramController.getAll`);
                    athlete = athleteRepo.create({ userId: user.id, lastActive: new Date() });
                    await athleteRepo.save(athlete);
                }
                queryBuilder.andWhere("program.athleteId = :myAthleteId", { myAthleteId: athlete.id });
            } else {

                if (coachId) {
                    queryBuilder.andWhere("program.coachId = :coachId", { coachId });
                }
                if (athleteId) {
                    const targetAthleteId = parseInt(athleteId as string);
                    if (!(await canAccessAthlete(user, targetAthleteId))) {
                        return res.status(403).json({ message: "Access denied: You do not have permission to view this athlete's programs" });
                    }
                    queryBuilder.andWhere("program.athleteId = :athleteId", { athleteId });
                }
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


    static getById = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const programRepo = AppDataSource.getRepository(Program);
            const athleteRepo = AppDataSource.getRepository(Athlete);

            const programId = parseInt(req.params.id as string);
            const program = await programRepo.findOne({
                where: { id: programId },
                relations: ["athlete", "athlete.user", "coach", "days", "days.exercises"]
            });

            if (!program) {
                return res.status(404).json({ message: "Program not found" });
            }



            const coachOwnsProgram = user.role === 'coach' && program.coachId === user.id;
            if (!coachOwnsProgram) {
                if (!(await canAccessAthlete(user, program.athleteId!))) {
                    return res.status(403).json({ message: "Access denied: You do not have permission to access this program" });
                }
            }

            res.json(program);
        } catch (error) {
            console.error("Error fetching program:", error);
            res.status(500).json({ message: "Error fetching program" });
        }
    };


    static create = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const programRepo = AppDataSource.getRepository(Program);
            const { name, description, athleteId, coachId, startDate, endDate, type, days } = req.body;

            if (athleteId && !(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You cannot create a program for this athlete" });
            }

            const program = new Program();
            program.name = name;
            program.description = description;
            program.athleteId = athleteId || undefined;
            program.coachId = coachId;


            if (!req.body.coachProfileId && coachId) {
                const coachRepo = AppDataSource.getRepository(CoachProfile);
                const profile = await coachRepo.findOne({ where: { userId: coachId } });
                if (profile) program.coachProfileId = profile.id;
            } else if (req.body.coachProfileId) {
                program.coachProfileId = req.body.coachProfileId;
            }

            program.startDate = new Date(startDate);
            program.endDate = endDate ? new Date(endDate) : undefined;
            program.type = type;
            program.status = req.body.status || (athleteId ? "assigned" : "draft");
            program.isConfigured = false;

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
                            ex.targetWeights = exData.targetWeights || [];
                            ex.rest_seconds = exData.rest_seconds || 60;
                            ex.order = exData.order !== undefined ? exData.order : index;
                            ex.programDay = day;
                            return ex;
                        });
                    }
                    return day;
                });
            }

            if (athleteId && program.status === 'assigned') {
                await programRepo.delete({
                    athleteId: athleteId,
                    coachId: coachId,
                    status: 'assigned'
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


    static update = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
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

            const { name, description, status, endDate, type, days, athleteId, isConfigured, startDate } = req.body;



            const coachOwnsProgram = user.role === 'coach' && program.coachId === user.id;
            if (!coachOwnsProgram) {
                const targetAthleteId = athleteId ?? program.athleteId;
                if (targetAthleteId && !(await canAccessAthlete(user, targetAthleteId))) {
                    return res.status(403).json({ message: "Access denied: You do not have permission to update this program" });
                }
            }


            if (name) program.name = name;
            if (description !== undefined) program.description = description;
            if (status) program.status = status;
            if (athleteId !== undefined) program.athleteId = athleteId;
            if (isConfigured !== undefined) program.isConfigured = isConfigured;
            if (startDate) program.startDate = new Date(startDate);
            if (endDate) program.endDate = new Date(endDate);
            if (type) program.type = type;


            if (!program.coachProfileId && program.coachId) {
                const coachRepo = AppDataSource.getRepository(CoachProfile);
                const profile = await coachRepo.findOne({ where: { userId: program.coachId } });
                if (profile) {
                    program.coachProfileId = profile.id;
                }
            }

            const wasAssigning = athleteId && (!program.athleteId || program.status === 'draft' || program.status === 'quit');
            if (program.athleteId && (program.status === 'active' && !program.isConfigured || program.status === 'assigned')) {
                if (program.status === 'active') program.status = 'assigned';
            }

            if (days && Array.isArray(days)) {

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
                            ex.targetWeights = exData.targetWeights || [];
                            ex.rest_seconds = exData.rest_seconds || 60;
                            ex.order = exData.order !== undefined ? exData.order : index;
                            ex.programDay = day;
                            return ex;
                        });
                    }
                    return day;
                });
            }

            const updatedProgram = await programRepo.save(program);

            if (wasAssigning && updatedProgram.athleteId && updatedProgram.status === "assigned") {
                const athleteWithUser = await AppDataSource.getRepository(Athlete).findOne({
                    where: { id: updatedProgram.athleteId },
                    relations: ["user"],
                });
                if (athleteWithUser?.user?.id) {
                    notifyUser(
                        athleteWithUser.user.id,
                        "program_assigned",
                        "New program assigned",
                        `Your coach assigned you the program "${updatedProgram.name}". Review and accept it to get started.`,
                        { programId: updatedProgram.id }
                    );
                }
                const { ActivityEvent } = await import("../entities/ActivityEvent");
                const eventRepo = AppDataSource.getRepository(ActivityEvent);
                await eventRepo.save(
                    eventRepo.create({
                        athleteId: updatedProgram.athleteId,
                        type: "program_assigned",
                        payload: { programId: updatedProgram.id, programName: updatedProgram.name },
                    })
                );
            }

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


    static quit = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const programRepo = AppDataSource.getRepository(Program);
            const program = await programRepo.findOne({
                where: { id: parseInt(req.params.id as string) },
                relations: ["athlete", "athlete.user"]
            });

            if (!program) {
                return res.status(404).json({ message: "Program not found" });
            }

            if (program.athlete?.user?.id !== user.id && user.role !== 'coach' && user.role !== 'manager') {
                return res.status(403).json({ message: "Access denied" });
            }

            program.status = program.status === 'assigned' ? 'declined' : 'quit';
            await programRepo.save(program);


            await AppDataSource.getRepository(Session).delete({
                programId: program.id,
                status: "upcoming"
            });

            if (program.coachId && program.athlete?.user?.first_name) {
                notifyUser(
                    program.coachId,
                    "program_quit",
                    program.status === 'declined' ? "Program Declined" : "Program Quit",
                    `The athlete ${program.athlete.user.first_name} has ${program.status === 'declined' ? 'declined' : 'quit'} the program "${program.name}".`,
                    { programId: program.id }
                ).catch(err => console.error("Notification Error:", err));
            }

            res.json({ message: "Program quit successfully", program });
        } catch (error) {
            console.error("Error quitting program:", error);
            res.status(500).json({ message: "Error quitting program" });
        }
    };


    static delete = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const programRepo = AppDataSource.getRepository(Program);
            const program = await programRepo.findOne({
                where: { id: parseInt(req.params.id as string) }
            });

            if (!program) {
                return res.status(404).json({ message: "Program not found" });
            }

            if (!(await canAccessAthlete(user, program.athleteId!))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to delete this program" });
            }

            await programRepo.remove(program);
            res.json({ message: "Program deleted successfully" });
        } catch (error) {
            console.error("Error deleting program:", error);
            res.status(500).json({ message: "Error deleting program" });
        }
    };


    
    static assign = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const programRepo = AppDataSource.getRepository(Program);
            const dayRepo = AppDataSource.getRepository(ProgramDay);
            const exerciseRepo = AppDataSource.getRepository(ProgramExercise);

            const templateId = parseInt(req.params.id as string);
            const { athleteId } = req.body;

            if (!athleteId) {
                return res.status(400).json({ message: "athleteId is required" });
            }


            const template = await programRepo.findOne({
                where: { id: templateId },
                relations: ["days", "days.exercises"]
            });

            if (!template) {
                return res.status(404).json({ message: "Program not found" });
            }

            if (user.role === 'coach' && template.coachId !== user.id) {
                return res.status(403).json({ message: "Access denied: You do not own this program" });
            }


            const copy = new Program();
            copy.name = template.name;
            copy.description = template.description;
            copy.type = template.type;
            copy.coachId = template.coachId;
            copy.coachProfileId = template.coachProfileId;
            copy.athleteId = athleteId;
            copy.status = 'assigned';
            copy.isConfigured = false;
            copy.startDate = new Date();
            copy.is_template = false;


            await programRepo.delete({
                athleteId: athleteId,
                coachId: template.coachId,
                status: 'assigned'
            });


            const savedCopy = await programRepo.save(copy);


            for (const dayData of (template.days || [])) {
                const newDay = new ProgramDay();
                newDay.day_number = dayData.day_number;
                newDay.title = dayData.title;
                newDay.programId = savedCopy.id;
                const savedDay = await dayRepo.save(newDay);

                for (const exData of (dayData.exercises || [])) {
                    const newEx = new ProgramExercise();
                    newEx.exercise_id = exData.exercise_id;
                    newEx.exercise_name = exData.exercise_name;
                    newEx.exercise_gif = exData.exercise_gif;
                    newEx.sets = exData.sets;
                    newEx.reps = exData.reps;
                    newEx.rest_seconds = exData.rest_seconds;
                    newEx.order = exData.order;
                    newEx.programDayId = savedDay.id;
                    await exerciseRepo.save(newEx);
                }
            }


            const athleteWithUser = await AppDataSource.getRepository(Athlete).findOne({
                where: { id: athleteId },
                relations: ["user"],
            });
            if (athleteWithUser?.user?.id) {
                notifyUser(
                    athleteWithUser.user.id,
                    "program_assigned",
                    "New program assigned",
                    `Your coach assigned you the program "${savedCopy.name}". Review and accept it to get started.`,
                    { programId: savedCopy.id }
                ).catch(err => console.error("Notify error:", err));
            }

            const programWithRelations = await programRepo.findOne({
                where: { id: savedCopy.id },
                relations: ["athlete", "athlete.user", "coach", "days", "days.exercises"]
            });

            res.status(201).json({ message: "Program assigned successfully", program: programWithRelations });
        } catch (error) {
            console.error("Error assigning program:", error);
            res.status(500).json({ message: "Error assigning program" });
        }
    };


    static acceptProgram = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const programId = parseInt(req.params.id as string);
            const { scheduleConfig, startDate } = req.body;

            const program = await programRepo.findOne({
                where: { id: programId },
                relations: ["athlete", "athlete.user", "coach", "days", "days.exercises"]
            });

            if (!program) {
                return res.status(404).json({ message: "Program not found" });
            }

            if (!program.athleteId) {
                return res.status(400).json({ message: "Program has no athlete assigned" });
            }

            const sessionRepo = AppDataSource.getRepository(Session);


            const existingActive = await programRepo.find({
                where: { athleteId: program.athleteId, status: "active" }
            });
            for (const active of existingActive) {
                if (active.id !== program.id) {
                    active.status = "replaced";
                    await programRepo.save(active);


                    await sessionRepo.delete({
                        athleteId: program.athleteId,
                        programId: active.id,
                        status: "upcoming"
                    });
                }
            }

            program.status = "active";
            program.isConfigured = true;
            program.scheduleConfig = scheduleConfig;
            if (startDate) {
                program.startDate = new Date(startDate);
            }

            await programRepo.save(program);



            await sessionRepo.delete({
                athleteId: program.athleteId,
                status: "upcoming"
            });

            const athleteRepo = AppDataSource.getRepository(Athlete);
            const athlete = await athleteRepo.findOne({ where: { id: program.athleteId } });

            let preferredDays = scheduleConfig?.trainingDays;
            if (preferredDays && Array.isArray(preferredDays) && preferredDays.length > 0) {

                if (athlete) {
                    athlete.preferredTrainingDays = preferredDays;
                    await athleteRepo.save(athlete);
                }
            } else {
                preferredDays = athlete?.preferredTrainingDays && athlete.preferredTrainingDays.length > 0
                    ? athlete.preferredTrainingDays
                    : [0, 1, 2, 3, 4, 5, 6];
            }

            let currentSessionDate = new Date(program.startDate);



            for (const day of program.days || []) {

                let attempts = 0;
                while (attempts < 30) {
                    const dayOfWeek = (currentSessionDate.getDay() + 6) % 7;
                    if (preferredDays.includes(dayOfWeek)) {
                        const session = new Session();
                        session.athleteId = program.athleteId;
                        session.programId = program.id;
                        session.coachId = program.coachId;
                        session.date = new Date(currentSessionDate);
                        session.time = "12:00";
                        session.type = program.type || "Strength";
                        session.title = day.title;
                        session.status = "upcoming";
                        session.workoutData = {
                            exercises: day.exercises.map(e => ({
                                id: e.id,
                                exercise_id: e.exercise_id,
                                name: e.exercise_name,
                                gifUrl: e.exercise_gif,
                                sets: e.sets,
                                reps: e.reps,
                                rest_seconds: e.rest_seconds,
                                order: e.order
                            }))
                        };
                        await sessionRepo.save(session);
                        

                        currentSessionDate.setDate(currentSessionDate.getDate() + 1);
                        break;
                    }
                    currentSessionDate.setDate(currentSessionDate.getDate() + 1);
                    attempts++;
                }
            }


            if (program.coach?.email && program.athlete?.user) {
                const athleteName = `${program.athlete.user.first_name || ''} ${program.athlete.user.last_name || ''}`.trim() || program.athlete.user.email;
                EmailService.sendProgramAcceptanceNotification(
                    program.coach.email,
                    athleteName,
                    program.name
                ).catch(err => console.error("Failed to send coach notification:", err));
            }

            res.json({ message: "Program accepted and configured successfully", program });
        } catch (error) {
            console.error("Error accepting program:", error);
            res.status(500).json({ message: "Error accepting program" });
        }
    };
}
