import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { DietDay } from "./DietDay";

@Entity("meals")
export class Meal {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    dietDayId!: string;

    @ManyToOne(() => DietDay, dietDay => dietDay.meals, { onDelete: "CASCADE" })
    @JoinColumn({ name: "dietDayId" })
    dietDay!: DietDay;

    @Column({ type: "enum", enum: ["breakfast", "lunch", "dinner", "snack"], default: "snack" })
    mealType!: string;

    @Column()
    timeOfDay!: string;

    @Column({ type: "text" })
    instructions!: string;

    @Column({ type: "int", default: 0 })
    calories!: number;

    @Column({ type: "int", default: 0 })
    protein!: number;

    @Column({ type: "int", default: 0 })
    carbs!: number;

    @Column({ type: "int", default: 0 })
    fats!: number;

    @Column({ type: "int", default: 0 })
    order!: number;
}
