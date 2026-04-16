import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { MealLog } from "../entities/MealLog";
import { NutritionPlan } from "../entities/NutritionPlan";
import { MoreThanOrEqual } from "typeorm";

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
            newLog.mealType = mealType || 'snack';
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
            const athleteId = req.params.athleteId ? parseInt(req.params.athleteId as string) : (req as any).user.id;
            const mealRepo = AppDataSource.getRepository(MealLog);


            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const logs = await mealRepo.find({
                where: {
                    athleteId: athleteId,
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

    static getCompliance = async (req: Request, res: Response) => {
        try {
            const athleteId = parseInt(req.params.athleteId as string);
            const mealRepo = AppDataSource.getRepository(MealLog);
            const planRepo = AppDataSource.getRepository(NutritionPlan);

            const activePlan = await planRepo.findOne({
                where: { athleteId, isActive: true },
                relations: ["days"]
            });

            if (!activePlan) {
                return res.status(404).json({ message: "No active nutrition plan found for this athlete" });
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayLogs = await mealRepo.createQueryBuilder("log")
                .where("log.athleteId = :athleteId", { athleteId })
                .andWhere("log.loggedAt >= :today AND log.loggedAt < :tomorrow", { today, tomorrow })
                .getMany();

            const actual = todayLogs.reduce((acc, log) => ({
                calories: acc.calories + log.calories,
                protein: acc.protein + log.protein,
                carbs: acc.carbs + log.carbs,
                fats: acc.fats + log.fats
            }), { calories: 0, protein: 0, carbs: 0, fats: 0 });


            const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
            const target = activePlan.days.find(d => d.dayName === dayOfWeek) || activePlan.days[0];

            res.json({
                athleteId,
                planName: activePlan.name,
                date: today,
                target,
                actual
            });
        } catch (error) {
            console.error("Error fetching macro compliance:", error);
            res.status(500).json({ message: "Error fetching macro compliance" });
        }
    };
}
