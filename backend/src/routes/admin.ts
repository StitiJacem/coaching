import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authenticateToken } from "../middleware/authenticateToken";
import { isAdmin } from "../middleware/adminMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(isAdmin);

router.get("/users", AdminController.getAllUsers);
router.delete("/users/:id", AdminController.deleteUser);
router.get("/stats", AdminController.getStats);
router.get("/recent-users", AdminController.getRecentUsers);
router.get("/analytics", AdminController.getAnalytics);

export default router;
