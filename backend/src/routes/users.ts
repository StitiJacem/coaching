import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authenticateToken } from "../middleware/authenticateToken";
import { upload } from "../middleware/multer";

const router = Router();

router.put("/profile", authenticateToken, UserController.updateProfile);
router.post("/upload-photo", authenticateToken, upload.single('photo'), UserController.uploadPhoto);
router.post("/change-password", authenticateToken, UserController.changePassword);

export default router;
