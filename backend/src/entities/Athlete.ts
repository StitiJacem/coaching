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
    primaryObjective?: string;

    @Column({ nullable: true })
    targetMetric?: string;

    @Column({ type: "date", nullable: true })
    deadline?: Date;

    @Column({ nullable: true })
    timePerSession?: string;

    @Column({ type: "text", nullable: true })
    injuries?: string;

    @Column({ nullable: true })
    experienceLevel?: string;

    @Column({ nullable: true })
    equipment?: string;

    @Column({ nullable: true })
    profilePicture?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    nationality?: string;

    @Column({ type: "date", nullable: true })
    dateOfBirth?: Date;

    @Column({ nullable: true })
    fitnessLevel?: string;

    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    weightGoal?: number;

    @Column({ type: "text", nullable: true })
    notes?: string;

    @Column({ type: "jsonb", nullable: true })
    preferredTrainingDays?: number[];

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    joinedDate!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastActive!: Date;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
