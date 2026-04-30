import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Athlete } from "./Athlete";

@Entity("activity_events")
export class ActivityEvent {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    athleteId!: number;

    @ManyToOne(() => Athlete, { onDelete: "CASCADE" })
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @Column()
    type!: string;

    @Column({ type: "jsonb", nullable: true })
    payload?: Record<string, unknown>;

    @CreateDateColumn()
    created_at!: Date;
}
