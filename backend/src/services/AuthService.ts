import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../entities/User';
import { AppDataSource } from '../orm/data-source';
import { CoachProfile } from '../entities/Coach';
import { CoachSpecialization } from '../entities/CoachSpecialization';
import { Athlete } from '../entities/Athlete';
import { NutritionistProfile } from '../entities/NutritionistProfile';
import { EmailService } from '../utils/EmailService';

export class AuthService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async register(userData: any): Promise<User> {
        const email = userData.email?.toLowerCase();
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(userData.password!, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            ...userData,
            email: email,
            password: hashedPassword,
            verification_code: verificationCode,
            code_expires_at: new Date(Date.now() + 3600000),
            is_verified: false,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role || 'athlete'
        });

        const savedUser = await this.userRepository.create(user);


        if (userData.role === 'coach') {
            await AppDataSource.transaction(async transactionalEntityManager => {
                const coachProfile = new CoachProfile();
                coachProfile.userId = savedUser.id;
                coachProfile.user = savedUser;
                const savedProfile = await transactionalEntityManager.save(coachProfile);

                if (userData.specializations && Array.isArray(userData.specializations)) {
                    const specializationEntities = userData.specializations.map((spec: string) => {
                        const s = new CoachSpecialization();
                        s.coachProfileId = savedProfile.id;
                        s.specialization = spec;
                        return s;
                    });
                    await transactionalEntityManager.save(specializationEntities);
                }
            });
        } else if (userData.role === 'athlete') {
            const athleteProfile = new Athlete();
            athleteProfile.userId = savedUser.id;
            athleteProfile.lastActive = new Date();
            await AppDataSource.getRepository(Athlete).save(athleteProfile);
        }

        const greetingName = savedUser.first_name || savedUser.username || 'Sportif';
        await EmailService.sendVerificationEmail(savedUser.email, verificationCode, greetingName);

        return savedUser;
    }

    async login(email: string, password: string): Promise<{ user: any, token: string }> {
        const normalizedEmail = email.toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.is_verified) {
            throw new Error('Please verify your email before logging in');
        }

        if (!user.password) {
            throw new Error('Invalid credentials. Please use social login.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        );

        // Enrich user response with role-specific profile IDs
        let athleteId: number | null = null;
        let nutritionistProfileId: string | null = null;

        if (user.role === 'athlete') {
            const athleteProfile = await AppDataSource.getRepository(Athlete).findOne({ where: { userId: user.id } });
            if (athleteProfile) athleteId = athleteProfile.id;
        } else if (user.role === 'nutritionist') {
            const nutriProfile = await AppDataSource.getRepository(NutritionistProfile).findOne({ where: { userId: user.id } });
            if (nutriProfile) nutritionistProfileId = nutriProfile.id;
        }

        const enrichedUser = {
            ...user,
            athleteId,
            nutritionistProfileId
        };

        return { user: enrichedUser, token };
    }

    async verifyEmail(email: string, code: string): Promise<boolean> {
        const normalizedEmail = email.toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.is_verified) {
            return true;
        }

        if (user.verification_code !== code) {
            throw new Error('Invalid verification code');
        }

        if (user.code_expires_at && new Date() > user.code_expires_at) {
            throw new Error('Verification code has expired');
        }

        await this.userRepository.updateVerification(user.id, true);
        return true;
    }

    async resendCode(email: string): Promise<void> {
        const normalizedEmail = email.toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);
        if (!user) {
            throw new Error('User not found');
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verification_code = verificationCode;
        user.code_expires_at = new Date(Date.now() + 3600000);

        await this.userRepository.create(user);

        const greetingName = user.first_name || user.username || 'Sportif';
        await EmailService.sendVerificationEmail(user.email, verificationCode, greetingName);
    }

    async forgotPassword(email: string): Promise<void> {
        const normalizedEmail = email.toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);
        if (!user) {
            throw new Error('User not found');
        }

        // Generate reset code (reusing verification code field)
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verification_code = resetCode;
        user.code_expires_at = new Date(Date.now() + 3600000); // 1 hour expiry

        await this.userRepository.create(user);

        const greetingName = user.first_name || user.username || 'Sportif';
        await EmailService.sendPasswordResetEmail(user.email, resetCode, greetingName);
    }

    async resetPassword(data: any): Promise<void> {
        try {
            const { email, code, password, newPassword } = data;
            const finalPassword = password || newPassword;
            const normalizedEmail = String(email || '').toLowerCase();
            
            const user = await this.userRepository.findByEmail(normalizedEmail);

            if (!user) {
                throw new Error('User not found');
            }

            if (String(user.verification_code) !== String(code)) {
                throw new Error('Invalid reset code');
            }

            if (user.code_expires_at && new Date() > user.code_expires_at) {
                throw new Error('Reset code has expired');
            }

            if (!finalPassword) {
                throw new Error('Password is required');
            }

            // Update password
            const hashedPassword = await bcrypt.hash(finalPassword, 10);
            user.password = hashedPassword;
            
            // Clear reset code
            user.verification_code = null;
            user.code_expires_at = null;

            await this.userRepository.create(user);
        } catch (error: any) {
            console.error(`[ResetPassword] Error: ${error.message}`);
            throw error;
        }
    }
}
