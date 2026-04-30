import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { OAuthController } from '../controllers/OAuthController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();
const authController = new AuthController();
const oauthController = new OAuthController();

router.post('/signup', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-code', authController.resendCode);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);


router.post('/google', oauthController.googleAuth);
router.post('/facebook', oauthController.facebookAuth);
router.post('/complete-profile', authenticateToken, oauthController.completeProfile);

export default router;
