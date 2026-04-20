import { Router } from 'express';
import { DietController } from '../controllers/DietController';
import { authenticateToken } from '../middleware/authenticateToken';
import { AppDataSource } from '../orm/data-source';
import { Athlete } from '../entities/Athlete';

const router = Router();
const dietController = new DietController();

// Redirect legacy routes to unified /api/nutrition
router.post('/plans', authenticateToken, (req, res) => dietController.createPlan(req, res));

// Legacy /my-plan: resolves athleteId from the JWT user, then delegates
router.get('/my-plan', authenticateToken, async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const athlete = await AppDataSource.getRepository(Athlete).findOne({ where: { userId } });
        if (!athlete) return res.json(null);
        req.params.athleteId = String(athlete.id);
        return dietController.getAthleteActivePlan(req, res);
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/nutritionist/plans', authenticateToken, (req, res) =>
    res.status(301).json({ message: 'Use /api/nutrition/my-plans instead' })
);

export default router;
