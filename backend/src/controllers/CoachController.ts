import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { CoachProfile } from "../entities/CoachProfile";

export class CoachController {
    // GET /api/coaches - Get all verified coaches
    static getAll = async (req: Request, res: Response) => {
        try {
            const coachRepo = AppDataSource.getRepository(CoachProfile);
            const { specialization } = req.query;

            const queryBuilder = coachRepo.createQueryBuilder("coach")
                .leftJoinAndSelect("coach.user", "user")
                .leftJoinAndSelect("coach.specializations", "specializations")
                .where("coach.verified = :verified", { verified: true });

            if (specialization) {
                queryBuilder.andWhere("specializations.specialization = :spec", { spec: specialization });
            }

            const coaches = await queryBuilder.getMany();

            // Format for frontend
            const formattedCoaches = coaches.map(c => ({
                id: c.id,
                name: `${c.user.first_name} ${c.user.last_name}`,
                avatar: "assets/avatars/default-coach.png",
                specializations: c.specializations.map(s => s.specialization),
                bio: c.bio || "No bio available.",
                rating: Number(c.rating),
                experience_years: c.experience_years,
                verified: c.verified
            }));

            res.json(formattedCoaches);
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
