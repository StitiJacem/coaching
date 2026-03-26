import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

router.use(authenticateToken);

router.get("/", NotificationController.getAll);
router.post("/read", NotificationController.markRead);

export default router;
