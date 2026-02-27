import { Router } from 'express';
import { CoachController } from '../controllers/CoachController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

// Publicly accessible list (but requires auth)
router.get('/', authenticateToken, CoachController.getAll);
router.get('/:id', authenticateToken, CoachController.getById);

export default router;
