import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Conversation } from "./Conversation";
import { User } from "./User";

@Entity("messages")
export class Message {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    conversationId!: string;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages)
    @JoinColumn({ name: "conversationId" })
    conversation!: Conversation;

    @Column()
    senderId!: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "senderId" })
    sender!: User;

    @Column({ type: "text" })
    content!: string;

    @Column({ default: false })
    isRead!: boolean;

    @CreateDateColumn()
    created_at!: Date;
}
