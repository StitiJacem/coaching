import { Router } from "express";
import { ExerciseController } from "../controllers/ExerciseController";

const router = Router();

router.get("/", ExerciseController.getAll);
router.get("/search", ExerciseController.search);
router.get("/video", ExerciseController.getVideo);
router.get("/bodypart/:bodyPart", ExerciseController.getByBodyPart);
router.get("/:id", ExerciseController.getById);

export default router;
