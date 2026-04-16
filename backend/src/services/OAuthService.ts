import axios from 'axios';
import { User } from '../entities/User';
import { AppDataSource } from '../orm/data-source';

interface GoogleTokenPayload {
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
    email_verified: boolean;
}

interface FacebookTokenPayload {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
}

export class OAuthService {
    private userRepository = AppDataSource.getRepository(User);

    async verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload | null> {
        try {
            const response = await axios.get(
                `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
            );

            const payload = response.data;


            const clientId = process.env.GOOGLE_CLIENT_ID;
            if (payload.aud !== clientId) {
                return null;
            }

            return {
                sub: payload.sub,
                email: payload.email,
                given_name: payload.given_name,
                family_name: payload.family_name,
                email_verified: payload.email_verified === 'true' || payload.email_verified === true
            };
        } catch (error) {
            console.error('Google token verification failed:', error);
            return null;
        }
    }

    async verifyFacebookToken(accessToken: string): Promise<FacebookTokenPayload | null> {
        try {
            const response = await axios.get(
                `https://graph.facebook.com/me?fields=id,email,first_name,last_name&access_token=${accessToken}`
            );

            return {
                id: response.data.id,
                email: response.data.email,
                first_name: response.data.first_name,
                last_name: response.data.last_name
            };
        } catch (error) {
            console.error('Facebook token verification failed:', error);
            return null;
        }
    }

    async findOrCreateOAuthUser(
        provider: 'google' | 'facebook',
        oauthId: string,
        email: string,
        firstName?: string,
        lastName?: string
    ): Promise<User> {

        let user = await this.userRepository.findOne({
            where: { oauth_provider: provider, oauth_id: oauthId }
        });

        if (user) {
            return user;
        }


        user = await this.userRepository.findOne({ where: { email } });

        if (user) {

            user.oauth_provider = provider;
            user.oauth_id = oauthId;
            user.is_verified = true;
            await this.userRepository.save(user);
            return user;
        }


        const newUser = new User({
            email,
            first_name: firstName,
            last_name: lastName,
            username: email.split('@')[0],
            oauth_provider: provider,
            oauth_id: oauthId,
            is_verified: true,
            profile_completed: false,
            role: 'athlete'
        });

        return await this.userRepository.save(newUser);
    }

    async completeProfile(
        userId: number,
        data: {
            first_name: string;
            last_name: string;
            role: string;
        }
    ): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new Error('User not found');
        }

        user.first_name = data.first_name;
        user.last_name = data.last_name;
        user.role = data.role;
        user.profile_completed = true;

        return await this.userRepository.save(user);
    }
}
