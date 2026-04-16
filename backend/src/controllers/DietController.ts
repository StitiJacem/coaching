import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { DietPlan } from "../entities/DietPlan";
import { DietDay } from "../entities/DietDay";
import { Meal } from "../entities/Meal";
import { DietaryProfile } from "../entities/DietaryProfile";
import { DietLog } from "../entities/DietLog";
import { MealLog } from "../entities/MealLog";
import { MoreThanOrEqual } from "typeorm";

export class DietController {
    private dietPlanRepo = AppDataSource.getRepository(DietPlan);
    private dietDayRepo = AppDataSource.getRepository(DietDay);
    private mealRepo = AppDataSource.getRepository(Meal);
    private dietaryProfileRepo = AppDataSource.getRepository(DietaryProfile);
    private dietLogRepo = AppDataSource.getRepository(DietLog);
    private mealLogRepo = AppDataSource.getRepository(MealLog);



    async createPlan(req: Request, res: Response) {
        try {
            const { name, description, goal, isTemplate, nutritionistProfileId, athleteId, startDate } = req.body;
            const newPlan = this.dietPlanRepo.create({
                name, description, goal, isTemplate, nutritionistProfileId, athleteId, startDate
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
            const plan = await this.dietPlanRepo.findOneBy({ id: planId });
            if (!plan) return res.status(404).json({ message: "Plan not found" });
            res.json(plan);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }


    async saveFullPlan(req: Request, res: Response) {
        try {
            const planId = String(req.params.planId);
            const { name, days } = req.body;
            
            const plan = await this.dietPlanRepo.findOne({ where: { id: planId } });
            if (!plan) return res.status(404).json({ message: "Plan not found" });

            plan.name = name;
            await this.dietPlanRepo.save(plan);


            await this.dietDayRepo.delete({ dietPlanId: planId });


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



    async getAthleteActivePlan(req: Request, res: Response) {
        try {
            const athleteId = Number(req.params.athleteId);
            

            const activePlan = await this.dietPlanRepo.findOne({
                where: { athleteId, isTemplate: false },
                relations: ["days", "days.meals"],
                order: { created_at: "DESC" }
            });

            if (!activePlan) return res.json(null);
            res.json(activePlan);
        } catch (error) {
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



    async logMeal(req: Request, res: Response) {
        try {
            const { athleteId, foodName, calories, protein, carbs, fats, mealType, imagePath } = req.body;
            const logEntry = this.mealLogRepo.create({
                athleteId: Number(athleteId),
                foodName,
                calories: Number(calories) || 0,
                protein: Number(protein) || 0,
                carbs: Number(carbs) || 0,
                fats: Number(fats) || 0,
                mealType: mealType || 'snack',
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
                    athleteId: athleteId,
                    loggedAt: MoreThanOrEqual(today)
                },
                order: { loggedAt: "DESC" }
            });

            res.json(logs);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }
}
