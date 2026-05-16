import { Router } from 'express';
import { CoachController } from '../controllers/CoachController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

// Public route for Marketplace (no auth required)
router.get('/public', CoachController.getPublicCoaches);

// Protected routes
router.get('/', authenticateToken, CoachController.getAll);
router.put('/me', authenticateToken, CoachController.update);
router.get('/:id', authenticateToken, CoachController.getById);

export default router;
