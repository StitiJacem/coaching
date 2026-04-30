import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Program } from "./Program";
import { ProgramExercise } from "./ProgramExercise";

@Entity("program_days")
export class ProgramDay {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    programId!: number;

    @ManyToOne(() => Program, { onDelete: "CASCADE" })
    @JoinColumn({ name: "programId" })
    program!: Program;

    @Column()
    day_number!: number;

    @Column({ nullable: true })
    title!: string;

    @OneToMany(() => ProgramExercise, (programExercise) => programExercise.programDay, { cascade: true })
    exercises!: ProgramExercise[];
}
