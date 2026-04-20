import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { authenticateToken } from "../middleware/authenticateToken";
import { isAdmin } from "../middleware/adminMiddleware";

const router = Router();

// All routes here are protected by both auth and admin check
router.use(authenticateToken);
router.use(isAdmin);

router.get("/users", AdminController.getAllUsers);
router.put("/users/role", AdminController.updateUserRole);
router.delete("/users/:id", AdminController.deleteUser);
router.get("/stats", AdminController.getStats);

export default router;
