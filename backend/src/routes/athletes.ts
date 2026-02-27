import { Router } from "express";
import { AthleteController } from "../controllers/AthleteController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get("/", AthleteController.getAll);
router.get("/:id", AthleteController.getById);
router.get("/:id/stats", AthleteController.getStats);
router.post("/invite", AthleteController.invite);
router.put("/:id", AthleteController.update);

export default router;
