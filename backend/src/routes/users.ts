import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

router.put("/profile", authenticateToken, UserController.updateProfile);
router.post("/change-password", authenticateToken, UserController.changePassword);

export default router;
