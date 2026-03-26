import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { CoachingRequest } from "../entities/CoachingRequest";
import { Athlete } from "../entities/Athlete";
import { CoachProfile } from "../entities/Coach";
import { Program } from "../entities/Program";
import { Session } from "../entities/Session";
import { WorkoutLog } from "../entities/WorkoutLog";
import { notifyUser } from "../utils/notificationHelper";

export class CoachingRequestController {

    static sendRequest = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const role = (req as any).user.role;

            if (role !== "athlete") {
                return res.status(403).json({ message: "Only athletes can send coaching requests" });
            }

            const athleteRepo = AppDataSource.getRepository(Athlete);
            let athlete = await athleteRepo.findOne({ where: { userId } });

            if (!athlete) {
                console.log(`[DEBUG] Auto-creating missing athlete profile for user ${userId}`);
                athlete = athleteRepo.create({ userId, lastActive: new Date() });
                await athleteRepo.save(athlete);
            }

            const { coachProfileId, message } = req.body;

            if (!coachProfileId) {
                return res.status(400).json({ message: "Coach profile ID is required" });
            }

            const coachRepo = AppDataSource.getRepository(CoachProfile);
            const coachProfile = await coachRepo.findOne({ where: { id: coachProfileId } });

            if (!coachProfile) {
                return res.status(404).json({ message: "Coach profile not found" });
            }

            const requestRepo = AppDataSource.getRepository(CoachingRequest);


            const existing = await requestRepo.findOne({
                where: [
                    { athleteId: athlete.id, coachProfileId: coachProfileId, status: "pending" },
                    { athleteId: athlete.id, coachProfileId: coachProfileId, status: "accepted" }
                ]
            });

            if (existing) {
                if (existing.status === "pending") {
                    return res.status(400).json({ message: "You already have a pending request for this coach" });
                } else {
                    return res.status(400).json({ message: "You are already connected with this coach" });
                }
            }

            const request = requestRepo.create({
                athleteId: athlete.id,
                coachProfileId,
                message,
                status: "pending",
                initiator: "athlete"
            });

            await requestRepo.save(request);

            res.status(201).json({
                message: "Coaching request sent successfully",
                request
            });
        } catch (error) {
            console.error("Error sending coaching request:", error);
            res.status(500).json({ message: "Error sending coaching request" });
        }
    };


    static getRequestsByCoach = async (req: Request, res: Response) => {
        try {
            const requestRepo = AppDataSource.getRepository(CoachingRequest);
            const requests = await requestRepo.find({
                where: { coachProfileId: req.params.coachId as string },
                relations: ["athlete", "athlete.user"],
                order: { created_at: "DESC" }
            });

            res.json(requests);
        } catch (error) {
            console.error("Error fetching coaching requests:", error);
            res.status(500).json({ message: "Error fetching coaching requests" });
        }
    };


    static getRequestsByAthlete = async (req: Request, res: Response) => {
        try {
            const requestRepo = AppDataSource.getRepository(CoachingRequest);
            const requests = await requestRepo.find({
                where: { athleteId: Number(req.params.athleteId) },
                relations: ["coachProfile", "coachProfile.user"],
                order: { created_at: "DESC" }
            });

            res.json(requests);
        } catch (error) {
            console.error("Error fetching coaching requests:", error);
            res.status(500).json({ message: "Error fetching coaching requests" });
        }
    };


    static updateStatus = async (req: Request, res: Response) => {
        try {
            const { status } = req.body;
            if (!["accepted", "rejected"].includes(status)) {
                return res.status(400).json({ message: "Invalid status" });
            }

            const requestRepo = AppDataSource.getRepository(CoachingRequest);
            const request = await requestRepo.findOne({
                where: { id: req.params.id as string },
                relations: ["athlete", "coachProfile"]
            });

            if (!request) {
                return res.status(404).json({ message: "Request not found" });
            }

            request.status = status;
            await requestRepo.save(request);

            if (status === "accepted") {
                const reqUser = (req as any).user;
                const withRelations = await requestRepo.findOne({
                    where: { id: request.id },
                    relations: ["coachProfile", "coachProfile.user", "athlete", "athlete.user"],
                });
                if (withRelations?.coachProfile?.userId && withRelations?.athlete?.user?.id) {
                    if (reqUser?.role === "coach") {
                        notifyUser(
                            withRelations.athlete.user.id,
                            "coaching_accepted",
                            "Coaching request accepted",
                            "Your coach has accepted your request. You're now connected!",
                            { coachProfileId: withRelations.coachProfileId }
                        );
                    } else {
                        notifyUser(
                            withRelations.coachProfile.userId,
                            "athlete_connected",
                            "New athlete connected",
                            "An athlete has accepted your invitation.",
                            { athleteId: withRelations.athleteId }
                        );
                    }
                }
            }

            res.json({ message: `Request ${status} successfully`, request });
        } catch (error) {
            console.error("Error updating coaching request:", error);
            res.status(500).json({ message: "Error updating coaching request" });
        }
    };


    static getMyRequests = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const role = (req as any).user.role;
            const requestRepo = AppDataSource.getRepository(CoachingRequest);

            if (role === "athlete") {
                const athleteRepo = AppDataSource.getRepository(Athlete);
                let athlete = await athleteRepo.findOne({ where: { userId } });

                if (!athlete) {
                    console.log(`[DEBUG] Auto-creating missing athlete profile for user ${userId} in getMyRequests`);
                    athlete = athleteRepo.create({ userId, lastActive: new Date() });
                    await athleteRepo.save(athlete);
                }

                const rawRequests = await requestRepo.find({
                    where: [
                        { athleteId: athlete.id, initiator: "coach" },
                        { athleteId: athlete.id, status: "accepted" }
                    ],
                    relations: ["coachProfile", "coachProfile.user"],
                    order: { created_at: "DESC" }
                });


                const seenCoachIds = new Set<string>();
                const requests: typeof rawRequests = [];
                for (const r of rawRequests) {
                    if (!seenCoachIds.has(r.coachProfileId)) {
                        seenCoachIds.add(r.coachProfileId);
                        requests.push(r);
                    }
                }


                const programRepo = AppDataSource.getRepository(Program);
                const programs = await programRepo.find({
                    where: { athleteId: athlete.id },
                    relations: ["coachProfile", "coachProfile.user"]
                });

                for (const prog of programs) {
                    if (prog.coachProfile && !seenCoachIds.has(prog.coachProfile.id)) {
                        seenCoachIds.add(prog.coachProfile.id);
                        requests.push({
                            id: `prog-${prog.id}`,
                            athleteId: athlete.id,
                            coachProfileId: prog.coachProfile.id,
                            coachProfile: prog.coachProfile,
                            status: "accepted",
                            initiator: "coach",
                            created_at: prog.created_at || new Date(),
                            updated_at: prog.updated_at || new Date()
                        } as any);
                    }
                }

                return res.json(requests);
            } else {
                const coachRepo = AppDataSource.getRepository(CoachProfile);
                let coachProfile = await coachRepo.findOne({ where: { userId } });

                if (!coachProfile) {
                    console.log(`[DEBUG] Auto-creating missing coach profile for user ${userId}`);
                    coachProfile = coachRepo.create({ userId });
                    await coachRepo.save(coachProfile);
                }

                const requests = await requestRepo.find({
                    where: {
                        coachProfileId: coachProfile.id,
                        initiator: "athlete"
                    },
                    relations: ["athlete", "athlete.user"],
                    order: { created_at: "DESC" }
                });
                return res.json(requests);
            }
        } catch (error) {
            console.error("Error fetching my requests:", error);
            res.status(500).json({ message: "Error fetching requests" });
        }
    };


    static deleteRequest = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const requestId = req.params.id as string;

            const requestRepo = AppDataSource.getRepository(CoachingRequest);
            const coachRepo = AppDataSource.getRepository(CoachProfile);
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const programRepo = AppDataSource.getRepository(Program);

            let targetAthleteId: number | null = null;
            let targetCoachProfileId: string | null = null;


            const syntheticMatch = requestId.match(/^prog-(\d+)$/);
            if (syntheticMatch) {
                const programId = parseInt(syntheticMatch[1]);
                const prog = await programRepo.findOne({
                    where: { id: programId },
                    relations: ["coachProfile"]
                });

                if (!prog) {
                    return res.status(404).json({ message: "Program-based connection not found" });
                }

                const athleteProfile = await athleteRepo.findOne({ where: { userId } });
                const coachProfile = await coachRepo.findOne({ where: { userId } });

                const isAthlete = athleteProfile && prog.athleteId === athleteProfile.id;
                const isCoach = coachProfile && prog.coachProfileId === coachProfile.id;

                if (!isAthlete && !isCoach) {
                    return res.status(403).json({ message: "You are not authorized to terminate this connection" });
                }

                targetAthleteId = prog.athleteId ?? null;
                targetCoachProfileId = prog.coachProfileId ?? null;
            } else {

                const request = await requestRepo.findOne({
                    where: { id: requestId },
                    relations: ["athlete", "coachProfile"]
                });

                if (!request) {
                    return res.status(404).json({ message: "Request not found" });
                }

                const coachProfile = await coachRepo.findOne({ where: { userId } });
                const athleteProfile = await athleteRepo.findOne({ where: { userId } });

                const isCoachOfRequest = coachProfile && request.coachProfileId === coachProfile.id;
                const isAthleteOfRequest = athleteProfile && request.athleteId === athleteProfile.id;

                if (!isCoachOfRequest && !isAthleteOfRequest) {
                    return res.status(403).json({ message: "You are not authorized to terminate this connection" });
                }

                targetAthleteId = request.athleteId;
                targetCoachProfileId = request.coachProfileId;

                await requestRepo.remove(request);
            }




            if (targetAthleteId !== null && targetCoachProfileId !== null) {

                const coachProfileForUnlink = await coachRepo.findOne({ where: { id: targetCoachProfileId } });
                const coachUserIdForUnlink = coachProfileForUnlink?.userId ?? null;

                let whereClause = `"athleteId" = :athleteId AND "coachProfileId" = :coachProfileId`;
                const whereParams: any = { athleteId: targetAthleteId, coachProfileId: targetCoachProfileId };

                if (coachUserIdForUnlink !== null) {
                    whereClause = `"athleteId" = :athleteId AND ("coachId" = :coachUserId OR "coachProfileId" = :coachProfileId)`;
                    whereParams.coachUserId = coachUserIdForUnlink;
                }

                const sessionRepo = AppDataSource.getRepository(Session);

                await programRepo
                    .createQueryBuilder()
                    .update(Program)
                    .set({ athleteId: null as any })
                    .where(whereClause, whereParams)
                    .execute();




                if (coachUserIdForUnlink !== null) {
                    await sessionRepo
                        .createQueryBuilder()
                        .delete()
                        .from(Session)
                        .where(
                            `"athleteId" = :athleteId AND ("coachId" = :coachId OR "programId" IN (SELECT id FROM programs WHERE "coachId" = :coachId OR "coachProfileId" = :coachProfileId))`,
                            {
                                athleteId: targetAthleteId,
                                coachId: coachUserIdForUnlink,
                                coachProfileId: targetCoachProfileId
                            }
                        )
                        .execute();

                    const workoutLogRepo = AppDataSource.getRepository(WorkoutLog);
                    await workoutLogRepo
                        .createQueryBuilder()
                        .delete()
                        .from(WorkoutLog)
                        .where(
                            `"athleteId" = :athleteId AND "status" = 'scheduled' AND "programId" IN (SELECT id FROM programs WHERE "coachId" = :coachId OR "coachProfileId" = :coachProfileId)`,
                            {
                                athleteId: targetAthleteId,
                                coachId: coachUserIdForUnlink,
                                coachProfileId: targetCoachProfileId
                            }
                        )
                        .execute();
                }
            }

            res.json({ message: "Connection terminated successfully" });

        } catch (error) {
            console.error("Error deleting coaching request:", error);
            res.status(500).json({ message: "Error terminating connection" });
        }
    };


    static disconnectAthlete = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const role = (req as any).user.role;
            const athleteId = parseInt(req.params.athleteId as string);

            if (role !== "coach") {
                return res.status(403).json({ message: "Only coaches can use this endpoint" });
            }

            const coachRepo = AppDataSource.getRepository(CoachProfile);
            const coachProfile = await coachRepo.findOne({ where: { userId } });
            if (!coachProfile) {
                return res.status(404).json({ message: "Coach profile not found" });
            }

            const requestRepo = AppDataSource.getRepository(CoachingRequest);
            const programRepo = AppDataSource.getRepository(Program);


            await requestRepo
                .createQueryBuilder()
                .delete()
                .from(CoachingRequest)
                .where(`"athleteId" = :athleteId AND "coachProfileId" = :coachProfileId`, {
                    athleteId,
                    coachProfileId: coachProfile.id
                })
                .execute();




            await programRepo
                .createQueryBuilder()
                .update(Program)
                .set({ athleteId: null as any })
                .where(
                    `"athleteId" = :athleteId AND ("coachId" = :coachUserId OR "coachProfileId" = :coachProfileId)`,
                    { athleteId, coachUserId: userId, coachProfileId: coachProfile.id }
                )
                .execute();




            const sessionRepo = AppDataSource.getRepository(Session);
            await sessionRepo
                .createQueryBuilder()
                .delete()
                .from(Session)
                .where(
                    `"athleteId" = :athleteId AND ("coachId" = :coachId OR "programId" IN (SELECT id FROM programs WHERE "coachId" = :coachId OR "coachProfileId" = :coachProfileId))`,
                    {
                        athleteId,
                        coachId: userId,
                        coachProfileId: coachProfile.id
                    }
                )
                .execute();

            const workoutLogRepo = AppDataSource.getRepository(WorkoutLog);
            await workoutLogRepo
                .createQueryBuilder()
                .delete()
                .from(WorkoutLog)
                .where(
                    `"athleteId" = :athleteId AND "status" = 'scheduled' AND "programId" IN (SELECT id FROM programs WHERE "coachId" = :coachId OR "coachProfileId" = :coachProfileId)`,
                    {
                        athleteId,
                        coachId: userId,
                        coachProfileId: coachProfile.id
                    }
                )
                .execute();

            res.json({ message: "Athlete disconnected successfully" });

        } catch (error) {
            console.error("Error disconnecting athlete:", error);
            res.status(500).json({ message: "Error disconnecting athlete" });
        }
    };
}
