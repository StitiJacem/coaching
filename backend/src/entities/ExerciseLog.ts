import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { WorkoutLog } from "./WorkoutLog";

@Entity("exercise_logs")
export class ExerciseLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    workoutLogId!: number;

    @ManyToOne(() => WorkoutLog, { onDelete: "CASCADE" })
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
    repsPerSet?: number[];

    @Column({ type: "simple-json", nullable: true })
    weightKgPerSet?: number[];

    @Column({ type: "text", nullable: true })
    notes?: string;

    @CreateDateColumn()
    created_at!: Date;
}
