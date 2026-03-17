import { Router } from "express";
import { ProgramController } from "../controllers/ProgramController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();


router.use(authenticateToken);


router.get("/athlete/:userId/today", ProgramController.getTodayWorkout);

router.get("/", ProgramController.getAll);
router.get("/:id", ProgramController.getById);
router.post("/", ProgramController.create);
router.put("/:id", ProgramController.update);
router.patch("/:id/accept", ProgramController.acceptProgram);
router.delete("/:id", ProgramController.delete);

export default router;
