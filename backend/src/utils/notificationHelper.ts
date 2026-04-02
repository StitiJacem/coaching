import { AppDataSource } from "../orm/data-source";
import { Program } from "../entities/Program";
import { CoachingRequest } from "../entities/CoachingRequest";
import { Notification } from "../entities/Notification";
import { ActivityEvent } from "../entities/ActivityEvent";

export async function notifyUser(
    userId: number,
    type: string,
    title: string,
    body?: string,
    payload?: Record<string, unknown>
): Promise<void> {
    try {
        const repo = AppDataSource.getRepository(Notification);
        await repo.save(repo.create({ userId, type, title, body, payload }));
    } catch (err) {
        console.error("Failed to create notification:", err);
    }
}

export async function getCoachUserIdsForAthlete(athleteId: number): Promise<number[]> {
    const ids = new Set<number>();

    const programRepo = AppDataSource.getRepository(Program);
    const programs = await programRepo.find({
        where: { athleteId },
        relations: ["coach", "coachProfile"],
    });
    for (const p of programs) {
        if (p.coachId) ids.add(p.coachId as number);
        if (p.coachProfile?.userId) ids.add(p.coachProfile.userId);
    }

    const requestRepo = AppDataSource.getRepository(CoachingRequest);
    const requests = await requestRepo.find({
        where: { athleteId, status: "accepted" },
        relations: ["coachProfile"],
    });
    for (const r of requests) {
        if (r.coachProfile?.userId) ids.add(r.coachProfile.userId);
    }

    return Array.from(ids);
}

export async function notifyCoachesOfAthlete(
    athleteId: number,
    type: string,
    title: string,
    body?: string,
    payload?: Record<string, unknown>
): Promise<void> {
    try {
        const coachIds = await getCoachUserIdsForAthlete(athleteId);
        const repo = AppDataSource.getRepository(Notification);
        for (const userId of coachIds) {
            await repo.save(
                repo.create({
                    userId,
                    type,
                    title,
                    body,
                    payload: { athleteId, ...payload },
                })
            );
        }
    } catch (err) {
        console.error("Failed to create notifications:", err);
    }
}
