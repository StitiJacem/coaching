import { AppDataSource } from "../orm/data-source";
import { Athlete } from "../entities/Athlete";

/**
 * Resolves the true athleteId to use for database queries.
 * 
 * The frontend sometimes passes `userId` instead of `athleteId` in the URL (e.g., /api/athletes/:userId/overview).
 * Additionally, when an athlete calls their own endpoints, they only have their `req.user.id` (userId) from the JWT.
 * If the requesting user is an athlete and the paramId matches their userId, we look up their actual athleteId.
 * Otherwise, we assume the paramId is already the correct athleteId (e.g., requested by a coach).
 * 
 * @param user The logged-in user from the JWT (req.user)
 * @param paramId The ID passed in the route parameter
 * @returns The resolved athleteId
 */
export async function resolveAthleteId(user: any, paramId: number): Promise<number> {
    if (user.role === 'athlete' && Number(user.id) === Number(paramId)) {
        const athleteRepo = AppDataSource.getRepository(Athlete);
        const athlete = await athleteRepo.findOne({ where: { userId: user.id } });

        if (!athlete) {
            throw new Error(`Athlete profile not found for user ID: ${user.id}`);
        }

        return athlete.id;
    }
    return paramId;
}
