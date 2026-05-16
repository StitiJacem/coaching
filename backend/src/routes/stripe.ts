import { Router } from 'express';
import { StripeController } from '../controllers/StripeController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

// Webhook MUST be parsed as raw body for signature verification (handled in app.ts)
router.post('/webhook', StripeController.webhookHandler);

// Coach onboarding
router.post('/connect', authenticateToken, StripeController.createConnectAccount);

// Athlete checkout
router.post('/checkout', authenticateToken, StripeController.createCheckoutSession);

export default router;
