import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Athlete } from "./Athlete";

@Entity("body_metrics")
export class BodyMetric {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    athleteId!: number;

    @ManyToOne(() => Athlete, { onDelete: "CASCADE" })
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @Column({ type: "date" })
    date!: Date;

    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    weight?: number;

    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    bodyFat?: number;

    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    vo2max?: number;

    @Column({ type: "text", nullable: true })
    notes?: string;

    @CreateDateColumn()
    created_at!: Date;
}
