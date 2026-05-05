import { Router } from "express";
import multer from "multer";
import { AIController } from "../controllers/AIController";

// ─────────────────────────────────────────────────────────────────────────────
// Multer configuration — store in memory, never on disk
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

const router = Router();

/**
 * POST /api/ai/analyze-food
 *
 * Accepts multipart/form-data with an "image" field (JPEG, PNG, WebP, HEIC)
 * or application/json with a base64-encoded "image" string.
 *
 * Returns detected food items with portion size and nutritional breakdown.
 */
router.post(
  "/analyze-food",
  upload.single("image"), // multer middleware — populates req.file if file is present
  AIController.analyzeFood
);

export default router;
