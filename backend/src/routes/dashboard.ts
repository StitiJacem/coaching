import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();


router.use(authenticateToken);


router.get("/stats", DashboardController.getStats);


router.get("/sessions/today", DashboardController.getTodaySessions);


router.get("/athletes/recent", DashboardController.getRecentAthletes);

router.get("/prs/recent", DashboardController.getRecentPRs);

export default router;
