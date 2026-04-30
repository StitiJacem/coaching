import { Router } from "express";
import { NutritionistController } from "../controllers/NutritionistController";
import { DietController } from "../controllers/DietController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();
const nutritionistController = new NutritionistController();
const dietController = new DietController();

// ── Nutritionist Discovery & Profile ─────────────────────────────────────────
router.get("/nutritionists", nutritionistController.getAll.bind(nutritionistController));
router.get("/nutritionists/me/profile", authenticateToken, nutritionistController.getMyProfile.bind(nutritionistController));
router.get("/nutritionists/:id", nutritionistController.getOne.bind(nutritionistController));
router.put("/nutritionists/:userId/profile", authenticateToken, nutritionistController.updateProfile.bind(nutritionistController));

// ── Connection Requests ───────────────────────────────────────────────────────
router.post("/connection", authenticateToken, nutritionistController.sendConnectionRequest.bind(nutritionistController));
router.get("/my-requests", authenticateToken, nutritionistController.getMyRequests.bind(nutritionistController));
router.patch("/connection/:connectionId", authenticateToken, nutritionistController.respondToRequest.bind(nutritionistController));

// ── Nutritionist Client Management ───────────────────────────────────────────
// Get all accepted clients (with active plan summary)
router.get("/nutritionists/:id/clients", authenticateToken, nutritionistController.getClients.bind(nutritionistController));

// Get all plans for a specific client
router.get("/nutritionists/:id/clients/:athleteId/plans", authenticateToken, nutritionistController.getClientPlans.bind(nutritionistController));

// Get compliance (plan vs logs) for a specific client on a date (?date=YYYY-MM-DD)
router.get("/nutritionists/:id/clients/:athleteId/compliance", authenticateToken, nutritionistController.getClientCompliance.bind(nutritionistController));

// ── Diet Plans ────────────────────────────────────────────────────────────────
// Create a plan (validates NutritionConnection if athleteId + nutritionistProfileId provided)
router.post("/plans", authenticateToken, (req, res) => dietController.createPlan(req, res));

// Get a single plan by ID (with days + meals)
router.get("/plans/:id", authenticateToken, (req, res) => dietController.getPlanById(req, res));

// Save/rebuild full plan structure (days + meals)
router.put("/plans/:planId/build", authenticateToken, (req, res) => dietController.saveFullPlan(req, res));

// Get all plans for the authenticated nutritionist
router.get("/my-plans", authenticateToken, (req, res) => dietController.getNutritionistPlans(req, res));

// ── Athlete Endpoints ─────────────────────────────────────────────────────────
// Get athlete's active diet plan (with days + meals)
router.get("/athletes/:athleteId/active-plan", authenticateToken, (req, res) => dietController.getAthleteActivePlan(req, res));

// Get compliance: plan targets vs today's MealLogs (?date=YYYY-MM-DD optional)
router.get("/athletes/:athleteId/compliance", authenticateToken, (req, res) => dietController.getComplianceForAthlete(req, res));

// Get MealLogs for a specific date (?date=YYYY-MM-DD optional, defaults to today)
router.get("/athletes/:athleteId/logs-by-date", authenticateToken, (req, res) => dietController.getAthleteLogsByDate(req, res));

// Get today's meal logs
router.get("/athletes/:athleteId/today-logs", authenticateToken, (req, res) => dietController.getTodayLogs(req, res));

// Log a meal (consumed by athlete)
router.post("/athletes/:athleteId/log", authenticateToken, (req, res) => dietController.logMeal(req, res));

// Delete a meal log
router.delete("/athletes/:athleteId/log/:logId", authenticateToken, (req, res) => dietController.deleteMealLog(req, res));

// Dietary profile
router.get("/athletes/:athleteId/dietary-profile", authenticateToken, (req, res) => dietController.getAthleteDietaryProfile(req, res));
router.put("/athletes/:athleteId/dietary-profile", authenticateToken, (req, res) => dietController.updateAthleteDietaryProfile(req, res));

export default router;
