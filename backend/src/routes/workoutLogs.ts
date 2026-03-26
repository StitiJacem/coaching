import { Router } from "express";
import { WorkoutLogController } from "../controllers/WorkoutLogController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

router.use(authenticateToken);

router.get("/athlete/:athleteId/stats", WorkoutLogController.getAthleteStats);
router.get("/athlete/:athleteId", WorkoutLogController.getAthleteHistory);
router.post("/", WorkoutLogController.create);
router.post("/:id/start", WorkoutLogController.start);
router.post("/:id/event", WorkoutLogController.emitEvent);
router.get("/:id", WorkoutLogController.getById);
router.put("/:id", WorkoutLogController.update);
router.post("/:id/exercises", WorkoutLogController.logExercise);

export default router;
