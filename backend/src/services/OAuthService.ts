import axios from 'axios';
import { User } from '../entities/User';
import { Athlete } from '../entities/Athlete';
import { CoachProfile } from '../entities/Coach';
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
    async verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload | null> {
        try {
            const response = await axios.get(
                `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
            );

            const payload = response.data;


            const clientId = process.env['GOOGLE_CLIENT_ID'];
            if (payload.aud !== clientId) {
                console.error('Google Client ID mismatch');
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
        const userRepository = AppDataSource.getRepository(User);

        let user = await userRepository.findOne({
            where: { oauth_provider: provider, oauth_id: oauthId }
        });

        if (user) {
            return user;
        }


        user = await userRepository.findOne({ where: { email } });

        if (user) {

            user.oauth_provider = provider;
            user.oauth_id = oauthId;
            user.is_verified = true;
            await userRepository.save(user);
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

        return await userRepository.save(newUser);
    }

    async completeProfile(
        userId: number,
        data: any
    ): Promise<User> {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new Error('User not found');
        }

        user.first_name = data.first_name || user.first_name;
        user.last_name = data.last_name || user.last_name;
        user.role = data.role || user.role;
        user.profile_completed = true;

        await userRepository.save(user);

        // Handle Role Specific Profiles
        if (user.role === 'athlete') {
            const athleteRepo = AppDataSource.getRepository(Athlete);
            let athlete = await athleteRepo.findOne({ where: { userId } });

            if (!athlete) {
                athlete = athleteRepo.create({ userId });
            }

            athlete.primaryObjective = data.primaryObjective;
            athlete.experienceLevel = data.experienceLevel;
            athlete.timePerSession = data.timePerSession;
            athlete.sport = data.sport;
            athlete.equipment = data.equipment;
            athlete.fitnessLevel = data.fitnessLevel;

            if (data.weightGoal !== undefined && data.weightGoal !== null && data.weightGoal.toString().trim() !== '') {
                const val = Number(data.weightGoal);
                if (!isNaN(val)) athlete.weightGoal = val;
            }

            athlete.phone = data.phone;
            athlete.nationality = data.nationality;

            if (data.dateOfBirth && data.dateOfBirth.toString().trim() !== '') {
                const dob = new Date(data.dateOfBirth);
                if (!isNaN(dob.getTime())) {
                    athlete.dateOfBirth = dob;
                }
            }

            athlete.lastActive = new Date();

            await athleteRepo.save(athlete);
        } else if (user.role === 'coach') {
            const coachRepo = AppDataSource.getRepository(CoachProfile);
            let coach = await coachRepo.findOne({ where: { userId } });

            if (!coach) {
                coach = coachRepo.create({ userId });
            }

            coach.workType = data.workType;

            if (data.experience_years !== undefined && data.experience_years !== null && data.experience_years.toString().trim() !== '') {
                const val = Number(data.experience_years);
                coach.experience_years = isNaN(val) ? 0 : val;
            } else {
                coach.experience_years = coach.experience_years || 0;
            }

            coach.offerTypes = Array.isArray(data.offerTypes) ? data.offerTypes : [];
            coach.bio = data.bio;
            coach.phone = data.phone;
            coach.location = data.location;

            await coachRepo.save(coach);
        }

        return user;
    }
}
