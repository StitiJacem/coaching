import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { CoachingRequest } from "../entities/CoachingRequest";
import { Athlete } from "../entities/Athlete";
import { CoachProfile } from "../entities/Coach";
import { Program } from "../entities/Program";
import { Session } from "../entities/Session";

export class CoachingRequestController {
    // POST /api/coaching-requests - Athlete sends a request to a coach
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

            // Check for existing request (pending or accepted)
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

    // GET /api/coaching-requests/coach/:coachId - Get requests for a coach
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

    // GET /api/coaching-requests/athlete/:athleteId - Get requests sent by an athlete
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

    // PATCH /api/coaching-requests/:id - Update status (Accept/Reject)
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

            res.json({ message: `Request ${status} successfully`, request });
        } catch (error) {
            console.error("Error updating coaching request:", error);
            res.status(500).json({ message: "Error updating coaching request" });
        }
    };

    // GET /api/coaching-requests/me - Get requests for the current authenticated user
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

                // Deduplicate by coachProfileId (OR query can return same coach twice)
                const seenCoachIds = new Set<string>();
                const requests: typeof rawRequests = [];
                for (const r of rawRequests) {
                    if (!seenCoachIds.has(r.coachProfileId)) {
                        seenCoachIds.add(r.coachProfileId);
                        requests.push(r);
                    }
                }

                // Synthesize requests for coaches with active programs
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
                        initiator: "athlete" // Coaches only see requests FROM athletes
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

    // DELETE /api/coaching-requests/:id - Terminate a connection or cancel a request
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

            // Handle synthetic IDs from program-based connections (e.g. "prog-5")
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
                // Real CoachingRequest record
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

            // Unlink all programs assigned to this athlete by this coach.
            // Programs may reference the coach by userId (coachId) OR by profile UUID (coachProfileId),
            // so we must match on EITHER to fully remove the relationship.
            if (targetAthleteId !== null && targetCoachProfileId !== null) {
                // Resolve the coach's user ID from their profile so we can match on coachId too
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
                    .set({ athleteId: null as any }) // TypeORM requires null to emit SET athleteId = NULL; undefined is ignored
                    .where(whereClause, whereParams)
                    .execute();

                // Also delete upcoming sessions scheduled by this coach for this athlete.
                // We match on coachId directly OR on programId (if the session came from one of this coach's programs).
                // We check programs matching either the coach's userId OR their profileId to be safe.
                if (coachUserIdForUnlink !== null) {
                    await sessionRepo
                        .createQueryBuilder()
                        .delete()
                        .from(Session)
                        .where(
                            `"athleteId" = :athleteId AND "date" >= CURRENT_DATE AND ("coachId" = :coachId OR "programId" IN (SELECT id FROM programs WHERE "coachId" = :coachId OR "coachProfileId" = :coachProfileId))`,
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

    // DELETE /api/coaching-requests/disconnect-athlete/:athleteId - Coach disconnects an athlete
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

            // Remove all coaching requests between this coach and athlete
            await requestRepo
                .createQueryBuilder()
                .delete()
                .from(CoachingRequest)
                .where(`"athleteId" = :athleteId AND "coachProfileId" = :coachProfileId`, {
                    athleteId,
                    coachProfileId: coachProfile.id
                })
                .execute();

            // Unlink all programs assigned to this athlete by this coach.
            // Programs may reference the coach by userId (coachId) OR by profile UUID (coachProfileId),
            // so we must match on EITHER column to fully remove the relationship.
            await programRepo
                .createQueryBuilder()
                .update(Program)
                .set({ athleteId: null as any }) // TypeORM requires null to emit SET athleteId = NULL; undefined is ignored
                .where(
                    `"athleteId" = :athleteId AND ("coachId" = :coachUserId OR "coachProfileId" = :coachProfileId)`,
                    { athleteId, coachUserId: userId, coachProfileId: coachProfile.id }
                )
                .execute();

            // Also delete upcoming sessions scheduled by this coach for this athlete.
            // We match on coachId directly OR on programId (if the session came from one of this coach's programs).
            // We check programs matching either the coach's userId OR their profileId to be safe.
            const sessionRepo = AppDataSource.getRepository(Session);
            await sessionRepo
                .createQueryBuilder()
                .delete()
                .from(Session)
                .where(
                    `"athleteId" = :athleteId AND "date" >= CURRENT_DATE AND ("coachId" = :coachId OR "programId" IN (SELECT id FROM programs WHERE "coachId" = :coachId OR "coachProfileId" = :coachProfileId))`,
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
