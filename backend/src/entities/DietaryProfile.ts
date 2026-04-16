import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Athlete } from "./Athlete";

@Entity("dietary_profiles")
export class DietaryProfile {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    athleteId!: number;

    @OneToOne(() => Athlete, athlete => athlete.dietaryProfile, { onDelete: "CASCADE" })
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;


    @Column({ type: "int", nullable: true })
    bmr?: number;

    @Column({ type: "int", nullable: true })
    tdee?: number;


    @Column({ type: "int", nullable: true })
    targetCalories?: number;

    @Column({ type: "int", nullable: true })
    targetProtein?: number;

    @Column({ type: "int", nullable: true })
    targetCarbs?: number;

    @Column({ type: "int", nullable: true })
    targetFats?: number;


    @Column({ type: "jsonb", nullable: true })
    allergies?: string[];

    @Column({ type: "jsonb", nullable: true })
    dietaryPreferences?: string[];

    @Column({ type: "text", nullable: true })
    notes?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
