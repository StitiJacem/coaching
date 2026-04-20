import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { MealLog } from "../entities/MealLog";
import { DietPlan } from "../entities/DietPlan";
import { Between, MoreThanOrEqual } from "typeorm";

/**
 * MealLogController — handles meal logging and quick retrieval.
 * For detailed compliance (plan vs actual) use DietController.getComplianceForAthlete.
 */
export class MealLogController {
    static logMeal = async (req: Request, res: Response) => {
        try {
            const { foodName, calories, protein, carbs, fats, mealType, imagePath } = req.body;
            const athleteId = (req as any).user.id;

            const mealRepo = AppDataSource.getRepository(MealLog);

            const newLog = new MealLog();
            newLog.athleteId = athleteId;
            newLog.foodName = foodName || "Unnamed Meal";
            newLog.calories = Number(calories) || 0;
            newLog.protein = Number(protein) || 0;
            newLog.carbs = Number(carbs) || 0;
            newLog.fats = Number(fats) || 0;
            newLog.mealType = mealType || "snack";
            newLog.imagePath = imagePath;
            newLog.loggedAt = new Date();

            const savedLog = await mealRepo.save(newLog);
            res.status(201).json(savedLog);
        } catch (error) {
            console.error("Error logging meal:", error);
            res.status(500).json({ message: "Error logging meal" });
        }
    };

    static getLogs = async (req: Request, res: Response) => {
        try {
            const athleteId = req.params.athleteId
                ? parseInt(req.params.athleteId as string)
                : (req as any).user.id;

            const mealRepo = AppDataSource.getRepository(MealLog);

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const logs = await mealRepo.find({
                where: {
                    athleteId,
                    loggedAt: MoreThanOrEqual(sevenDaysAgo)
                },
                order: { loggedAt: "DESC" }
            });

            res.json(logs);
        } catch (error) {
            console.error("Error fetching meal logs:", error);
            res.status(500).json({ message: "Error fetching meal logs" });
        }
    };

    /**
     * getCompliance — uses DietPlan (not NutritionPlan) to calculate macro targets.
     * Compares the athlete's active DietPlan meals against their MealLogs for today.
     */
    static getCompliance = async (req: Request, res: Response) => {
        try {
            const athleteId = parseInt(req.params.athleteId as string);
            const mealRepo = AppDataSource.getRepository(MealLog);
            const planRepo = AppDataSource.getRepository(DietPlan);

            // Find athlete's most recent active DietPlan (not a template)
            const activePlan = await planRepo.findOne({
                where: { athleteId, isTemplate: false },
                relations: ["days", "days.meals"],
                order: { created_at: "DESC" }
            });

            if (!activePlan) {
                return res.status(404).json({ message: "No active diet plan found for this athlete" });
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayLogs = await mealRepo.find({
                where: { athleteId, loggedAt: Between(today, tomorrow) }
            });

            const actual = todayLogs.reduce((acc, log) => ({
                calories: acc.calories + log.calories,
                protein: acc.protein + log.protein,
                carbs: acc.carbs + log.carbs,
                fats: acc.fats + log.fats
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            // Determine which DietDay maps to today
            let todayPlanDay = null;
            if (activePlan.days && activePlan.days.length > 0) {
                if (activePlan.startDate) {
                    const start = new Date(activePlan.startDate);
                    start.setHours(0, 0, 0, 0);
                    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    const dayNumber = (diffDays % activePlan.days.length) + 1;
                    todayPlanDay = activePlan.days.find(d => d.day_number === dayNumber) || activePlan.days[0];
                } else {
                    todayPlanDay = activePlan.days[0];
                }
            }

            const target = (todayPlanDay?.meals || []).reduce((acc, meal) => ({
                calories: acc.calories + meal.calories,
                protein: acc.protein + meal.protein,
                carbs: acc.carbs + meal.carbs,
                fats: acc.fats + meal.fats
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

            res.json({
                athleteId,
                planName: activePlan.name,
                date: today,
                target,
                actual,
                todayDay: todayPlanDay
            });
        } catch (error) {
            console.error("Error fetching macro compliance:", error);
            res.status(500).json({ message: "Error fetching macro compliance" });
        }
    };
}
