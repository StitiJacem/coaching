import { Router } from 'express';
import { DietController } from '../controllers/DietController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();
const dietController = new DietController();


router.post('/plans', authenticateToken, (req, res) => dietController.createPlan(req, res));
router.get('/my-plan', authenticateToken, (req, res) => dietController.getAthleteActivePlan(req, res));
router.get('/nutritionist/plans', authenticateToken, (req, res) => res.status(501).json({ message: "Use /api/nutrition route instead" }));

export default router;
