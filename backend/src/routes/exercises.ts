import { Router } from "express";
import { ExerciseController } from "../controllers/ExerciseController";

const router = Router();

router.get("/", ExerciseController.getAll);
router.get("/search", ExerciseController.search);
router.get("/bodypart/:bodyPart", ExerciseController.getByBodyPart);

export default router;
