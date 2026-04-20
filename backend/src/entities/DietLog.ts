import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Athlete } from "./Athlete";
import { DietPlan } from "./DietPlan";
import { DietDay } from "./DietDay";

@Entity("diet_logs")
export class DietLog {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    athleteId!: number;

    @ManyToOne(() => Athlete, { onDelete: "CASCADE" })
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    // The entire plan for logging context
    @Column({ nullable: true })
    dietPlanId?: string;

    @ManyToOne(() => DietPlan, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "dietPlanId" })
    dietPlan?: DietPlan;

    // Which day of the plan
    @Column({ nullable: true })
    dietDayId?: string;

    @ManyToOne(() => DietDay, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "dietDayId" })
    dietDay?: DietDay;

    @Column({ type: "date" })
    date!: string; // The specific calendar date of logging

    @Column({ type: "jsonb", default: [] })
    completedMealIds!: string[]; // The IDs of `Meal`s that were successfully checked off

    @Column({ default: 0 })
    totalCaloriesConsumed!: number;

    @Column({ default: 0 })
    totalProteinConsumed!: number;

    @Column({ default: 0 })
    totalCarbsConsumed!: number;

    @Column({ default: 0 })
    totalFatsConsumed!: number;

    @Column({ type: "boolean", default: false })
    isCompleted!: boolean; // Did they completely finish all prescribed meals?

    @Column({ type: "text", nullable: true })
    notes?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
