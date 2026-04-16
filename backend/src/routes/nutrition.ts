import { Router } from "express";
import { NutritionistController } from "../controllers/NutritionistController";
import { DietController } from "../controllers/DietController";

const router = Router();
const nutritionistController = new NutritionistController();
const dietController = new DietController();


router.get("/nutritionists", nutritionistController.getAll.bind(nutritionistController));
router.post("/connection", nutritionistController.sendConnectionRequest.bind(nutritionistController));
router.get("/my-requests", nutritionistController.getMyRequests.bind(nutritionistController));
router.get("/nutritionists/:id/clients", nutritionistController.getClients.bind(nutritionistController));
router.patch("/connection/:connectionId", nutritionistController.respondToRequest.bind(nutritionistController));
router.put("/nutritionists/:userId/profile", nutritionistController.updateProfile.bind(nutritionistController));


router.post("/plans", dietController.createPlan.bind(dietController));
router.get("/plans/:id", dietController.getPlanById.bind(dietController));
router.put("/plans/:planId/build", dietController.saveFullPlan.bind(dietController));


router.get("/athletes/:athleteId/active-plan", dietController.getAthleteActivePlan.bind(dietController));
router.get("/athletes/:athleteId/dietary-profile", dietController.getAthleteDietaryProfile.bind(dietController));
router.put("/athletes/:athleteId/dietary-profile", dietController.updateAthleteDietaryProfile.bind(dietController));
router.post("/athletes/:athleteId/log", dietController.logMeal.bind(dietController));
router.get("/athletes/:athleteId/today-logs", dietController.getTodayLogs.bind(dietController));

export default router;
