import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { CoachProfile } from "../entities/Coach";
import { Athlete } from "../entities/Athlete";
import { CoachingRequest } from "../entities/CoachingRequest";
import { User } from "../entities/User";

export class CoachController {
    // GET /api/coaches - Get all verified coaches
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

            // Get all coaches (users with role 'coach')
            const coaches = await userRepo.find({ where: { role: 'coach' } });

            // Get or create profiles for all coaches to ensure they appear
            const coachProfiles: any[] = [];
            for (const coachUser of coaches) {
                let profile = await coachProfileRepo.findOne({
                    where: { userId: coachUser.id },
                    relations: ['specializations']
                });

                if (!profile) {
                    // Temporarily create a virtual profile for the UI if it doesn't exist
                    profile = coachProfileRepo.create({
                        userId: coachUser.id,
                        user: coachUser,
                        verified: true,
                        rating: 4.5, // Default rating for new coaches
                        experience_years: 0,
                        bio: 'Elite Performance Coach'
                    });
                    profile.user = coachUser;
                }

                // Filtering logic: Skip if already connected or pending
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
                    id: profile.id || null, // Might be null if virtual
                    userId: coachUser.id,
                    name: `${coachUser.first_name || ''} ${coachUser.last_name || ''}`.trim() || coachUser.username || 'Coach',
                    avatar: `https://ui-avatars.com/api/?name=${coachUser.first_name || 'Coach'}+${coachUser.last_name || ''}&background=random`,
                    specializations: (profile.specializations || []).map((s: any) => s.specialization),
                    bio: profile.bio || 'Professional Coach available for training.',
                    rating: parseFloat(profile.rating as any) || 4.5,
                    experience_years: profile.experience_years || 0,
                    verified: profile.verified ?? true,
                    price: 80 // Default price
                });
            }

            res.json(coachProfiles);
        } catch (error) {
            console.error("Error fetching coaches:", error);
            res.status(500).json({ message: "Error fetching coaches" });
        }
    };

    // GET /api/coaches/:id - Get single coach detail
    static getById = async (req: Request, res: Response) => {
        try {
            const coachRepo = AppDataSource.getRepository(CoachProfile);
            const coach = await coachRepo.findOne({
                where: { id: req.params.id as string },
                relations: ["user", "specializations", "certifications"]
            });

            if (!coach) {
                return res.status(404).json({ message: "Coach not found" });
            }

            res.json(coach);
        } catch (error) {
            console.error("Error fetching coach:", error);
            res.status(500).json({ message: "Error fetching coach" });
        }
    };
}
