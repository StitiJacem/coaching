import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { CoachingRequest } from "../entities/CoachingRequest";
import { Athlete } from "../entities/Athlete";
import { CoachProfile } from "../entities/Coach";

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
            const athlete = await athleteRepo.findOne({ where: { userId } });

            if (!athlete) {
                return res.status(404).json({ message: "Athlete profile not found" });
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
                const athlete = await athleteRepo.findOne({ where: { userId } });
                if (!athlete) return res.status(404).json({ message: "Athlete profile not found" });

                const requests = await requestRepo.find({
                    where: {
                        athleteId: athlete.id,
                        initiator: "coach" // Athletes only see invitations FROM coaches
                    },
                    relations: ["coachProfile", "coachProfile.user"],
                    order: { created_at: "DESC" }
                });
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
}
