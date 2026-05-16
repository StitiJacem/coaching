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
import { Program } from "../entities/Program";

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
        const roleLower = (role || '').toLowerCase();
        const currentUserId = Number(userId);

        console.log(`[ChatController] Fetching contacts for userId: ${currentUserId}, role: ${roleLower}`);

        if (roleLower === 'coach') {
            const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
            const coachProfile = await coachProfileRepo.findOne({ where: { userId: currentUserId } });
            
            if (coachProfile) {
                const crRepo = AppDataSource.getRepository(CoachingRequest);
                const requests = await crRepo.find({
                    where: { coachProfileId: coachProfile.id, status: 'accepted' },
                    relations: ["athlete", "athlete.user"]
                });
                requests.forEach(r => { if (r.athlete?.user) contacts.push(r.athlete.user); });

                const programRepo = AppDataSource.getRepository(Program);
                const programs = await programRepo.find({
                    where: { coachId: currentUserId },
                    relations: ["athlete", "athlete.user"]
                });
                programs.forEach(p => { if (p.athlete?.user) contacts.push(p.athlete.user); });
            }
        } else if (roleLower === 'nutritionist') {
            const nutriProfileRepo = AppDataSource.getRepository(NutritionistProfile);
            const profile = await nutriProfileRepo.findOne({ where: { userId: currentUserId } });
            
            if (profile) {
                const ncRepo = AppDataSource.getRepository(NutritionConnection);
                const connections = await ncRepo.find({
                    where: { nutritionistProfileId: profile.id, status: 'accepted' },
                    relations: ["athlete", "athlete.user"]
                });
                connections.forEach(nc => { if (nc.athlete?.user) contacts.push(nc.athlete.user); });
            }
        } else if (roleLower === 'athlete') {
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const athlete = await athleteRepo.findOne({ where: { userId: currentUserId } });
            
            if (athlete) {
                // 1. Get Coaches via Coaching Requests
                const crRepo = AppDataSource.getRepository(CoachingRequest);
                const requests = await crRepo.find({
                    where: [
                        { athleteId: athlete.id, status: 'accepted' },
                        { athleteId: athlete.id, initiator: 'coach' } // Include invitations from coaches
                    ],
                    relations: ["coachProfile", "coachProfile.user"]
                });
                
                requests.forEach(r => {
                    if (r.coachProfile?.user) {
                        contacts.push(r.coachProfile.user);
                    }
                });

                // 2. Get Coaches via Programs
                const programRepo = AppDataSource.getRepository(Program);
                const programs = await programRepo.find({
                    where: { athleteId: athlete.id },
                    relations: ["coach", "coachProfile", "coachProfile.user"]
                });
                
                programs.forEach(p => {
                    if (p.coach) contacts.push(p.coach);
                    if (p.coachProfile?.user) contacts.push(p.coachProfile.user);
                });

                // 3. Get Nutritionists via Connections
                const ncRepo = AppDataSource.getRepository(NutritionConnection);
                const nutritionConnections = await ncRepo.find({
                    where: [
                        { athleteId: athlete.id, status: 'accepted' },
                        { athleteId: athlete.id, initiator: 'nutritionist' }
                    ],
                    relations: ["nutritionistProfile", "nutritionistProfile.user"]
                });
                
                nutritionConnections.forEach(nc => {
                    if (nc.nutritionistProfile?.user) {
                        contacts.push(nc.nutritionistProfile.user);
                    }
                });
            }
        }

        console.log(`[ChatController] Found ${contacts.length} raw contacts for user ${currentUserId}`);
        
        // Filter out self, nulls, and ensure uniqueness by ID
        const uniqueContacts = Array.from(
            new Map(
                contacts
                    .filter(c => c && c.id && Number(c.id) !== currentUserId)
                    .map(c => [c.id, c])
            ).values()
        );

        console.log(`[ChatController] Returning ${uniqueContacts.length} unique contacts`);
        return uniqueContacts;
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
            const userId = (req as any).user.id;
            const messageRepo = AppDataSource.getRepository(Message);

            // Mark unread messages as read when opened by the recipient
            await messageRepo.createQueryBuilder()
                .update(Message)
                .set({ isRead: true })
                .where("conversationId = :convId", { convId: conversationId })
                .andWhere("senderId != :userId", { userId })
                .execute();

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
