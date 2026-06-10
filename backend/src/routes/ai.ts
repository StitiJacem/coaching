import { Router } from "express";
import multer from "multer";
import { AIController } from "../controllers/AIController";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE_MB = 10;

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // 10 MB
  },

  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type "${file.mimetype}". Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
        )
      );
    }
  },
});

const router = Router();

router.post(
  "/analyze-food",
  upload.single("image"),
  AIController.analyzeFood
);

export default router;
