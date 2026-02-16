import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get dashboard statistics
router.get("/stats", DashboardController.getStats);

// Get today's sessions
router.get("/sessions/today", DashboardController.getTodaySessions);

// Get recent athletes
router.get("/athletes/recent", DashboardController.getRecentAthletes);

export default router;
