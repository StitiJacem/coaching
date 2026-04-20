import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { AppDataSource } from "../orm/data-source";
import { Message } from "../entities/Message";
import { Conversation } from "../entities/Conversation";

export class SocketService {
    private static io: Server;

    public static init(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.on("connection", (socket: Socket) => {
            console.log(`[Socket] User connected: ${socket.id}`);

            socket.on("join_room", (room: string) => {
                socket.join(room);
                console.log(`[Socket] User ${socket.id} joined room: ${room}`);
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
                } catch (error) {
                    console.error("[Socket] Error sending message:", error);
                }
            });

            socket.on("disconnect", () => {
                console.log(`[Socket] User disconnected: ${socket.id}`);
            });
        });
    }

    public static getIO() {
        if (!this.io) {
            throw new Error("SocketService not initialized");
        }
        return this.io;
    }
}
