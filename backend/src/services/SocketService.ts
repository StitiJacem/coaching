import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../orm/data-source";
import { Message } from "../entities/Message";
import { Conversation } from "../entities/Conversation";
import { ChatController } from "../controllers/ChatController";

export class SocketService {
    private static io: Server;

    public static init(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // Middleware for authentication
        this.io.use((socket, next) => {
            let token = socket.handshake.auth?.token || socket.handshake.query?.token;
            
            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            // Remove Bearer prefix if present
            if (typeof token === 'string' && token.startsWith('Bearer ')) {
                token = token.slice(7);
            }

            try {
                const secret = process.env.JWT_SECRET || 'your-secret-key';
                const decoded = jwt.verify(token as string, secret) as any;
                
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

            // Send initial state
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
                    const messageRepository = AppDataSource.getRepository(Message);
                    const conversationRepository = AppDataSource.getRepository(Conversation);

                    // Save message
                    const newMessage = messageRepository.create({
                        conversationId: data.conversationId,
                        senderId: data.senderId,
                        content: data.content
                    });
                    await messageRepository.save(newMessage);

                    // Update conversation last message
                    await conversationRepository.update(data.conversationId, {
                        lastMessageContent: data.content,
                        lastMessageAt: new Date()
                    });

                    // Emit to room
                    this.io.to(data.conversationId).emit("new_message", newMessage);
                    
                    // Also notify participants to update their conversation list (for last message preview)
                    const conversation = await conversationRepository.findOne({
                        where: { id: data.conversationId }
                    });
                    if (conversation) {
                        this.io.to(`user_${conversation.participant1Id}`).emit("refresh_conversations");
                        this.io.to(`user_${conversation.participant2Id}`).emit("refresh_conversations");
                    }
                } catch (error) {
                    console.error("[Socket] Error sending message:", error);
                }
            });

            // Join personal room for notifications
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
