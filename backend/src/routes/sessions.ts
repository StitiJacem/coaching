import express from "express";
import { SessionController } from "../controllers/SessionController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = express.Router();

router.post("/", authenticateToken, SessionController.createSession);
router.get("/", authenticateToken, SessionController.getSessions);
router.get("/:id", authenticateToken, SessionController.getSessionById);
router.put("/:id", authenticateToken, SessionController.updateSession);
router.delete("/:id", authenticateToken, SessionController.deleteSession);

export default router;
