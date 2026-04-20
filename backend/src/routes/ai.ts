import { Router } from "express";
import { AIController } from "../controllers/AIController";

const router = Router();

router.post("/analyze-food", AIController.analyzeFood);

export default router;
