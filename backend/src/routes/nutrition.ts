import { Router } from "express";
import { NutritionistController } from "../controllers/NutritionistController";
import { DietController } from "../controllers/DietController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();
const nutritionistController = new NutritionistController();
const dietController = new DietController();

router.get("/nutritionists", nutritionistController.getAll.bind(nutritionistController));
router.get("/nutritionists/me/profile", authenticateToken, nutritionistController.getMyProfile.bind(nutritionistController));
router.get("/nutritionists/:id", nutritionistController.getOne.bind(nutritionistController));
router.put("/nutritionists/:userId/profile", authenticateToken, nutritionistController.updateProfile.bind(nutritionistController));

router.post("/connection", authenticateToken, nutritionistController.sendConnectionRequest.bind(nutritionistController));
router.get("/my-requests", authenticateToken, nutritionistController.getMyRequests.bind(nutritionistController));
router.get("/athlete/my-connections", authenticateToken, nutritionistController.getAthleteConnections.bind(nutritionistController));
router.patch("/connection/:connectionId", authenticateToken, nutritionistController.respondToRequest.bind(nutritionistController));

router.get("/nutritionists/:id/clients", authenticateToken, nutritionistController.getClients.bind(nutritionistController));

router.get("/nutritionists/:id/clients/:athleteId/plans", authenticateToken, nutritionistController.getClientPlans.bind(nutritionistController));

router.get("/nutritionists/:id/clients/:athleteId/compliance", authenticateToken, nutritionistController.getClientCompliance.bind(nutritionistController));

router.post("/plans", authenticateToken, (req, res) => dietController.createPlan(req, res));

router.get("/plans/:id", authenticateToken, (req, res) => dietController.getPlanById(req, res));

router.put("/plans/:planId/build", authenticateToken, (req, res) => dietController.saveFullPlan(req, res));

router.delete("/plans/:id", authenticateToken, (req, res) => dietController.deletePlan(req, res));
router.get("/my-plans", authenticateToken, (req, res) => dietController.getNutritionistPlans(req, res));

router.get("/templates", authenticateToken, (req, res) => dietController.getNutritionistTemplates(req, res));

router.post("/plans/:planId/assign", authenticateToken, (req, res) => dietController.assignPlanToMultipleAthletes(req, res));

router.get("/athletes/:athleteId/active-plan", authenticateToken, (req, res) => dietController.getAthleteActivePlan(req, res));

router.get("/athletes/:athleteId/compliance", authenticateToken, (req, res) => dietController.getComplianceForAthlete(req, res));

router.get("/athletes/:athleteId/nutrition-summary", authenticateToken, (req, res) => dietController.getNutritionSummary(req, res));

router.get("/athletes/:athleteId/logs-by-date", authenticateToken, (req, res) => dietController.getAthleteLogsByDate(req, res));
router.get("/athletes/:athleteId/today-logs", authenticateToken, (req, res) => dietController.getTodayLogs(req, res));

router.post("/athletes/:athleteId/log", authenticateToken, (req, res) => dietController.logMeal(req, res));

router.delete("/athletes/:athleteId/log/:logId", authenticateToken, (req, res) => dietController.deleteMealLog(req, res));

router.get("/athletes/:athleteId/dietary-profile", authenticateToken, (req, res) => dietController.getAthleteDietaryProfile(req, res));
router.put("/athletes/:athleteId/dietary-profile", authenticateToken, (req, res) => dietController.updateAthleteDietaryProfile(req, res));

export default router;
