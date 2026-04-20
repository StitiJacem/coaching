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
            
            console.log(`[DEBUG] Google Auth - Received ID Token for aud: ${payload.aud}`);
            console.log(`[DEBUG] Google Auth - Expected Client ID: ${clientId}`);

            if (payload.aud !== clientId) {
                console.error(`[ERROR] Google Auth - Client ID mismatch!`);
                return null;
            }

            return {
                sub: payload.sub,
                email: payload.email,
                given_name: payload.given_name,
                family_name: payload.family_name,
                email_verified: payload.email_verified === 'true' || payload.email_verified === true
            };
        } catch (error: any) {
            console.error('Google token verification failed:', error.response?.data || error.message);
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
            bio?: string;
            experience_years?: number;
            work_type?: string;
            offer_types?: string[];
            photo_url?: string;
            phone?: string;
            // Athlete specific
            height?: number;
            weight?: number;
            sport?: string;
            primaryObjective?: string;
            experienceLevel?: string;
            timePerSession?: string;
            equipment?: string;
            fitnessLevel?: string;
            weightGoal?: number;
            injuries?: string;
        }
    ): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new Error('User not found');
        }

        user.first_name = data.first_name;
        user.last_name = data.last_name;
        user.role = data.role;
        user.phone = data.phone;
        user.photo_url = data.photo_url;
        user.profile_completed = true;

        if (data.role === 'coach') {
            const coachRepo = AppDataSource.getRepository('coach_profiles');
            let coachProfile = await coachRepo.findOne({ where: { userId: user.id } }) as any;

            if (!coachProfile) {
                coachProfile = coachRepo.create({
                    userId: user.id,
                    bio: data.bio || '',
                    experience_years: Number(data.experience_years) || 0
                });
            } else {
                coachProfile.bio = data.bio || coachProfile.bio;
                coachProfile.experience_years = Number(data.experience_years) || coachProfile.experience_years;
            }
            await coachRepo.save(coachProfile);
        } else if (data.role === 'athlete') {
            const athleteRepo = AppDataSource.getRepository('athletes');
            let athlete = await athleteRepo.findOne({ where: { userId: user.id } }) as any;

            if (!athlete) {
                athlete = athleteRepo.create({
                    userId: user.id,
                    height: data.height ? Number(data.height) : undefined,
                    weight: data.weight ? Number(data.weight) : undefined,
                    sport: data.sport,
                    primaryObjective: data.primaryObjective,
                    experienceLevel: data.experienceLevel,
                    timePerSession: data.timePerSession,
                    equipment: data.equipment,
                    fitnessLevel: data.fitnessLevel,
                    weightGoal: data.weightGoal ? Number(data.weightGoal) : undefined,
                    injuries: data.injuries
                });
            } else {
                if (data.height !== undefined) athlete.height = data.height ? Number(data.height) : null;
                if (data.weight !== undefined) athlete.weight = data.weight ? Number(data.weight) : null;
                if (data.sport !== undefined) athlete.sport = data.sport;
                if (data.primaryObjective !== undefined) athlete.primaryObjective = data.primaryObjective;
                if (data.experienceLevel !== undefined) athlete.experienceLevel = data.experienceLevel;
                if (data.timePerSession !== undefined) athlete.timePerSession = data.timePerSession;
                if (data.equipment !== undefined) athlete.equipment = data.equipment;
                if (data.fitnessLevel !== undefined) athlete.fitnessLevel = data.fitnessLevel;
                if (data.weightGoal !== undefined) athlete.weightGoal = data.weightGoal ? Number(data.weightGoal) : null;
                if (data.injuries !== undefined) athlete.injuries = data.injuries;
            }
            await athleteRepo.save(athlete);
        }

        return await this.userRepository.save(user);
    }
}
