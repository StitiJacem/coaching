import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Athlete } from "./Athlete";

@Entity("goals")
export class Goal {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    athleteId!: number;

    @ManyToOne(() => Athlete)
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @Column()
    name!: string;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    targetValue?: number;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    currentValue?: number;

    @Column({ nullable: true })
    unit?: string;

    @Column({ type: "date", nullable: true })
    deadline?: Date;

    @Column({ default: "active" })
    status!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
