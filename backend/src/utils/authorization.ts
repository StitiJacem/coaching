import { AppDataSource } from "../orm/data-source";
import { Athlete } from "../entities/Athlete";
import { CoachProfile } from "../entities/Coach";
import { CoachingRequest } from "../entities/CoachingRequest";
import { Program } from "../entities/Program";

/**
 * Reusable authorization helper: coaches can only access athletes they are
 * linked to (accepted coaching request OR program). Athletes can only access themselves.
 */
export async function canAccessAthlete(user: { id: number; role: string }, athleteId: number): Promise<boolean> {
    if (user.role === "athlete") {
        const athleteRepo = AppDataSource.getRepository(Athlete);
        const athlete = await athleteRepo.findOne({ where: { userId: user.id } });
        return athlete?.id === athleteId;
    }

    if (user.role === "coach") {
        const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
        const coachProfile = await coachProfileRepo.findOne({ where: { userId: user.id } });
        if (!coachProfile) return false;

        const requestRepo = AppDataSource.getRepository(CoachingRequest);
        const hasRequest = await requestRepo.findOne({
            where: {
                athleteId,
                coachProfileId: coachProfile.id,
                status: "accepted",
            },
        });
        if (hasRequest) return true;

        const programRepo = AppDataSource.getRepository(Program);
        const hasProgram = await programRepo.findOne({
            where: [
                { athleteId, coachId: user.id },
                { athleteId, coachProfileId: coachProfile.id },
            ],
        });
        return !!hasProgram;
    }

    return false;
}
