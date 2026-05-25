import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { OAuthController } from '../controllers/OAuthController';
import { authenticateToken } from '../middleware/authenticateToken';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} from '../validators/auth.validator';

const router = Router();
const authController = new AuthController();
const oauthController = new OAuthController();

router.post('/signup', validate(registerSchema), authController.register);
router.post('/login', authRateLimiter(15 * 60 * 1000, 10), validate(loginSchema), authController.login);
router.post('/verify-email', authRateLimiter(15 * 60 * 1000, 10), validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-code', authRateLimiter(15 * 60 * 1000, 5), validate(forgotPasswordSchema), authController.resendCode);
router.post('/forgot-password', authRateLimiter(15 * 60 * 1000, 5), validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter(15 * 60 * 1000, 5), validate(resetPasswordSchema), authController.resetPassword);


router.post('/google', oauthController.googleAuth);
router.post('/facebook', oauthController.facebookAuth);
router.post('/complete-profile', authenticateToken, oauthController.completeProfile);

export default router;
