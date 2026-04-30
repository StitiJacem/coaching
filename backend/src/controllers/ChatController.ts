import { Request, Response } from "express";
import { Brackets, WhereExpressionBuilder } from "typeorm";
import { AppDataSource } from "../orm/data-source";
import { Conversation, ConversationType } from "../entities/Conversation";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { CoachingRequest } from "../entities/CoachingRequest";
import { Athlete } from "../entities/Athlete";
import { CoachProfile } from "../entities/Coach";
import { NutritionConnection } from "../entities/NutritionConnection";
import { NutritionistProfile } from "../entities/NutritionistProfile";

export class ChatController {
    // Helper to get conversations
    static async fetchConversations(userId: number) {
        const conversationRepo = AppDataSource.getRepository(Conversation);
        return await conversationRepo.find({
            where: [
                { participant1Id: userId },
                { participant2Id: userId }
            ],
            relations: ["participant1", "participant2"],
            order: { updated_at: "DESC" }
        });
    }

    // Helper to get contacts
    static async fetchContacts(userId: number, role: string) {
        const contacts: any[] = [];
        console.log(`[ChatController] Fetching contacts for userId: ${userId}, role: ${role}`);

        if (role === 'coach') {
            const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
            const coachProfile = await coachProfileRepo.findOne({ where: { userId } });
            
            console.log(`[ChatController] CoachProfile found: ${!!coachProfile} for userId: ${userId}`);
            
            if (coachProfile) {
                const athleteRepo = AppDataSource.getRepository(Athlete);
                // We use a cleaner JOIN approach instead of raw SQL EXISTS strings where possible
                const athletes = await athleteRepo.createQueryBuilder("athlete")
                    .leftJoinAndSelect("athlete.user", "user")
                    .innerJoin("coaching_requests", "cr", 'cr."athleteId" = athlete.id AND cr."coachProfileId" = :profileId AND cr.status = \'accepted\'', { profileId: coachProfile.id })
                    .getMany();

                console.log(`[ChatController] Athletes found via coaching_requests: ${athletes.length} (ProfileId: ${coachProfile.id})`);

                // Also get athletes from programs even if no coaching request (migration/edge cases)
                const programAthletes = await athleteRepo.createQueryBuilder("athlete")
                    .leftJoinAndSelect("athlete.user", "user")
                    .innerJoin("programs", "p", 'p."athleteId" = athlete.id AND p."coachId" = :coachId', { coachId: userId })
                    .getMany();

                console.log(`[ChatController] Athletes found via programs: ${programAthletes.length}`);

                [...athletes, ...programAthletes].forEach(a => {
                    if (a.user) {
                        console.log(`[ChatController] Adding contact: ${a.user.email}`);
                        contacts.push(a.user);
                    }
                });
            }
        } else if (role === 'nutritionist') {
            const nutriProfileRepo = AppDataSource.getRepository(NutritionistProfile);
            const profile = await nutriProfileRepo.findOne({ where: { userId } });
            
            if (profile) {
                const athleteRepo = AppDataSource.getRepository(Athlete);
                const athletes = await athleteRepo.createQueryBuilder("athlete")
                    .leftJoinAndSelect("athlete.user", "user")
                    .innerJoin("nutrition_connections", "nc", 'nc."athleteId" = athlete.id AND nc."nutritionistProfileId" = :nutriId AND nc.status = \'accepted\'', { nutriId: profile.id })
                    .getMany();

                athletes.forEach(a => {
                    if (a.user) contacts.push(a.user);
                });
            }
        } else if (role === 'athlete') {
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const athlete = await athleteRepo.findOne({ where: { userId } });
            
            if (athlete) {
                // Find all coaches through coaching_requests
                const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
                const coaches = await coachProfileRepo.createQueryBuilder("coach")
                    .leftJoinAndSelect("coach.user", "user")
                    .innerJoin("coaching_requests", "cr", 'cr."coachProfileId" = coach.id AND cr."athleteId" = :athleteId AND cr.status = \'accepted\'', { athleteId: athlete.id })
                    .getMany();
                
                coaches.forEach(c => { if (c.user) contacts.push(c.user); });

                // Find all nutritionists through nutrition_connections
                const nutriProfileRepo = AppDataSource.getRepository(NutritionistProfile);
                const nutritionists = await nutriProfileRepo.createQueryBuilder("nutri")
                    .leftJoinAndSelect("nutri.user", "user")
                    .innerJoin("nutrition_connections", "nc", 'nc."nutritionistProfileId" = nutri.id AND nc."athleteId" = :athleteId AND nc.status = \'accepted\'', { athleteId: athlete.id })
                    .getMany();
                
                nutritionists.forEach(n => { if (n.user) contacts.push(n.user); });
            }
        }

        console.log(`[ChatController] Found ${contacts.length} raw contacts`);
        // Filter out self and unique
        return Array.from(new Map(contacts.filter(c => c.id !== userId).map(c => [c.id, c])).values());
    }

    static async getConversations(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const conversations = await ChatController.fetchConversations(userId);
            res.json(conversations);
        } catch (error) {
            console.error("Error getting conversations:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getMessages(req: Request, res: Response) {
        try {
            const { conversationId } = req.params;
            const messageRepo = AppDataSource.getRepository(Message);

            const messages = await messageRepo.find({
                where: { conversationId: conversationId as string },
                order: { created_at: "ASC" },
                relations: ["sender"]
            });

            res.json(messages);
        } catch (error) {
            console.error("Error getting messages:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async startConversation(req: Request, res: Response) {
        try {
            const senderId = (req as any).user.id;
            const { receiverId, type } = req.body;

            const conversationRepo = AppDataSource.getRepository(Conversation);

            // Check if exists
            let conversation = await conversationRepo.findOne({
                where: [
                    { participant1Id: senderId, participant2Id: receiverId, type: type as ConversationType },
                    { participant1Id: receiverId, participant2Id: senderId, type: type as ConversationType }
                ]
            });

            if (!conversation) {
                conversation = conversationRepo.create({
                    participant1Id: senderId,
                    participant2Id: receiverId,
                    type: type as ConversationType
                });
                await conversationRepo.save(conversation);
            }

            res.status(201).json(conversation);
        } catch (error) {
            console.error("Error starting conversation:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    static async getContacts(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const contacts = await ChatController.fetchContacts(user.id, user.role);
            res.json(contacts);
        } catch (error) {
            console.error("Error getting contacts:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
