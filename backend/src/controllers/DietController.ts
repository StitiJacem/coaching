import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { DietPlan } from "../entities/DietPlan";
import { DietDay } from "../entities/DietDay";
import { Meal } from "../entities/Meal";
import { DietaryProfile } from "../entities/DietaryProfile";
import { DietLog } from "../entities/DietLog";
import { MealLog } from "../entities/MealLog";
import { NutritionConnection } from "../entities/NutritionConnection";
import { NutritionistProfile } from "../entities/NutritionistProfile";
import { Athlete } from "../entities/Athlete";
import { Between, MoreThanOrEqual } from "typeorm";

export class DietController {
    private dietPlanRepo = AppDataSource.getRepository(DietPlan);
    private dietDayRepo = AppDataSource.getRepository(DietDay);
    private mealRepo = AppDataSource.getRepository(Meal);
    private dietaryProfileRepo = AppDataSource.getRepository(DietaryProfile);
    private dietLogRepo = AppDataSource.getRepository(DietLog);
    private mealLogRepo = AppDataSource.getRepository(MealLog);
    private connectionRepo = AppDataSource.getRepository(NutritionConnection);
    private nutritionistRepo = AppDataSource.getRepository(NutritionistProfile);
    private athleteRepo = AppDataSource.getRepository(Athlete);

    // --- DIET PLAN MANAGEMENT ---

    async createPlan(req: Request, res: Response) {
        try {
            const { name, description, goal, isTemplate, nutritionistProfileId, athleteId, startDate } = req.body;

            // Validate NutritionConnection if both parties are specified
            if (nutritionistProfileId && athleteId && !isTemplate) {
                const connection = await this.connectionRepo.findOne({
                    where: {
                        nutritionistProfileId,
                        athleteId: Number(athleteId),
                        status: "accepted"
                    }
                });
                if (!connection) {
                    return res.status(403).json({
                        message: "No accepted nutrition connection between this nutritionist and athlete. The athlete must first accept the connection request."
                    });
                }
            }

            const newPlan = this.dietPlanRepo.create({
                name, description, goal, isTemplate,
                nutritionistProfileId, athleteId: athleteId ? Number(athleteId) : undefined,
                startDate
            });
            await this.dietPlanRepo.save(newPlan);
            res.status(201).json(newPlan);
        } catch (error) {
            console.error("Error creating DietPlan", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async getPlanById(req: Request, res: Response) {
        try {
            const planId = String(req.params.id);
            const plan = await this.dietPlanRepo.findOne({
                where: { id: planId },
                relations: ["days", "days.meals", "nutritionistProfile", "nutritionistProfile.user"]
            });
            if (!plan) return res.status(404).json({ message: "Plan not found" });
            res.json(plan);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }

    // Get all plans created by a nutritionist
    async getNutritionistPlans(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const profile = await this.nutritionistRepo.findOne({ where: { userId } });
            if (!profile) return res.status(404).json({ message: "Nutritionist profile not found" });

            const plans = await this.dietPlanRepo.find({
                where: { nutritionistProfileId: profile.id },
                relations: ["athlete", "athlete.user", "days"],
                order: { created_at: "DESC" }
            });
            res.json(plans);
        } catch (error) {
            console.error("Error fetching nutritionist plans", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Builder logic: receive full plan JSON and save structure
    async saveFullPlan(req: Request, res: Response) {
        try {
            const planId = String(req.params.planId);
            const { name, days } = req.body;

            const plan = await this.dietPlanRepo.findOne({ where: { id: planId } });
            if (!plan) return res.status(404).json({ message: "Plan not found" });

            plan.name = name;
            await this.dietPlanRepo.save(plan);

            // Clear old structure to prevent orphans
            await this.dietDayRepo.delete({ dietPlanId: planId });

            // Insert new days & meals
            if (days && Array.isArray(days)) {
                for (const day of days) {
                    const newDay = this.dietDayRepo.create({
                        dietPlanId: planId,
                        day_number: day.day_number,
                        title: day.title,
                        isRestDay: !!day.isRestDay
                    });
                    const savedDay = await this.dietDayRepo.save(newDay);

                    if (day.meals && Array.isArray(day.meals) && day.meals.length > 0) {
                        const mealsToSave = day.meals.map((m: any, index: number) => {
                            let type = (m.mealType || "snack").toLowerCase();
                            if (!["breakfast", "lunch", "dinner", "snack"].includes(type)) {
                                type = "snack";
                            }
                            return this.mealRepo.create({
                                dietDayId: savedDay.id,
                                mealType: type,
                                timeOfDay: m.timeOfDay || "12:00",
                                instructions: m.instructions || "",
                                calories: Number(m.calories) || 0,
                                protein: Number(m.protein) || 0,
                                carbs: Number(m.carbs) || 0,
                                fats: Number(m.fats) || 0,
                                order: index
                            });
                        });
                        await this.mealRepo.save(mealsToSave);
                    }
                }
            }

            const updatedPlan = await this.dietPlanRepo.findOne({
                where: { id: planId },
                relations: ["days", "days.meals"]
            });

            res.json(updatedPlan);
        } catch (error) {
            console.error("Full plan save error", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // --- ATHLETE ACTIVE PLAN & LOGGING ---

    async getAthleteActivePlan(req: Request, res: Response) {
        try {
            const athleteId = Number(req.params.athleteId);

            const activePlan = await this.dietPlanRepo.findOne({
                where: { athleteId, isTemplate: false },
                relations: ["days", "days.meals", "nutritionistProfile", "nutritionistProfile.user"],
                order: { created_at: "DESC" }
            });

            if (!activePlan) return res.json(null);
            res.json(activePlan);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }

    // --- COMPLIANCE: Compare DietPlan targets vs actual MealLogs ---

    async getComplianceForAthlete(req: Request, res: Response) {
        try {
            const athleteId = Number(req.params.athleteId);
            const dateParam = req.query.date as string | undefined;

            // Determine target date (default to today)
            const targetDate = dateParam ? new Date(dateParam) : new Date();
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            // Find athlete's active DietPlan
            const activePlan = await this.dietPlanRepo.findOne({
                where: { athleteId, isTemplate: false },
                relations: ["days", "days.meals"],
                order: { created_at: "DESC" }
            });

            // Aggregate today's MealLogs
            const todayLogs = await this.mealLogRepo.find({
                where: {
                    athleteId,
                    loggedAt: Between(targetDate, nextDay)
                }
            });

            const actual = todayLogs.reduce((acc, log) => ({
                calories: acc.calories + (log.calories || 0),
                protein: acc.protein + (log.protein || 0),
                carbs: acc.carbs + (log.carbs || 0),
                fats: acc.fats + (log.fats || 0)
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            // If no plan, return actual with null target
            if (!activePlan) {
                return res.json({
                    athleteId,
                    hasPlan: false,
                    date: targetDate,
                    target: { calories: 0, protein: 0, carbs: 0, fats: 0 },
                    actual,
                    todayDay: null
                });
            }

            // Determine which day of the plan corresponds to today
            // Method: use offset from startDate, cycling through 7 days
            let todayDay: DietDay | null = null;
            if (activePlan.days && activePlan.days.length > 0) {
                if (activePlan.startDate) {
                    const start = new Date(activePlan.startDate);
                    start.setHours(0, 0, 0, 0);
                    const diffDays = Math.floor((targetDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    const dayIndex = diffDays % activePlan.days.length;
                    // Find day by day_number (1-indexed)
                    const targetDayNumber = dayIndex + 1;
                    todayDay = activePlan.days.find(d => d.day_number === targetDayNumber) || activePlan.days[0];
                } else {
                    // No start date: use day 1 as default
                    todayDay = activePlan.days.find(d => d.day_number === 1) || activePlan.days[0];
                }
            }

            // Build target from today's planned meals
            const target = (todayDay?.meals || []).reduce((acc, meal) => ({
                calories: acc.calories + (meal.calories || 0),
                protein: acc.protein + (meal.protein || 0),
                carbs: acc.carbs + (meal.carbs || 0),
                fats: acc.fats + (meal.fats || 0)
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            // Compute percentages
            const percent = {
                calories: target.calories > 0 ? Math.min(Math.round((actual.calories / target.calories) * 100), 200) : 0,
                protein: target.protein > 0 ? Math.min(Math.round((actual.protein / target.protein) * 100), 200) : 0,
                carbs: target.carbs > 0 ? Math.min(Math.round((actual.carbs / target.carbs) * 100), 200) : 0,
                fats: target.fats > 0 ? Math.min(Math.round((actual.fats / target.fats) * 100), 200) : 0
            };

            res.json({
                athleteId,
                hasPlan: true,
                planId: activePlan.id,
                planName: activePlan.name,
                date: targetDate,
                todayDay,
                target,
                actual,
                percent
            });
        } catch (error) {
            console.error("Compliance error", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    // Get logs for a specific date (for nutritionist monitoring a client)
    async getAthleteLogsByDate(req: Request, res: Response) {
        try {
            const athleteId = Number(req.params.athleteId);
            const dateParam = req.query.date as string | undefined;

            const targetDate = dateParam ? new Date(dateParam) : new Date();
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            const logs = await this.mealLogRepo.find({
                where: {
                    athleteId,
                    loggedAt: Between(targetDate, nextDay)
                },
                order: { loggedAt: "ASC" }
            });

            res.json(logs);
        } catch (error) {
            console.error("Logs by date error", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async getAthleteDietaryProfile(req: Request, res: Response) {
        try {
            const athleteId = Number(req.params.athleteId);
            let profile = await this.dietaryProfileRepo.findOne({ where: { athleteId } });

            if (!profile) {
                const newProfile = this.dietaryProfileRepo.create({ athleteId });
                profile = await this.dietaryProfileRepo.save(newProfile);
            }
            res.json(profile);
        } catch (error) {
            console.error("Get profile error", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async updateAthleteDietaryProfile(req: Request, res: Response) {
        try {
            const athleteId = Number(req.params.athleteId);
            const updateData = req.body;

            let profile = await this.dietaryProfileRepo.findOneBy({ athleteId });
            if (!profile) {
                const newProfile = this.dietaryProfileRepo.create({ athleteId });
                this.dietaryProfileRepo.merge(newProfile, updateData);
                profile = await this.dietaryProfileRepo.save(newProfile);
            } else {
                this.dietaryProfileRepo.merge(profile, updateData);
                profile = await this.dietaryProfileRepo.save(profile);
            }

            res.json(profile);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }

    // --- LOGGING ---

    async logMeal(req: Request, res: Response) {
        try {
            const athleteId = Number(req.params.athleteId);
            const { foodName, calories, protein, carbs, fats, mealType, imagePath } = req.body;

            const logEntry = this.mealLogRepo.create({
                athleteId,
                foodName: foodName || "Unnamed Meal",
                calories: Number(calories) || 0,
                protein: Number(protein) || 0,
                carbs: Number(carbs) || 0,
                fats: Number(fats) || 0,
                mealType: mealType || "snack",
                imagePath,
                loggedAt: new Date()
            });
            await this.mealLogRepo.save(logEntry);
            res.status(201).json(logEntry);
        } catch (error) {
            console.error("Log meal error", error);
            res.status(500).json({ message: "Server error" });
        }
    }

    async getTodayLogs(req: Request, res: Response) {
        try {
            const athleteId = Number(req.params.athleteId);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const logs = await this.mealLogRepo.find({
                where: {
                    athleteId,
                    loggedAt: Between(today, tomorrow)
                },
                order: { loggedAt: "ASC" }
            });

            res.json(logs);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }

    // Delete a meal log entry
    async deleteMealLog(req: Request, res: Response) {
        try {
            const logId = String(req.params.logId);
            const result = await this.mealLogRepo.delete({ id: logId });
            if (result.affected === 0) return res.status(404).json({ message: "Log not found" });
            res.json({ message: "Log deleted" });
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }
}
