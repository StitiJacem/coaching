import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Athlete } from "./Athlete";
import { CoachProfile } from "./Coach";

export type CoachingRequestStatus = 'pending' | 'accepted' | 'rejected';

@Entity("coaching_requests")
export class CoachingRequest {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    athleteId!: number;

    @ManyToOne(() => Athlete, { onDelete: "CASCADE" })
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @Column()
    coachProfileId!: string;

    @ManyToOne(() => CoachProfile, { onDelete: "CASCADE" })
    @JoinColumn({ name: "coachProfileId" })
    coachProfile!: CoachProfile;

    @Column({
        type: "enum",
        enum: ["coach", "athlete"],
        default: "athlete"
    })
    initiator!: 'coach' | 'athlete';

    @Column({
        type: "enum",
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    })
    status!: CoachingRequestStatus;

    @Column({ type: "text", nullable: true })
    message?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
