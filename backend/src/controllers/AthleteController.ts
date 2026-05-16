import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Athlete } from "../entities/Athlete";
import { User } from "../entities/User";
import { CoachProfile } from "../entities/Coach";
import { UserInvitation } from "../entities/UserInvitation";
import { CoachingRequest } from "../entities/CoachingRequest";
import { EmailService } from "../utils/EmailService";
import { Brackets } from "typeorm";
import { canAccessAthlete } from "../utils/authorization";
import { BodyMetric } from "../entities/BodyMetric";
import { NutritionistProfile } from "../entities/NutritionistProfile";
import { NutritionConnection } from "../entities/NutritionConnection";
import { Notification } from "../entities/Notification";
import { Program } from "../entities/Program";
import { resolveAthleteId } from "../utils/resolveAthlete";
import { sendPushNotification } from "../utils/firebase";

export class AthleteController {

    static getAll = async (req: Request, res: Response) => {
        try {
            // debug log removed
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const { search, sport } = req.query;

            const queryBuilder = athleteRepo.createQueryBuilder("athlete")
                .leftJoinAndSelect("athlete.user", "user");


            const user = (req as any).user;
            if (user && user.role === 'coach') {
                const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
                const coachProfile = await coachProfileRepo.findOne({ where: { userId: user.id } });

                if (!coachProfile) {

                    // debug log removed
                    const newProfile = coachProfileRepo.create({ userId: user.id });
                    await coachProfileRepo.save(newProfile);
                    return res.json([]);
                }



                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where(
                        `EXISTS (SELECT 1 FROM programs p WHERE p."athleteId" = athlete.id AND p."coachId" = :coachId)`
                    );
                    qb.orWhere(
                        `EXISTS (SELECT 1 FROM coaching_requests cr WHERE cr."athleteId" = athlete.id AND cr."coachProfileId" = :profileId AND cr.status = 'accepted')`
                    );
                }))
                .setParameters({ 
                    coachId: user.id, 
                    profileId: coachProfile.id 
                });
            } else if (user && user.role === 'nutritionist') {
                const nutritionistProfileRepo = AppDataSource.getRepository("NutritionistProfile");
                const profile = await nutritionistProfileRepo.findOne({ where: { userId: user.id } });
                
                if (!profile) {
                    return res.json([]);
                }
                
                queryBuilder.andWhere(
                    `EXISTS (SELECT 1 FROM nutrition_connections nc WHERE nc."athleteId" = athlete.id AND nc."nutritionistProfileId" = :nutritionistId AND nc.status = 'accepted')`,
                    { nutritionistId: (profile as any).id }
                );
            } else if (user && user.role === 'athlete') {

                queryBuilder.andWhere("athlete.userId = :userId", { userId: user.id });
            } else {
                return res.status(403).json({ message: "Access denied: Unauthorized role" });
            }

            if (search) {
                queryBuilder.andWhere(
                    "(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)",
                    { search: `%${search}%` }
                );
            }
            if (sport) {
                queryBuilder.andWhere("athlete.sport = :sport", { sport });
            }

            queryBuilder.orderBy("athlete.lastActive", "DESC");

            const athletes = await queryBuilder.getMany();
            const uniqueAthletes = Array.from(new Map(athletes.map(a => [a.id, a])).values());
            res.json(uniqueAthletes);
        } catch (error) {
            console.error("Error fetching athletes:", error);
            res.status(500).json({ message: "Error fetching athletes" });
        }
    };


    static getById = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const athleteId = parseInt(req.params.id as string);
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view this athlete" });
            }
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const athlete = await athleteRepo.findOne({
                where: { id: athleteId },
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


    static invite = async (req: Request, res: Response) => {
        try {
            const { email, message } = req.body;
            const coachId = (req as any).user.id;
            const coachRole = (req as any).user.role;

            const userRepo = AppDataSource.getRepository(User);
            const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
            const inviteRepo = AppDataSource.getRepository(UserInvitation);
            const athleteRepo = AppDataSource.getRepository(Athlete);

            let inviterProfile: any;
            if (coachRole === 'coach') {
                let coachProfile = await coachProfileRepo.findOne({ where: { userId: coachId } });
                if (!coachProfile) {
                    // debug log removed
                    coachProfile = coachProfileRepo.create({ userId: coachId });
                    await coachProfileRepo.save(coachProfile);
                }
                inviterProfile = coachProfile;
            } else if (coachRole === 'nutritionist') {
                const nutriProfileRepo = AppDataSource.getRepository(NutritionistProfile);
                let nutriProfile = await nutriProfileRepo.findOne({ where: { userId: coachId } });
                if (!nutriProfile) {
                    // debug log removed
                    nutriProfile = nutriProfileRepo.create({ userId: coachId });
                    await nutriProfileRepo.save(nutriProfile);
                }
                inviterProfile = nutriProfile;
            } else {
                return res.status(403).json({ message: "Only coaches and nutritionists can invite athletes" });
            }

            const existingUser = await userRepo.findOne({ where: { email } });

            if (existingUser) {
                if (existingUser.role !== 'athlete') {
                    return res.status(400).json({ message: "This user is already a professional and cannot be invited as an athlete" });
                }

                let athlete = await athleteRepo.findOne({ where: { userId: existingUser.id } });
                if (!athlete) {
                    athlete = athleteRepo.create({ userId: existingUser.id, lastActive: new Date() });
                    await athleteRepo.save(athlete);
                }

                if (coachRole === 'coach') {
                    const coachingRequestRepo = AppDataSource.getRepository(CoachingRequest);
                    const existingRequest = await coachingRequestRepo.findOne({
                        where: { athleteId: athlete.id, coachProfileId: inviterProfile.id, status: 'pending' }
                    });
                    if (existingRequest) return res.status(400).json({ message: "A pending coaching request already exists" });

                    const request = coachingRequestRepo.create({
                        athleteId: athlete.id,
                        coachProfileId: inviterProfile.id,
                        message: message || `Invitation from ${ (req as any).user.first_name || 'your coach'}`,
                        status: 'pending',
                        initiator: "coach"
                    });
                    const savedReq = await coachingRequestRepo.save(request);

                    // Create Notification
                    const title = 'Nouvelle demande de coaching';
                    const body = `${(req as any).user.first_name || 'Un coach'} souhaite vous ajouter à ses athlètes.`;
                    
                    const notifRepo = AppDataSource.getRepository(Notification);
                    await notifRepo.save(notifRepo.create({
                        userId: existingUser.id,
                        type: 'coach_invite',
                        title,
                        body,
                        payload: { requestId: savedReq.id }
                    }));

                    // Send Push Notification
                    if (existingUser.fcmToken) {
                        await sendPushNotification(existingUser.fcmToken, title, body, { requestId: savedReq.id.toString(), type: 'coach_invite' });
                    }
                } else {
                    // Nutritionist
                    const connectionRepo = AppDataSource.getRepository(NutritionConnection);
                    const existingConn = await connectionRepo.findOne({
                        where: { athleteId: athlete.id, nutritionistProfileId: inviterProfile.id, status: 'pending' }
                    });
                    if (existingConn) return res.status(400).json({ message: "A pending nutrition request already exists" });

                    const connection = connectionRepo.create({
                        athleteId: athlete.id,
                        nutritionistProfileId: inviterProfile.id,
                        message: message || `Invitation from ${ (req as any).user.first_name || 'your nutritionist'}`,
                        status: 'pending',
                        initiator: "nutritionist"
                    });
                    const savedConn = await connectionRepo.save(connection);

                    // Create Notification
                    const title = 'Nouvelle demande (Nutrition)';
                    const body = `${(req as any).user.first_name || 'Un nutritionniste'} souhaite vous suivre.`;
                    
                    const notifRepo = AppDataSource.getRepository(Notification);
                    await notifRepo.save(notifRepo.create({
                        userId: existingUser.id,
                        type: 'nutrition_invite',
                        title,
                        body,
                        payload: { connectionId: savedConn.id }
                    }));

                    // Send Push Notification
                    if (existingUser.fcmToken) {
                        await sendPushNotification(existingUser.fcmToken, title, body, { connectionId: savedConn.id.toString(), type: 'nutrition_invite' });
                    }
                }

                return res.status(201).json({
                    message: "Invitation sent! A connection request has been sent to the existing user.",
                    type: 'internal_request'
                });
            }

            const existingInvite = await inviteRepo.findOne({ where: { email, coachId, status: 'pending' } });
            if (existingInvite) {
                return res.status(400).json({ message: "An invitation has already been sent to this email address" });
            }

            const invitation = inviteRepo.create({
                email,
                coachId,
                message,
                status: 'pending'
            });
            await inviteRepo.save(invitation);

            const coachName = (req as any).user.first_name || 'Un professionnel';
            const signupUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/signup?email=${encodeURIComponent(email)}`;
            
            await EmailService.sendAthleteInvitation(email, coachName, coachRole, signupUrl);

            res.status(201).json({
                message: "Invitation email sent successfully!",
                type: 'email_invitation'
            });

        } catch (error: any) {
            console.error("Error inviting athlete:", error);
            res.status(500).json({ message: "Error inviting athlete" });
        }
    };


    static update = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const athleteId = parseInt(req.params.id as string);
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to update this athlete" });
            }
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const athlete = await athleteRepo.findOne({
                where: { id: athleteId },
                relations: ["user"]
            });

            if (!athlete) {
                return res.status(404).json({ message: "Athlete not found" });
            }

            const {
                age, height, weight, sport, goals, profilePicture, preferredTrainingDays,
                primaryObjective, targetMetric, deadline, timePerSession, injuries, experienceLevel, equipment,
                first_name, last_name
            } = req.body;

            if (age !== undefined) athlete.age = age;
            if (height !== undefined) athlete.height = height;
            if (weight !== undefined) athlete.weight = weight;
            if (sport !== undefined) athlete.sport = sport;
            if (goals !== undefined) athlete.goals = goals;
            if (profilePicture !== undefined) athlete.profilePicture = profilePicture;
            if (preferredTrainingDays !== undefined) athlete.preferredTrainingDays = preferredTrainingDays;

            // Update linked User info
            if (first_name || last_name) {
                const userRepo = AppDataSource.getRepository(User);
                const userEntity = athlete.user;
                if (first_name) userEntity.first_name = first_name;
                if (last_name) userEntity.last_name = last_name;
                await userRepo.save(userEntity);
            }

            if (primaryObjective !== undefined) athlete.primaryObjective = primaryObjective;
            if (targetMetric !== undefined) athlete.targetMetric = targetMetric;
            if (deadline !== undefined) athlete.deadline = deadline ? new Date(deadline) : undefined;
            if (timePerSession !== undefined) athlete.timePerSession = timePerSession;
            if (injuries !== undefined) athlete.injuries = injuries;
            if (experienceLevel !== undefined) athlete.experienceLevel = experienceLevel;
            if (equipment !== undefined) athlete.equipment = equipment;

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


    static getStats = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const athleteId = parseInt(req.params.id as string);
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view this athlete's stats" });
            }
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


            const totalPrograms = await programRepo.count({ where: { athleteId } });
            const totalSessions = await sessionRepo.count({ where: { athleteId } });
            const completedSessions = await sessionRepo.count({
                where: { athleteId, status: "completed" }
            });
            const activeGoals = await goalRepo.count({
                where: { athleteId, status: "active" }
            });


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

    static getMetrics = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const athleteId = parseInt(req.params.id as string);
            if (!(await canAccessAthlete(user, athleteId))) {
                return res.status(403).json({ message: "Access denied: You do not have permission to view this athlete's metrics" });
            }
            const metricRepo = AppDataSource.getRepository(BodyMetric);
            const metrics = await metricRepo.find({
                where: { athleteId },
                order: { date: "ASC" }
            });
            res.json(metrics);
        } catch (error) {
            console.error("Error fetching athlete metrics:", error);
            res.status(500).json({ message: "Error fetching athlete metrics" });
        }
    };

    static addMetric = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const athleteId = parseInt(req.params.id as string);
            
            console.log(`AddMetric: AthleteID=${athleteId}, UserID=${user?.id}, Role=${user?.role}`);
            console.log('Metric Payload:', req.body);

            if (!(await canAccessAthlete(user, athleteId))) {
                console.warn('Access denied for AddMetric');
                return res.status(403).json({ message: "Access denied: You do not have permission to add metrics" });
            }

            const { date, weight, bodyFat, vo2max, notes } = req.body;

            const metricRepo = AppDataSource.getRepository(BodyMetric);
            const metric = metricRepo.create({
                athleteId,
                date: date ? new Date(date) : new Date(),
                weight: weight ? Number(weight) : undefined,
                bodyFat: bodyFat ? Number(bodyFat) : undefined,
                vo2max: vo2max ? Number(vo2max) : undefined,
                notes
            });

            console.log('Created Metric Entity:', metric);

            const savedMetric = await metricRepo.save(metric);
            console.log('Saved Metric Success:', savedMetric.id);

            if (weight) {
                const athleteRepo = AppDataSource.getRepository(Athlete);
                await athleteRepo.update(athleteId, { weight: Number(weight) });
                console.log('Updated Athlete current weight');
            }

            res.status(201).json(savedMetric);
        } catch (error: any) {
            console.error("CRITICAL ERROR adding athlete metric:", error);
            res.status(500).json({ 
                message: "Error adding athlete metric", 
                error: error.message,
                detail: error.detail || 'No additional details'
            });
        }
    };

    static getOverview = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const paramId = parseInt(req.params.id as string);
            
            const athleteId = await resolveAthleteId(user, paramId);
            const athleteRepo = AppDataSource.getRepository(Athlete);
            
            const athlete = await athleteRepo.findOne({ where: { id: athleteId }, relations: ["user"] });

            if (!athlete) return res.status(404).json({ message: "Athlete record not found for this identifier" });

            if (!(await canAccessAthlete(user, athlete.id))) {
                return res.status(403).json({ message: "Access denied to this athlete profile" });
            }

            const { Program } = await import("../entities/Program");
            const { Session } = await import("../entities/Session");
            const { WorkoutLog } = await import("../entities/WorkoutLog");
            const { ActivityEvent } = await import("../entities/ActivityEvent");
            const { Goal } = await import("../entities/Goal");

            const programRepo = AppDataSource.getRepository(Program);
            const sessionRepo = AppDataSource.getRepository(Session);
            const logRepo = AppDataSource.getRepository(WorkoutLog);
            const eventRepo = AppDataSource.getRepository(ActivityEvent);
            const metricRepo = AppDataSource.getRepository(BodyMetric);
            const goalRepo = AppDataSource.getRepository(Goal);



            const today = new Date(); today.setHours(0,0,0,0);
            const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7);
            const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30);
            const nextWeekEnd = new Date(today); nextWeekEnd.setDate(today.getDate() + 7);

            // Active program
            const activeProgram = await programRepo.findOne({
                where: { athleteId, status: "active", isConfigured: true },
                relations: ["days"],
                order: { created_at: "DESC" }
            });

            // Primary Goal & Countdown
            const primaryGoal = await goalRepo.findOne({
                where: { athleteId, status: "active" },
                order: { deadline: "ASC" }
            });

            let daysLeft = null;
            if (primaryGoal?.deadline) {
                const deadlineDate = new Date(primaryGoal.deadline);
                const diffTime = deadlineDate.getTime() - today.getTime();
                daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            // Session counts
            const allSessions = await sessionRepo.find({ where: { athleteId } });
            const completedTotal = allSessions.filter(s => s.status === "completed").length;

            // Next session
            const nextSession = await sessionRepo.createQueryBuilder("s")
                .where("s.athleteId = :athleteId", { athleteId })
                .andWhere("CAST(s.date AS DATE) >= :today", { today: today.toISOString().split("T")[0] })
                .orderBy("s.date", "ASC")
                .getOne();

            // Workout logs
            const allLogs = await logRepo.find({ where: { athleteId }, order: { scheduledDate: "DESC" } });
            const last7Logs = allLogs.filter(l => new Date(l.scheduledDate) >= sevenDaysAgo);
            const last30Logs = allLogs.filter(l => new Date(l.scheduledDate) >= thirtyDaysAgo);
            const last7Completed = last7Logs.filter(l => l.status === "completed").length;
            const last30Completed = last30Logs.filter(l => l.status === "completed").length;
            
            const nextWeekSessions = allSessions.filter(s => {
                if (!s.date) return false;
                const d = new Date(s.date); d.setHours(0,0,0,0);
                return d >= today && d <= nextWeekEnd;
            }).length;

            const lastWorkoutLog = allLogs.find(l => l.status === "completed") || null;



            // Latest metrics (for charts)
            const latestMetrics = await metricRepo.find({
                where: { athleteId },
                order: { date: "DESC" },
                take: 12
            });

            // Program progress
            let programProgress = null;
            if (activeProgram) {
                const totalDays = activeProgram.days?.length || 0;
                const completedDays = allLogs.filter(
                    l => l.programId === activeProgram.id && l.status === "completed"
                ).length;
                programProgress = { total: totalDays, completed: completedDays };
            }

            res.json({
                athlete: {
                    id: athlete.id,
                    userId: athlete.userId,
                    name: `${athlete.user?.first_name || ""} ${athlete.user?.last_name || ""}`.trim() || athlete.user?.email,
                    email: athlete.user?.email,
                    sport: athlete.sport,
                    experienceLevel: athlete.experienceLevel,
                    profilePicture: athlete.profilePicture,
                    weight: athlete.weight,
                    height: athlete.height,
                    preferredTrainingDays: athlete.preferredTrainingDays,
                    notes: athlete.notes,
                    injuries: athlete.injuries,
                    joinedDate: athlete.joinedDate,
                    lastActive: athlete.lastActive,
                    nationality: athlete.nationality,
                    location: athlete.location || "Unknown"
                },
                trainingStats: {
                    last7Completed,
                    last7Total: last7Logs.length,
                    last30Completed,
                    last30Total: last30Logs.length,
                    nextWeekScheduled: nextWeekSessions,
                    totalCompleted: completedTotal,
                    adherence: allLogs.length > 0 ? Math.round((allLogs.filter(l => l.status === "completed").length / allLogs.length) * 100) : 0,
                },
                activeProgram: activeProgram ? {
                    id: activeProgram.id,
                    name: activeProgram.name,
                    startDate: activeProgram.startDate,
                    type: activeProgram.type,
                    progress: programProgress,
                } : null,
                primaryGoal: primaryGoal ? {
                    id: primaryGoal.id,
                    name: primaryGoal.name,
                    targetValue: primaryGoal.targetValue,
                    currentValue: primaryGoal.currentValue,
                    unit: primaryGoal.unit,
                    deadline: primaryGoal.deadline,
                    daysLeft: daysLeft
                } : null,
                nextSession: nextSession ? { date: nextSession.date, title: nextSession.title } : null,
                lastWorkout: lastWorkoutLog ? {
                    id: lastWorkoutLog.id,
                    date: lastWorkoutLog.scheduledDate,
                    durationMinutes: lastWorkoutLog.durationMinutes,
                    overallRating: lastWorkoutLog.overallRating,
                } : null,

                metrics: latestMetrics.reverse(),
            });
        } catch (error) {
            console.error("Error fetching athlete overview:", error);
            res.status(500).json({ message: "Error fetching athlete overview" });
        }
    };

    static getSpecialists = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const athlete = await athleteRepo.findOne({ where: { userId } });

            if (!athlete) {
                return res.status(404).json({ message: "Athlete profile not found" });
            }

            // 1. Fetch connected coaches (accepted requests)
            const requestRepo = AppDataSource.getRepository(CoachingRequest);
            const coachingRequests = await requestRepo.find({
                where: { athleteId: athlete.id, status: 'accepted' },
                relations: ["coachProfile", "coachProfile.user", "coachProfile.specializations"]
            });

            // 2. Fetch connected nutritionists (accepted connections)
            const nutritionConnRepo = AppDataSource.getRepository(NutritionConnection);
            const nutritionConnections = await nutritionConnRepo.find({
                where: { athleteId: athlete.id, status: 'accepted' },
                relations: ["nutritionistProfile", "nutritionistProfile.user"]
            });

            // 3. Fetch coaches from active programs (some connections are program-based)
            const programRepo = AppDataSource.getRepository(Program);
            const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
            const programs = await programRepo.find({
                where: { athleteId: athlete.id },
                relations: ["coachProfile", "coachProfile.user", "coachProfile.specializations"]
            });

            // 4. Format unified list
            const specialists: any[] = [];
            const seenSpecialistIds = new Set<string>();

            // Add Coaches from requests
            for (const req of coachingRequests) {
                if (req.coachProfile && req.coachProfile.user) {
                    const profile = req.coachProfile;
                    if (!seenSpecialistIds.has(profile.id)) {
                        seenSpecialistIds.add(profile.id);
                        specialists.push({
                            id: profile.id,
                            userId: profile.userId,
                            type: 'coach',
                            name: `${profile.user.first_name || ''} ${profile.user.last_name || ''}`.trim() || 'Coach',
                            specialization: profile.specializations?.[0]?.specialization || 'Performance Coach',
                            bio: profile.bio || 'Professional Coach',
                            avatar: profile.user.photo_url ? (profile.user.photo_url.startsWith('http') ? profile.user.photo_url : profile.user.photo_url) : null,
                            email: profile.user.email,
                            rating: profile.rating || 4.5,
                            experience: profile.experience_years || 0
                        });
                    }
                }
            }

            // Add Coaches from programs (if not already added)
            for (const prog of programs) {
                let profile: CoachProfile | null | undefined = prog.coachProfile;
                if (!profile && prog.coachId) {
                    profile = await coachProfileRepo.findOne({
                        where: { userId: prog.coachId },
                        relations: ["user", "specializations"]
                    });
                }

                if (profile && profile.user && !seenSpecialistIds.has(profile.id)) {
                    seenSpecialistIds.add(profile.id);
                    specialists.push({
                        id: profile.id,
                        userId: profile.userId,
                        type: 'coach',
                        name: `${profile.user.first_name || ''} ${profile.user.last_name || ''}`.trim() || 'Coach',
                        specialization: profile.specializations?.[0]?.specialization || 'Performance Coach',
                        bio: profile.bio || 'Professional Coach',
                        avatar: profile.user.photo_url ? (profile.user.photo_url.startsWith('http') ? profile.user.photo_url : profile.user.photo_url) : null,
                        email: profile.user.email,
                        rating: profile.rating || 4.5,
                        experience: profile.experience_years || 0
                    });
                }
            }

            // Add Nutritionists
            for (const conn of nutritionConnections) {
                if (conn.nutritionistProfile && conn.nutritionistProfile.user) {
                    const profile = conn.nutritionistProfile;
                    const combinedId = `nutri-${profile.id}`;
                    if (!seenSpecialistIds.has(combinedId)) {
                        seenSpecialistIds.add(combinedId);
                        specialists.push({
                            id: profile.id,
                            userId: profile.userId,
                            type: 'nutritionist',
                            name: `${profile.user.first_name || ''} ${profile.user.last_name || ''}`.trim() || 'Nutritionist',
                            specialization: 'Nutrition Specialist',
                            bio: profile.bio || 'Professional Nutritionist',
                            avatar: profile.user.photo_url ? (profile.user.photo_url.startsWith('http') ? profile.user.photo_url : profile.user.photo_url) : null,
                            email: profile.user.email,
                            rating: profile.rating || 4.5,
                            experience: profile.experience_years || 0
                        });
                    }
                }
            }

            res.json(specialists);
        } catch (error) {
            console.error("Error fetching connected specialists:", error);
            res.status(500).json({ message: "Error fetching connected specialists" });
        }
    };
}

