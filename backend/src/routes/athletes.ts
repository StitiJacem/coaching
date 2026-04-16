import { Router } from "express";
import { AthleteController } from "../controllers/AthleteController";
import { ActivityEventController } from "../controllers/ActivityEventController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

router.use(authenticateToken);

router.get("/", AthleteController.getAll);
router.get("/:id/timeline", ActivityEventController.getTimeline);
router.post("/:id/events", ActivityEventController.create);
router.get("/:id", AthleteController.getById);
router.get("/:id/overview", AthleteController.getOverview);
router.get("/:id/stats", AthleteController.getStats);
router.post("/invite", AthleteController.invite);
router.put("/:id", AthleteController.update);

export default router;
