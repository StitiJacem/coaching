import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authenticateToken } from "../middleware/authenticateToken";
import { isAdmin } from "../middleware/adminMiddleware";

const router = Router();

// All routes here are protected by both auth and admin check
router.use(authenticateToken);
router.use(isAdmin);

router.get("/users", AdminController.getAllUsers);
router.delete("/users/:id", AdminController.deleteUser);
router.get("/stats", AdminController.getStats);
router.get("/recent-users", AdminController.getRecentUsers);

export default router;
