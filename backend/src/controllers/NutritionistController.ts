import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { NutritionistProfile } from "../entities/NutritionistProfile";
import { NutritionConnection, NutritionConnectionStatus } from "../entities/NutritionConnection";
import { Athlete } from "../entities/Athlete";
import { DietPlan } from "../entities/DietPlan";
import { MealLog } from "../entities/MealLog";
import { Between } from "typeorm";

export class NutritionistController {
    private nutritionistRepo = AppDataSource.getRepository(NutritionistProfile);
    private connectionRepo = AppDataSource.getRepository(NutritionConnection);
    private athleteRepo = AppDataSource.getRepository(Athlete);
    private dietPlanRepo = AppDataSource.getRepository(DietPlan);
    private mealLogRepo = AppDataSource.getRepository(MealLog);

    // Get all nutritionists for discovery
    async getAll(req: Request, res: Response) {
        try {
            const nutritionists = await this.nutritionistRepo.find({
                relations: ["user"]
            });
            return res.json(nutritionists);
        } catch (error) {
            console.error("Error fetching nutritionists", error);
            res.status(500).json({ message: "Server error" });
        }
    }
 
    // Get nutritionist profile by ID (UUID or userId)
    async getOne(req: Request, res: Response) {
        try {
            const idParam = String(req.params.id);
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);
            const userRepo = AppDataSource.getRepository("User") as any;

            let profile = null;

            if (isUUID) {
                profile = await this.nutritionistRepo.findOne({
                    where: { id: idParam },
                    relations: ["user"]
                });
            }

            // Fallback: If not found by ID (or not a UUID), try finding by userId
            const userId = parseInt(idParam);
            if (!profile && !isNaN(userId)) {
                profile = await this.nutritionistRepo.findOne({
                    where: { userId: userId },
                    relations: ["user"]
                });
            }

            // If still not found, check if the user exists and is a nutritionist
            if (!profile && !isNaN(userId)) {
                const user = await userRepo.findOne({ where: { id: userId, role: 'nutritionist' } });
                if (user) {
                    profile = this.nutritionistRepo.create({
                        userId: user.id,
                        user: user,
                        verified: true,
                        rating: 4.5,
                        experience_years: 0,
                        bio: 'Professional Nutritionist'
                    });
                    await this.nutritionistRepo.save(profile);
                }
            }

            if (!profile) return res.status(404).json({ message: "Nutritionist profile not found" });
            res.json(profile);
        } catch (error) {
            console.error("Error fetching nutritionist profile", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Connect (athlete requesting a nutritionist)
    async sendConnectionRequest(req: Request, res: Response) {
        try {
            const nutritionistProfileId = String(req.body.nutritionistProfileId);
            const message = String(req.body.message || "");

            const userId = (req as any).user.id;
            const athlete = await this.athleteRepo.findOne({ where: { userId } });

            if (!athlete) return res.status(404).json({ message: "Athlete not found" });
            const athleteId = athlete.id;

            const existing = await this.connectionRepo.findOne({
                where: { athleteId, nutritionistProfileId }
            });

            if (existing) {
                return res.status(400).json({ message: "Request already exists." });
            }

            const request = this.connectionRepo.create({
                athleteId,
                nutritionistProfileId,
                message,
                initiator: "athlete",
                status: "pending"
            });

            await this.connectionRepo.save(request);
            res.status(201).json(request);
        } catch (error) {
            console.error("Error sending nutritionist connection request", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Get pending requests for the nutritionist
    async getMyRequests(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const profile = await this.nutritionistRepo.findOne({ where: { userId } });
            if (!profile) return res.status(404).json({ message: "Profile not found" });

            const requests = await this.connectionRepo.find({
                where: { nutritionistProfileId: profile.id, status: "pending" },
                relations: ["athlete", "athlete.user"]
            });

            res.json(requests);
        } catch (error) {
            console.error("Error fetching nutritionist requests", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Get nutritionist's accepted clients with their active plan summaries
    async getClients(req: Request, res: Response) {
        try {
            const nutritionistProfileId = String(req.params.id);

            const connections = await this.connectionRepo.find({
                where: { nutritionistProfileId, status: "accepted" },
                relations: ["athlete", "athlete.user", "athlete.dietaryProfile"]
            });

            // For each client, fetch their active diet plan if it exists
            const clients = await Promise.all(connections.map(async (conn) => {
                const activePlan = await this.dietPlanRepo.findOne({
                    where: { athleteId: conn.athleteId, isTemplate: false, nutritionistProfileId },
                    relations: ["days"],
                    order: { created_at: "DESC" }
                });

                return {
                    connectionId: conn.id,
                    status: conn.status,
                    athlete: conn.athlete,
                    activePlan: activePlan ? {
                        id: activePlan.id,
                        name: activePlan.name,
                        goal: activePlan.goal,
                        startDate: activePlan.startDate,
                        daysCount: activePlan.days?.length || 0
                    } : null
                };
            }));

            res.json(clients);
        } catch (error) {
            console.error("Error getting nutritionist clients", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Get all plans for a specific client athlete (by nutritionist)
    async getClientPlans(req: Request, res: Response) {
        try {
            const nutritionistProfileId = String(req.params.id);
            const athleteId = Number(req.params.athleteId);

            // Verify connection is accepted
            const connection = await this.connectionRepo.findOne({
                where: { nutritionistProfileId, athleteId, status: "accepted" }
            });
            if (!connection) {
                return res.status(403).json({ message: "No accepted connection with this athlete." });
            }

            const plans = await this.dietPlanRepo.find({
                where: { nutritionistProfileId, athleteId },
                relations: ["days", "days.meals"],
                order: { created_at: "DESC" }
            });

            res.json(plans);
        } catch (error) {
            console.error("Error getting client plans", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Get today's compliance for a specific client
    async getClientCompliance(req: Request, res: Response) {
        try {
            const nutritionistProfileId = String(req.params.id);
            const athleteId = Number(req.params.athleteId);
            const dateParam = req.query.date as string | undefined;

            // Verify connection
            const connection = await this.connectionRepo.findOne({
                where: { nutritionistProfileId, athleteId, status: "accepted" }
            });
            if (!connection) {
                return res.status(403).json({ message: "No accepted connection with this athlete." });
            }

            const targetDate = dateParam ? new Date(dateParam) : new Date();
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            // Active plan
            const activePlan = await this.dietPlanRepo.findOne({
                where: { athleteId, isTemplate: false, nutritionistProfileId },
                relations: ["days", "days.meals"],
                order: { created_at: "DESC" }
            });

            // Today's logs
            const todayLogs = await this.mealLogRepo.find({
                where: { athleteId, loggedAt: Between(targetDate, nextDay) }
            });

            const actual = todayLogs.reduce((acc, log) => ({
                calories: acc.calories + log.calories,
                protein: acc.protein + log.protein,
                carbs: acc.carbs + log.carbs,
                fats: acc.fats + log.fats
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            if (!activePlan) {
                return res.json({ hasPlan: false, actual, target: null, logs: todayLogs });
            }

            // Find today's plan day
            let todayDay = null;
            if (activePlan.days?.length > 0) {
                if (activePlan.startDate) {
                    const start = new Date(activePlan.startDate);
                    start.setHours(0, 0, 0, 0);
                    const diffDays = Math.floor((targetDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    const dayNumber = (diffDays % activePlan.days.length) + 1;
                    todayDay = activePlan.days.find(d => d.day_number === dayNumber) || activePlan.days[0];
                } else {
                    todayDay = activePlan.days[0];
                }
            }

            const target = (todayDay?.meals || []).reduce((acc: any, meal: any) => ({
                calories: acc.calories + meal.calories,
                protein: acc.protein + meal.protein,
                carbs: acc.carbs + meal.carbs,
                fats: acc.fats + meal.fats
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            res.json({
                hasPlan: true,
                planId: activePlan.id,
                planName: activePlan.name,
                todayDay,
                target,
                actual,
                logs: todayLogs,
                percent: {
                    calories: target.calories > 0 ? Math.min(Math.round((actual.calories / target.calories) * 100), 200) : 0,
                    protein: target.protein > 0 ? Math.min(Math.round((actual.protein / target.protein) * 100), 200) : 0,
                    carbs: target.carbs > 0 ? Math.min(Math.round((actual.carbs / target.carbs) * 100), 200) : 0,
                    fats: target.fats > 0 ? Math.min(Math.round((actual.fats / target.fats) * 100), 200) : 0
                }
            });
        } catch (error) {
            console.error("Error getting client compliance", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Accept/Reject connection request (called by athlete or nutritionist)
    async respondToRequest(req: Request, res: Response) {
        try {
            const connectionId = String(req.params.connectionId);
            const { status } = req.body;
            const requestingUser = (req as any).user;

            // Primary lookup: by UUID
            let connection = await this.connectionRepo.findOne({ where: { id: connectionId } });

            // Fallback: if not found by UUID (e.g. stale notification after DB reset),
            // find the latest pending connection for this athlete
            if (!connection && requestingUser.role === 'athlete') {
                const athlete = await this.athleteRepo.findOne({ where: { userId: requestingUser.id } });
                if (athlete) {
                    connection = await this.connectionRepo.findOne({
                        where: { athleteId: athlete.id, status: 'pending' },
                        order: { created_at: 'DESC' }
                    });
                }
            }

            if (!connection) return res.status(404).json({ message: "Request not found" });

            connection.status = status as NutritionConnectionStatus;
            await this.connectionRepo.save(connection);

            res.json(connection);
        } catch (error) {
            console.error('Error responding to nutrition request:', error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Profile creation/updating
    async updateProfile(req: Request, res: Response) {
        try {
            const userId = Number(req.params.userId);
            const updateData = req.body;

            let profile = await this.nutritionistRepo.findOne({ where: { userId } });
            if (!profile) {
                const newProfile = this.nutritionistRepo.create({ userId });
                this.nutritionistRepo.merge(newProfile, updateData);
                profile = await this.nutritionistRepo.save(newProfile);
            } else {
                this.nutritionistRepo.merge(profile, updateData);
                profile = await this.nutritionistRepo.save(profile);
            }

            res.json(profile);
        } catch (error) {
            console.error("Update profile error", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Get nutritionist profile by userId
    async getMyProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const profile = await this.nutritionistRepo.findOne({
                where: { userId },
                relations: ["user"]
            });
            if (!profile) return res.status(404).json({ message: "Profile not found" });
            res.json(profile);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }
}
