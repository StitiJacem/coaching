import { Request, Response } from "express";
import { analyzeFoodImage } from "../services/AIService";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: derive a browser-friendly MIME type from a multer file
// ─────────────────────────────────────────────────────────────────────────────

function resolveMimeType(file: Express.Multer.File): string {
  // multer sets mimetype from the Content-Type of the uploaded part
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  return allowed.includes(file.mimetype) ? file.mimetype : "image/jpeg";
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────────────────────

export class AIController {
  /**
   * POST /api/ai/analyze-food
   *
   * Accepts:
   *   • multipart/form-data with an "image" file field  (preferred)
   *   • application/json with a base64 "image" string   (legacy / mobile)
   *
   * Returns:
   *   {
   *     detectedFoods: string[],
   *     portion: { estimate: string, grams: number },
   *     nutrition: { calories, protein, carbs, fat },
   *     confidence: string
   *   }
   */
  static analyzeFood = async (req: Request, res: Response): Promise<void> => {
    const requestId = `req-${Date.now()}`;
    console.log(`[AIController][${requestId}] Received food analysis request.`);

    try {
      let imageBuffer: Buffer;
      let mimeType = "image/jpeg";

      // ── Path 1: multipart/form-data upload (multer stores file in req.file) ──
      if (req.file) {
        console.log(
          `[AIController][${requestId}] Mode: file upload | ` +
            `original name: ${req.file.originalname} | size: ${req.file.size} bytes`
        );

        imageBuffer = req.file.buffer;
        mimeType = resolveMimeType(req.file);
      }
      // ── Path 2: JSON body with base64 string (legacy support) ────────────────
      else if (req.body?.image) {
        console.log(`[AIController][${requestId}] Mode: base64 JSON body`);

        const raw: string = req.body.image;
        // Strip optional Data-URL prefix (data:image/jpeg;base64,…)
        const base64 = raw.replace(/^data:image\/\w+;base64,/, "");
        imageBuffer = Buffer.from(base64, "base64");

        // Try to extract MIME type from Data-URL prefix
        const mimeMatch = raw.match(/^data:(image\/\w+);base64,/);
        if (mimeMatch) mimeType = mimeMatch[1];
      }
      // ── No image provided ────────────────────────────────────────────────────
      else {
        console.warn(`[AIController][${requestId}] No image provided in request.`);
        res.status(400).json({
          error: "NO_IMAGE",
          message:
            'No image provided. Send a multipart/form-data request with an "image" field, or a JSON body with a base64 "image" string.',
        });
        return;
      }

      // Validate minimum size (avoid sending 0-byte garbage to the AI)
      if (imageBuffer.length < 1024) {
        res.status(400).json({
          error: "IMAGE_TOO_SMALL",
          message: "The uploaded image appears to be corrupted or too small.",
        });
        return;
      }

      // ── Call the AI service ──────────────────────────────────────────────────
      const result = await analyzeFoodImage(imageBuffer, mimeType);

      // ── Save the image permanently for logging ───────────────────────────────
      let imagePath = null;
      try {
        const fs = require('fs');
        const path = require('path');
        const filename = `meal-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
        const uploadsDir = path.join(__dirname, "../../public/uploads");
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const fullPath = path.join(uploadsDir, filename);
        fs.writeFileSync(fullPath, imageBuffer);
        imagePath = `/uploads/${filename}`;
        console.log(`[AIController][${requestId}] Image saved to: ${imagePath}`);
      } catch (saveErr: any) {
        console.error(`[AIController][${requestId}] Failed to save image:`, saveErr.message);
      }

      // If no recognizable food was detected, return a clear 422
      if (result.detectedFoods.length === 0) {
        console.warn(
          `[AIController][${requestId}] No food detected in image. Confidence: ${result.confidence}`
        );
        res.status(422).json({
          error: "NO_FOOD_DETECTED",
          message:
            "No recognizable food items were found in the image. Please upload a clear photo of a meal or food.",
          detectedFoods: [],
          portion: result.portion,
          nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          confidence: result.confidence,
          imagePath
        });
        return;
      }

      console.log(
        `[AIController][${requestId}] Success — ` +
          `foods: [${result.detectedFoods.join(", ")}] | ` +
          `calories: ${result.nutrition.calories} kcal | ` +
          `confidence: ${result.confidence}`
      );

      res.status(200).json({
        ...result,
        imagePath
      });
    } catch (err: any) {
      const isApiErr = err?.response?.data;
      const statusCode = err?.response?.status ?? 500;

      console.error(
        `[AIController][${requestId}] Error during food analysis:`,
        isApiErr ?? err.message
      );

      // Handle specific upstream errors
      if (statusCode === 400 || statusCode === 403) {
        res.status(502).json({
          error: "AI_API_ERROR",
          message: "The AI service rejected the request. Check your API key or image format.",
          detail: isApiErr,
        });
        return;
      }

      if (err.message?.includes("GEMINI_API_KEY")) {
        res.status(503).json({
          error: "SERVICE_UNAVAILABLE",
          message: "AI analysis is not available — API key is not configured.",
        });
        return;
      }

      res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred during food analysis. Please try again.",
      });
    }
  };
}
