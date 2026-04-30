import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("notifications")
export class Notification {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: User;

    @Column()
    type!: string;

    @Column({ type: "text" })
    title!: string;

    @Column({ type: "text", nullable: true })
    body?: string;

    @Column({ type: "jsonb", nullable: true })
    payload?: Record<string, unknown>;

    @Column({ default: false })
    read!: boolean;

    @CreateDateColumn()
    created_at!: Date;
}
