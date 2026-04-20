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
    static async getConversations(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const conversationRepo = AppDataSource.getRepository(Conversation);

            const conversations = await conversationRepo.find({
                where: [
                    { participant1Id: userId },
                    { participant2Id: userId }
                ],
                relations: ["participant1", "participant2"],
                order: { updated_at: "DESC" }
            });

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
            const userId = user.id;
            const role = user.role;
            const contacts: any[] = [];

            if (role === 'coach') {
                const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
                const coachProfile = await coachProfileRepo.findOne({ where: { userId } });
                
                if (coachProfile) {
                    const athleteRepo = AppDataSource.getRepository(Athlete);
                    const athletes = await athleteRepo.createQueryBuilder("athlete")
                        .leftJoinAndSelect("athlete.user", "user")
                        .where(new Brackets((qb: WhereExpressionBuilder) => {
                            qb.where(
                                `EXISTS (SELECT 1 FROM coaching_requests cr WHERE cr."athleteId" = athlete.id AND cr."coachProfileId" = :profileId AND cr.status = 'accepted')`,
                                { profileId: coachProfile.id }
                            );
                            qb.orWhere(
                                `EXISTS (SELECT 1 FROM programs p WHERE p."athleteId" = athlete.id AND p."coachId" = :coachId)`,
                                { coachId: userId }
                            );
                        }))
                        .getMany();

                    athletes.forEach(a => {
                        if (a.user) contacts.push(a.user);
                    });
                }
            } else if (role === 'nutritionist') {
                const nutriProfileRepo = AppDataSource.getRepository(NutritionistProfile);
                const profile = await nutriProfileRepo.findOne({ where: { userId } });
                
                if (profile) {
                    const athleteRepo = AppDataSource.getRepository(Athlete);
                    const athletes = await athleteRepo.createQueryBuilder("athlete")
                        .leftJoinAndSelect("athlete.user", "user")
                        .where(new Brackets((qb: WhereExpressionBuilder) => {
                            qb.where(
                                `EXISTS (SELECT 1 FROM nutrition_connections nc WHERE nc."athleteId" = athlete.id AND nc."nutritionistProfileId" = :nutriId AND nc.status = 'accepted')`,
                                { nutriId: profile.id }
                            );
                            qb.orWhere(
                                `EXISTS (SELECT 1 FROM diet_plans dp WHERE dp."athleteId" = athlete.id AND dp."nutritionistProfileId" = :profileId)`,
                                { profileId: profile.id }
                            );
                        }))
                        .getMany();

                    athletes.forEach(a => {
                        if (a.user) contacts.push(a.user);
                    });
                }
            } else if (role === 'athlete') {
                const athleteRepo = AppDataSource.getRepository(Athlete);
                const athlete = await athleteRepo.findOne({ where: { userId } });
                
                if (athlete) {
                    // Coaches
                    const rqRepo = AppDataSource.getRepository(CoachingRequest);
                    const coachRelations = await rqRepo.find({
                        where: { athleteId: athlete.id, status: 'accepted' },
                        relations: ["coachProfile", "coachProfile.user"]
                    });
                    coachRelations.forEach(r => {
                        if (r.coachProfile?.user) contacts.push(r.coachProfile.user);
                    });

                    // Nutritionists
                    const connRepo = AppDataSource.getRepository(NutritionConnection);
                    const nutriRelations = await connRepo.find({
                        where: { athleteId: athlete.id, status: 'accepted' },
                        relations: ["nutritionistProfile", "nutritionistProfile.user"]
                    });
                    nutriRelations.forEach(r => {
                        if (r.nutritionistProfile?.user) contacts.push(r.nutritionistProfile.user);
                    });
                }
            }

            // Remove duplicates and self if any
            const uniqueContacts = Array.from(new Map(contacts.filter(c => c.id !== userId).map(c => [c.id, c])).values());
            
            res.json(uniqueContacts);
        } catch (error) {
            console.error("Error getting contacts:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
