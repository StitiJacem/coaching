import { Router } from "express";
import { GoalController } from "../controllers/GoalController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get("/", GoalController.getAll);
router.get("/:id", GoalController.getById);
router.post("/", GoalController.create);
router.put("/:id", GoalController.update);
router.delete("/:id", GoalController.delete);

export default router;
