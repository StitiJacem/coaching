import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Athlete } from "./Athlete";
import { Program } from "./Program";
import { ProgramDay } from "./ProgramDay";

@Entity("workout_logs")
export class WorkoutLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    athleteId!: number;

    @ManyToOne(() => Athlete)
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @Column({ nullable: true })
    programId?: number;

    @ManyToOne(() => Program)
    @JoinColumn({ name: "programId" })
    program?: Program;

    @Column({ nullable: true })
    programDayId?: number;

    @ManyToOne(() => ProgramDay)
    @JoinColumn({ name: "programDayId" })
    programDay?: ProgramDay;

    @Column({ type: "date" })
    scheduledDate!: Date;

    @Column({ type: "timestamp", nullable: true })
    completedAt?: Date;

    @Column({ default: "scheduled" }) // scheduled | in_progress | completed | missed
    status!: string;

    @Column({ type: "int", nullable: true })
    durationMinutes?: number;

    @Column({ type: "text", nullable: true })
    notes?: string;

    @Column({ type: "int", nullable: true }) // 1-5 rating
    overallRating?: number;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
