import { Router } from "express";
import { ProgramController } from "../controllers/ProgramController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get("/", ProgramController.getAll);
router.get("/:id", ProgramController.getById);
router.post("/", ProgramController.create);
router.put("/:id", ProgramController.update);
router.delete("/:id", ProgramController.delete);

export default router;
