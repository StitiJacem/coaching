import { Router } from "express";
import { SessionController } from "../controllers/SessionController";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();


router.use(authenticateToken);

router.post("/sync", SessionController.sync);
router.get("/", SessionController.getAll);
router.get("/:id", SessionController.getById);
router.post("/", SessionController.create);
router.put("/:id", SessionController.update);
router.delete("/:id", SessionController.delete);

export default router;
