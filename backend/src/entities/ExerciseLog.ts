import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { WorkoutLog } from "./WorkoutLog";

@Entity("exercise_logs")
export class ExerciseLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    workoutLogId!: number;

    @ManyToOne(() => WorkoutLog)
    @JoinColumn({ name: "workoutLogId" })
    workoutLog!: WorkoutLog;

    @Column({ nullable: true })
    programExerciseId?: number;

    @Column()
    exercise_name!: string;

    @Column({ nullable: true })
    exercise_id?: string;

    @Column({ default: 0 })
    setsCompleted!: number;

    @Column({ type: "simple-json", nullable: true })
    repsPerSet?: number[]; // actual reps done per set e.g. [12, 10, 9]

    @Column({ type: "simple-json", nullable: true })
    weightKgPerSet?: number[]; // weight used per set e.g. [60, 65, 65]

    @Column({ type: "text", nullable: true })
    notes?: string;

    @CreateDateColumn()
    created_at!: Date;
}
