import { Router } from "express";
import { ReportController } from "../controllers/ReportController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

router.use(authenticateToken);

router.get("/coach/overview", ReportController.coachOverview);
router.get("/athlete/:id/progress", ReportController.athleteProgress);

export default router;
