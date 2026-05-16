import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Athlete } from "./Athlete";
import { CoachProfile } from "./Coach";

@Entity("subscriptions")
export class Subscription {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    athleteId!: number;

    @Column()
    coachProfileId!: string;

    @Column({ nullable: true })
    stripeSubscriptionId?: string;

    @Column()
    status!: string; // e.g., 'active', 'past_due', 'canceled', 'incomplete'

    @Column({ type: 'timestamp', nullable: true })
    currentPeriodEnd?: Date;

    @ManyToOne(() => Athlete, { onDelete: "CASCADE" })
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @ManyToOne(() => CoachProfile, { onDelete: "CASCADE" })
    @JoinColumn({ name: "coachProfileId" })
    coach!: CoachProfile;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
