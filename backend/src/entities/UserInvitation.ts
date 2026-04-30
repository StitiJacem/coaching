import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("user_invitations")
export class UserInvitation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    email!: string;

    @Column()
    coachId!: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "coachId" })
    coach!: User;

    @Column({ type: "text", nullable: true })
    message?: string;

    @Column({ type: "varchar", default: "pending" })
    status!: "pending" | "accepted" | "expired";

    @Column({ type: "varchar", nullable: true })
    token?: string;

    @Column({ type: "timestamp", nullable: true })
    expiresAt?: Date;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
