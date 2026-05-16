import { Router } from "express";
import { ProgramController } from "../controllers/ProgramController";
import { authenticateToken } from "../middleware/authenticateToken";
import { validate } from "../middleware/validate";
import { createProgramSchema, updateProgramSchema } from "../validators/program.validator";

const router = Router();


router.use(authenticateToken);


router.get("/athlete/:userId/today", ProgramController.getTodayWorkout);

router.get("/", ProgramController.getAll);
router.get("/:id", ProgramController.getById);
router.post("/", validate(createProgramSchema), ProgramController.create);
router.put("/:id", validate(updateProgramSchema), ProgramController.update);
router.patch("/:id/accept", ProgramController.acceptProgram);
router.patch("/:id/quit", ProgramController.quit);
router.post("/:id/assign", ProgramController.assign);
router.delete("/:id", ProgramController.delete);

export default router;
