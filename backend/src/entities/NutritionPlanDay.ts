import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { NutritionPlan } from "./NutritionPlan";

@Entity("nutrition_plan_days")
export class NutritionPlanDay {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    nutritionPlanId!: string;

    @ManyToOne(() => NutritionPlan, (plan) => plan.days)
    @JoinColumn({ name: "nutritionPlanId" })
    nutritionPlan!: NutritionPlan;

    @Column()
    dayName!: string; // e.g., "Monday" or "Day 1"

    @Column({ type: "int" })
    caloriesTarget!: number;

    @Column({ type: "int" })
    proteinTarget!: number;

    @Column({ type: "int" })
    carbsTarget!: number;

    @Column({ type: "int" })
    fatTarget!: number;

    @Column({ type: "text", nullable: true })
    notes?: string;
}
