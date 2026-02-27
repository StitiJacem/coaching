import { Router } from "express";
import { WorkoutLogController } from "../controllers/WorkoutLogController";

const router = Router();

// Athlete-specific routes (must come before /:id routes)
router.get("/athlete/:athleteId/stats", WorkoutLogController.getAthleteStats);
router.get("/athlete/:athleteId", WorkoutLogController.getAthleteHistory);

// Generic CRUD
router.post("/", WorkoutLogController.create);
router.get("/:id", WorkoutLogController.getById);
router.put("/:id", WorkoutLogController.update);
router.post("/:id/exercises", WorkoutLogController.logExercise);

export default router;
