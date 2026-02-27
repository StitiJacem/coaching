import { Router } from 'express';
import { CoachingRequestController } from '../controllers/CoachingRequestController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

// General routes
router.get('/me', authenticateToken, CoachingRequestController.getMyRequests);

// Athlete routes
router.post('/', authenticateToken, CoachingRequestController.sendRequest);
router.get('/athlete/:athleteId', authenticateToken, CoachingRequestController.getRequestsByAthlete);

// Coach routes
router.get('/coach/:coachId', authenticateToken, CoachingRequestController.getRequestsByCoach);
router.patch('/:id', authenticateToken, CoachingRequestController.updateStatus);

export default router;
