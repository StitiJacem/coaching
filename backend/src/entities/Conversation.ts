import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { Message } from "./Message";

export type ConversationType = 'coach-athlete' | 'nutritionist-athlete';

@Entity("conversations")
export class Conversation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        type: "enum",
        enum: ["coach-athlete", "nutritionist-athlete"],
    })
    type!: ConversationType;

    @Column()
    participant1Id!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "participant1Id" })
    participant1!: User;

    @Column()
    participant2Id!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "participant2Id" })
    participant2!: User;

    @Column({ type: "text", nullable: true })
    lastMessageContent?: string;

    @Column({ type: "timestamp", nullable: true })
    lastMessageAt?: Date;

    @OneToMany(() => Message, (message) => message.conversation)
    messages!: Message[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
