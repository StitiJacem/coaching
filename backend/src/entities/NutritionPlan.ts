import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { NutritionPlanDay } from "./NutritionPlanDay";

@Entity("nutrition_plans")
export class NutritionPlan {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    athleteId!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "athleteId" })
    athlete!: User;

    @Column()
    nutritionistId!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "nutritionistId" })
    nutritionist!: User;

    @Column()
    name!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ type: "date" })
    startDate!: Date;

    @Column({ type: "date", nullable: true })
    endDate?: Date;

    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => NutritionPlanDay, (day) => day.nutritionPlan, { cascade: true })
    days!: NutritionPlanDay[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
