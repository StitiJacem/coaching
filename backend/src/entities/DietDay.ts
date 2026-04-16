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
    day_number!: number;

    @Column({ nullable: true })
    title?: string;

    @Column({ type: "boolean", default: false })
    isRestDay!: boolean;

    @OneToMany(() => Meal, meal => meal.dietDay, { cascade: true })
    meals!: Meal[];
}
