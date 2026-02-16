import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Program } from "./Program";
import { Athlete } from "./Athlete";

@Entity("sessions")
export class Session {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true })
    programId?: number;

    @ManyToOne(() => Program)
    @JoinColumn({ name: "programId" })
    program?: Program;

    @Column()
    athleteId!: number;

    @ManyToOne(() => Athlete)
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @Column({ type: "date" })
    date!: Date;

    @Column({ type: "time" })
    time!: string;

    @Column()
    type!: string;

    @Column({ default: "upcoming" })
    status!: string;

    @Column({ type: "int", nullable: true })
    duration?: number;

    @Column({ type: "text", nullable: true })
    notes?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
