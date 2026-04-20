import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Athlete } from "./Athlete";

@Entity("meal_logs")
export class MealLog {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    athleteId!: number;

    @ManyToOne(() => Athlete, { onDelete: "CASCADE" })
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @Column()
    foodName!: string;

    @Column("float", { default: 0 })
    calories!: number;

    @Column("float", { default: 0 })
    protein!: number;

    @Column("float", { default: 0 })
    carbs!: number;

    @Column("float", { default: 0 })
    fats!: number;

    @Column({ nullable: true })
    mealType?: string; // breakfast, lunch, dinner, snack

    @Column({ type: "text", nullable: true })
    imagePath?: string;

    @CreateDateColumn()
    loggedAt!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
