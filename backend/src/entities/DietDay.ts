import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { DietPlan } from "./DietPlan";
import { Meal } from "./Meal";

@Entity("diet_days")
export class DietDay {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    dietPlanId!: string;

    @ManyToOne(() => DietPlan, dietPlan => dietPlan.days, { onDelete: "CASCADE" })
    @JoinColumn({ name: "dietPlanId" })
    dietPlan!: DietPlan;

    @Column({ type: "int" })
    day_number!: number; // e.g., Day 1, Day 2

    @Column({ nullable: true })
    title?: string; // e.g., "Leg Day Macros", "Rest Day"

    @Column({ type: "boolean", default: false })
    isRestDay!: boolean; // High/low carb variations on rest days

    @OneToMany(() => Meal, meal => meal.dietDay, { cascade: true })
    meals!: Meal[];
}
