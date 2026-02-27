import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Program } from "./Program";
import { ProgramExercise } from "./ProgramExercise";

@Entity("program_days")
export class ProgramDay {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    programId!: number;

    @ManyToOne(() => Program)
    @JoinColumn({ name: "programId" })
    program!: Program;

    @Column()
    day_number!: number; // 1 to 7 or more

    @Column({ nullable: true })
    title!: string; // e.g., "Leg Day", "Push A"

    @OneToMany(() => ProgramExercise, (programExercise) => programExercise.programDay, { cascade: true })
    exercises!: ProgramExercise[];
}
