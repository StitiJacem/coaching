import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { CoachProfile } from "../entities/Coach";
import { CoachSpecialization } from "../entities/CoachSpecialization";
import { Athlete } from "../entities/Athlete";
import { CoachingRequest } from "../entities/CoachingRequest";
import { User } from "../entities/User";

export class CoachController {

    static getAll = async (req: Request, res: Response) => {
        const userRepo = AppDataSource.getRepository(User);
        const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
        const requestRepo = AppDataSource.getRepository(CoachingRequest);

        try {
            const currentUserId = (req as any).user?.id;
            let currentAthleteId: number | null = null;

            if (currentUserId) {
                const athleteRepo = AppDataSource.getRepository(Athlete);
                const athlete = await athleteRepo.findOne({ where: { userId: currentUserId } });
                currentAthleteId = athlete ? athlete.id : null;
            }


            const coaches = await userRepo.find({ where: { role: 'coach' } });


            const coachProfiles: any[] = [];
            for (const coachUser of coaches) {
                let profile = await coachProfileRepo.findOne({
                    where: { userId: coachUser.id },
                    relations: ['specializations']
                });

                if (!profile) {

                    profile = coachProfileRepo.create({
                        userId: coachUser.id,
                        user: coachUser,
                        verified: true,
                        rating: 4.5,
                        experience_years: 0,
                        bio: 'Elite Performance Coach'
                    });
                    profile.user = coachUser;
                }


                if (currentAthleteId && profile.id) {
                    const existingRequest = await requestRepo.findOne({
                        where: [
                            { athleteId: currentAthleteId, coachProfileId: profile.id },
                            { athleteId: currentAthleteId, coachProfileId: profile.id, status: 'accepted' }
                        ]
                    });
                    if (existingRequest) continue;
                }

                coachProfiles.push({
                    id: profile.id || null,
                    userId: coachUser.id,
                    name: `${coachUser.first_name || ''} ${coachUser.last_name || ''}`.trim() || coachUser.username || 'Coach',
                    avatar: `https://ui-avatars.com/api/?name=${coachUser.first_name || 'Coach'}+${coachUser.last_name || ''}&background=random`,
                    specializations: (profile.specializations || []).map((s: any) => s.specialization),
                    bio: profile.bio || 'Professional Coach available for training.',
                    rating: parseFloat(profile.rating as any) || 4.5,
                    experience_years: profile.experience_years || 0,
                    verified: profile.verified ?? true,
                    price: 80
                });
            }

            res.json(coachProfiles);
        } catch (error) {
            console.error("Error fetching coaches:", error);
            res.status(500).json({ message: "Error fetching coaches" });
        }
    };


    static getById = async (req: Request, res: Response) => {
        try {
            const coachRepo = AppDataSource.getRepository(CoachProfile);
            const userRepo = AppDataSource.getRepository(User);
            const idParam = req.params.id as string;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);

            let coach = null;
            if (isUUID) {
                coach = await coachRepo.findOne({
                    where: { id: idParam },
                    relations: ["user", "specializations", "certifications"]
                });
            }

            // Fallback: If not found by ID (or not a UUID), try finding by userId
            let userId = parseInt(idParam);
            if (!coach && !isNaN(userId)) {
                coach = await coachRepo.findOne({
                    where: { userId: userId },
                    relations: ["user", "specializations", "certifications"]
                });
            }

            // If still not found, check if the user exists and is a coach
            if (!coach && !isNaN(userId)) {
                const user = await userRepo.findOne({ where: { id: userId, role: 'coach' } });
                if (user) {
                    // Create default profile for existing coach user
                    coach = coachRepo.create({
                        userId: user.id,
                        user: user,
                        verified: true,
                        rating: 4.5,
                        experience_years: 0,
                        bio: 'Professional Performance Coach'
                    });
                    await coachRepo.save(coach);
                }
            }

            if (!coach) {
                return res.status(404).json({ message: "Coach not found" });
            }

            res.json(coach);
        } catch (error) {
            console.error("Error fetching coach:", error);
            res.status(500).json({ message: "Error fetching coach" });
        }
    };

    static update = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
            const userRepo = AppDataSource.getRepository(User);

            const profile = await coachProfileRepo.findOne({
                where: { userId: userId },
                relations: ["specializations", "user"]
            });

            if (!profile) {
                return res.status(404).json({ message: "Coach profile not found" });
            }

            const { bio, experience_years, specializations, first_name, last_name, phone, photo_url } = req.body;

            if (bio !== undefined) profile.bio = bio;
            if (experience_years !== undefined) profile.experience_years = experience_years;

            // Handle User fields
            let userUpdateNeeded = false;
            const user = profile.user;
            
            if (first_name) { user.first_name = first_name; userUpdateNeeded = true; }
            if (last_name) { user.last_name = last_name; userUpdateNeeded = true; }
            if (phone !== undefined) { user.phone = phone; userUpdateNeeded = true; }
            if (photo_url !== undefined) { user.photo_url = photo_url; userUpdateNeeded = true; }

            if (userUpdateNeeded) {
                await userRepo.save(user);
            }

            if (specializations !== undefined && Array.isArray(specializations)) {
                // Clear existing and add new
                const specRepo = AppDataSource.getRepository(CoachSpecialization);
                await specRepo.delete({ coachProfileId: profile.id });
                
                profile.specializations = specializations.map(s => {
                    const spec = new CoachSpecialization();
                    spec.coachProfileId = profile.id;
                    spec.specialization = typeof s === 'string' ? s : s.specialization;
                    return spec;
                });
            }

            const updatedProfile = await coachProfileRepo.save(profile);
            res.json(updatedProfile);
        } catch (error) {
            console.error("Error updating coach profile:", error);
            res.status(500).json({ message: "Error updating coach profile" });
        }
    };
}
