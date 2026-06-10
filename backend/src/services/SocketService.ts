import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/jwt.config";
import { AppDataSource } from "../orm/data-source";
import { Message } from "../entities/Message";
import { Conversation } from "../entities/Conversation";
import { ChatController } from "../controllers/ChatController";

export class SocketService {
    private static io: Server;

    public static init(server: HttpServer) {
        this.io = new Server(server, {
            path: "/api/socket.io",
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:4200',
                methods: ["GET", "POST"]
            }
        });

        this.io.use((socket, next) => {
            let token = socket.handshake.auth?.token || socket.handshake.query?.token;
            
            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            if (typeof token === 'string' && token.startsWith('Bearer ')) {
                token = token.slice(7);
            }

            try {
                const decoded = jwt.verify(token as string, getJwtSecret()) as any;
                
                socket.data.userId = decoded.id;
                socket.data.role = decoded.role;
                next();
            } catch (err) {
                return next(new Error("Authentication error: Invalid token"));
            }
        });

        this.io.on("connection", async (socket: Socket) => {
            const userId = socket.data.userId;
            const role = socket.data.role;
            
            console.log(`[Socket] User ${userId} (${role}) connected: ${socket.id}`);

            await this.sendInitialState(socket);

            socket.on("join_room", (room: string) => {
                socket.join(room);
                console.log(`[Socket] User ${userId} joined room: ${room}`);
            });

            socket.on("get_contacts", async () => {
                const contacts = await ChatController.fetchContacts(userId, role);
                socket.emit("contacts_update", contacts);
            });

            socket.on("get_conversations", async () => {
                const conversations = await ChatController.fetchConversations(userId);
                socket.emit("conversations_update", conversations);
            });

            socket.on("send_message", async (data: { conversationId: string; senderId: number; content: string }) => {
                try {
                    if (Number(data.senderId) !== Number(userId)) {
                        console.warn(`[Socket] User ${userId} attempted to spoof senderId ${data.senderId}`);
                        return;
                    }
                    const conversationRepository = AppDataSource.getRepository(Conversation);
                    const conversation = await conversationRepository.findOne({
                        where: { id: data.conversationId }
                    });
                    if (!conversation) return;
                    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
                        console.warn(`[Socket] User ${userId} attempted to send message to unauthorized conversation ${data.conversationId}`);
                        return;
                    }

                    const messageRepository = AppDataSource.getRepository(Message);

                    const newMessage = messageRepository.create({
                        conversationId: data.conversationId,
                        senderId: data.senderId,
                        content: data.content
                    });
                    await messageRepository.save(newMessage);

                    await conversationRepository.update(data.conversationId, {
                        lastMessageContent: data.content,
                        lastMessageAt: new Date()
                    });
                    this.io.to(data.conversationId).emit("new_message", newMessage);
                    this.io.to(`user_${conversation.participant1Id}`).emit("refresh_conversations");
                    this.io.to(`user_${conversation.participant2Id}`).emit("refresh_conversations");
                } catch (error) {
                    console.error("[Socket] Error sending message:", error);
                }
            });

            socket.on("mark_read", async (data: { conversationId: string }) => {
                try {
                    const conversationRepository = AppDataSource.getRepository(Conversation);
                    const conversation = await conversationRepository.findOne({
                        where: { id: data.conversationId }
                    });
                    if (!conversation) return;
                    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
                        console.warn(`[Socket] User ${userId} attempted to mark_read on unauthorized conversation ${data.conversationId}`);
                        return;
                    }

                    const messageRepository = AppDataSource.getRepository(Message);
                    await messageRepository.createQueryBuilder()
                        .update(Message)
                        .set({ isRead: true })
                        .where("conversationId = :convId", { convId: data.conversationId })
                        .andWhere("senderId != :userId", { userId })
                        .execute();

                    this.io.to(data.conversationId).emit("messages_read", { 
                        conversationId: data.conversationId, 
                        readBy: userId 
                    });
                } catch (error) {
                    console.error("[Socket] Error marking messages as read:", error);
                }
            });

            socket.join(`user_${userId}`);

            socket.on("disconnect", () => {
                console.log(`[Socket] User ${userId} disconnected: ${socket.id}`);
            });
        });
    }

    private static async sendInitialState(socket: Socket) {
        try {
            const userId = socket.data.userId;
            const role = socket.data.role;

            const [contacts, conversations] = await Promise.all([
                ChatController.fetchContacts(userId, role),
                ChatController.fetchConversations(userId)
            ]);

            socket.emit("contacts_update", contacts);
            socket.emit("conversations_update", conversations);
        } catch (error) {
            console.error("[Socket] Error sending initial state:", error);
        }
    }

    public static getIO() {
        if (!this.io) {
            throw new Error("SocketService not initialized");
        }
        return this.io;
    }
}
