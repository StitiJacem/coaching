import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("athletes")
export class Athlete {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user!: User;

    @Column({ nullable: true })
    age?: number;

    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    height?: number;

    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    weight?: number;

    @Column({ nullable: true })
    sport?: string;

    @Column({ type: "text", nullable: true })
    goals?: string;

    @Column({ nullable: true })
    profilePicture?: string;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    joinedDate!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastActive!: Date;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
