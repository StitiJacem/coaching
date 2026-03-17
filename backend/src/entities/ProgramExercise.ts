import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ProgramDay } from "./ProgramDay";

@Entity("program_exercises")
export class ProgramExercise {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    programDayId!: number;

    @ManyToOne(() => ProgramDay, (day) => day.exercises)
    @JoinColumn({ name: "programDayId" })
    programDay!: ProgramDay;

    @Column()
    exercise_id!: string;

    @Column()
    exercise_name!: string;

    @Column({ nullable: true })
    exercise_gif!: string;

    @Column({ default: 3 })
    sets!: number;

    @Column({ default: 12 })
    reps!: number;

    @Column({ type: "float", nullable: true })
    rpe?: number;

    @Column({ nullable: true })
    rest_seconds?: number;

    @Column({ default: 0 })
    order!: number;
}
