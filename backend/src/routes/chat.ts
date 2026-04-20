import { Router } from "express";
import { ChatController } from "../controllers/ChatController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

router.get("/conversations", authenticateToken, ChatController.getConversations);
router.get("/contacts", authenticateToken, ChatController.getContacts);
router.get("/conversations/:conversationId/messages", authenticateToken, ChatController.getMessages);
router.post("/conversations", authenticateToken, ChatController.startConversation);

export default router;
