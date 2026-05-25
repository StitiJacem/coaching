import { Request, Response } from 'express';
import { OAuthService } from '../services/OAuthService';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/jwt.config';
import { sanitizeUser } from '../utils/sanitizeUser';

const oauthService = new OAuthService();

export class OAuthController {
    async googleAuth(req: Request, res: Response) {
        try {
            const { id_token } = req.body;

            if (!id_token) {
                return res.status(400).json({ message: 'ID token is required' });
            }


            const payload = await oauthService.verifyGoogleToken(id_token);

            if (!payload) {
                return res.status(401).json({ message: 'Invalid Google token' });
            }


            const user = await oauthService.findOrCreateOAuthUser(
                'google',
                payload.sub,
                payload.email,
                payload.given_name,
                payload.family_name
            );


            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                getJwtSecret(),
                { expiresIn: '7d' }
            );

            return res.json({
                token,
                user: sanitizeUser(user)
            });
        } catch (error: any) {
            console.error('Google auth error:', error);
            return res.status(500).json({ message: 'Authentication failed', error: error.message });
        }
    }

    async facebookAuth(req: Request, res: Response) {
        try {
            const { access_token } = req.body;

            if (!access_token) {
                return res.status(400).json({ message: 'Access token is required' });
            }


            const payload = await oauthService.verifyFacebookToken(access_token);

            if (!payload) {
                return res.status(401).json({ message: 'Invalid Facebook token' });
            }


            const user = await oauthService.findOrCreateOAuthUser(
                'facebook',
                payload.id,
                payload.email,
                payload.first_name,
                payload.last_name
            );


            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                getJwtSecret(),
                { expiresIn: '7d' }
            );

            return res.json({
                token,
                user: sanitizeUser(user)
            });
        } catch (error: any) {
            console.error('Facebook auth error:', error);
            return res.status(500).json({ message: 'Authentication failed', error: error.message });
        }
    }

    async completeProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const { 
                first_name, last_name, role, bio, experience_years, work_type, coachOfferTypes, photo_url, phone,
                weight, height, sport, primaryObjective, experienceLevel, timePerSession, equipment,
                fitnessLevel, weightGoal, injuries
            } = req.body;

            if (!first_name || !last_name || !role) {
                return res.status(400).json({
                    message: 'First name, last name, and role are required'
                });
            }

            const user = await oauthService.completeProfile(userId, {
                first_name,
                last_name,
                role,
                bio,
                experience_years,
                work_type,
                offer_types: coachOfferTypes,
                photo_url,
                phone,
                weight,
                height,
                sport,
                primaryObjective,
                experienceLevel,
                timePerSession,
                equipment,
                fitnessLevel,
                weightGoal,
                injuries
            });

            return res.json({
                message: 'Profile completed successfully',
                user: sanitizeUser(user)
            });
        } catch (error: any) {
            console.error('Complete profile error:', error);
            return res.status(500).json({ message: 'Profile completion failed', error: error.message });
        }
    }
}
