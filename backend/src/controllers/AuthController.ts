import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { sanitizeUser } from '../utils/sanitizeUser';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    register = async (req: Request, res: Response) => {
        try {
            const user = await this.authService.register(req.body);
            res.status(201).json({ message: 'User registered', user: sanitizeUser(user) });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            res.json(result);
        } catch (err: any) {
            res.status(401).json({ error: err.message });
        }
    }

    verifyEmail = async (req: Request, res: Response) => {
        try {
            const { email, code } = req.body;
            await this.authService.verifyEmail(email, code);
            res.json({ message: 'Email verified successfully' });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    resendCode = async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            await this.authService.resendCode(email);
            res.json({ message: 'Verification code resent' });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    forgotPassword = async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            await this.authService.forgotPassword(email);
            res.json({ message: 'If the email exists, a password reset code has been sent' });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

    resetPassword = async (req: Request, res: Response) => {
        try {
            await this.authService.resetPassword(req.body);
            res.json({ message: 'Password reset successfully' });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }
}
