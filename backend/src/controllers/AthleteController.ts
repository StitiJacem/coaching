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

export class AthleteController {

    static getAll = async (req: Request, res: Response) => {
        try {
            console.log(`[DEBUG] AthleteController.getAll called by user:`, (req as any).user);
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const { search, sport } = req.query;

            const queryBuilder = athleteRepo.createQueryBuilder("athlete")
                .leftJoinAndSelect("athlete.user", "user");


            const user = (req as any).user;
            if (user && user.role === 'coach') {
                const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
                const coachProfile = await coachProfileRepo.findOne({ where: { userId: user.id } });

                if (!coachProfile) {

                    console.log(`[DEBUG] Auto-creating missing coach profile for user ${user.id} in getAll`);
                    const newProfile = coachProfileRepo.create({ userId: user.id });
                    await coachProfileRepo.save(newProfile);
                    return res.json([]);
                }



                queryBuilder.andWhere(new Brackets(qb => {
                    qb.where(
                        `EXISTS (SELECT 1 FROM programs p WHERE p."athleteId" = athlete.id AND p."coachId" = :coachId)`,
                        { coachId: user.id }
                    );
                    qb.orWhere(
                        `EXISTS (SELECT 1 FROM coaching_requests cr WHERE cr."athleteId" = athlete.id AND cr."coachProfileId" = :profileId AND cr.status = 'accepted')`,
                        { profileId: coachProfile.id }
                    );
                }));
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

            if (coachRole !== 'coach') {
                return res.status(403).json({ message: "Only coaches can invite athletes" });
            }

            if (!email) {
                return res.status(400).json({ message: "Email is required" });
            }

            const userRepo = AppDataSource.getRepository(User);
            const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
            const coachingRequestRepo = AppDataSource.getRepository(CoachingRequest);
            const inviteRepo = AppDataSource.getRepository(UserInvitation);
            const athleteRepo = AppDataSource.getRepository(Athlete);


            let coachProfile = await coachProfileRepo.findOne({ where: { userId: coachId } });
            if (!coachProfile) {
                console.log(`[DEBUG] Auto-creating missing coach profile for user ${coachId} during invitation`);
                coachProfile = coachProfileRepo.create({ userId: coachId });
                await coachProfileRepo.save(coachProfile);
            }


            const existingUser = await userRepo.findOne({ where: { email } });

            if (existingUser) {
                if (existingUser.role !== 'athlete') {
                    return res.status(400).json({ message: "This user is already a coach and cannot be invited as an athlete" });
                }


                let athlete = await athleteRepo.findOne({ where: { userId: existingUser.id } });

                if (!athlete) {
                    console.log(`[DEBUG] Creating missing athlete profile for user ${email}`);
                    athlete = athleteRepo.create({
                        userId: existingUser.id,
                        lastActive: new Date()
                    });
                    await athleteRepo.save(athlete);
                }


                const existingRequest = await coachingRequestRepo.findOne({
                    where: {
                        athleteId: athlete.id,
                        coachProfileId: coachProfile.id,
                        status: 'pending'
                    }
                });

                if (existingRequest) {
                    console.log(`[DEBUG] Blocked invitation: Pending request already exists from coach ${coachProfile.id} for athlete ${athlete.id}`);
                    return res.status(400).json({ message: "A pending request already exists for this athlete from you" });
                }

                const request = coachingRequestRepo.create({
                    athleteId: athlete.id,
                    coachProfileId: coachProfile.id,
                    message: message || `Invitation from ${(req as any).user.first_name || 'your coach'}`,
                    status: 'pending',
                    initiator: "coach"
                });
                await coachingRequestRepo.save(request);

                return res.status(201).json({
                    message: "Invitation sent! Since this user already has an account, a coaching request has been sent to them.",
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
                primaryObjective, targetMetric, deadline, timePerSession, injuries, experienceLevel, equipment
            } = req.body;

            if (age !== undefined) athlete.age = age;
            if (height !== undefined) athlete.height = height;
            if (weight !== undefined) athlete.weight = weight;
            if (sport !== undefined) athlete.sport = sport;
            if (goals !== undefined) athlete.goals = goals;
            if (profilePicture !== undefined) athlete.profilePicture = profilePicture;
            if (preferredTrainingDays !== undefined) athlete.preferredTrainingDays = preferredTrainingDays;
            
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
}
