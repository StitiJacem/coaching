import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Athlete } from "./Athlete";
import { Program } from "./Program";
import { User } from "./User";
import { ProgramDay } from "./ProgramDay";

@Entity("sessions")
export class Session {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true })
    athleteId?: number;

    @ManyToOne(() => Athlete)
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @ManyToOne(() => Program, { nullable: true })
    @JoinColumn({ name: "programId" })
    program?: Program;

    @Column({ nullable: true })
    programId?: number;

    @Column({ nullable: true })
    programDayId?: number;

    @ManyToOne(() => ProgramDay, { nullable: true })
    @JoinColumn({ name: "programDayId" })
    programDay?: ProgramDay;

    @Column({ nullable: true })
    coachId?: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "coachId" })
    coach!: User;

    @Column({ type: "timestamp", nullable: true })
    date?: Date;

    @Column({ default: "12:00" })
    time!: string;

    @Column({ nullable: true })
    type?: string;

    @Column({ nullable: true })
    title?: string;

    @Column({ default: "upcoming" })
    status!: string;

    @Column({ type: "jsonb", nullable: true })
    workoutData?: any;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
