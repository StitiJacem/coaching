import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { NutritionistProfile } from "./NutritionistProfile";
import { Athlete } from "./Athlete";
import { DietDay } from "./DietDay";

@Entity("diet_plans")
export class DietPlan {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({
        type: "enum",
        enum: ["bulking", "cutting", "maintenance", "performance", "custom"],
        default: "custom"
    })
    goal!: string;

    @Column({ default: false })
    isTemplate!: boolean;

    @Column({ nullable: true })
    nutritionistProfileId?: string;

    @ManyToOne(() => NutritionistProfile, nutritionist => nutritionist.dietPlans, { nullable: true })
    @JoinColumn({ name: "nutritionistProfileId" })
    nutritionistProfile?: NutritionistProfile;

    @Column({ nullable: true })
    athleteId?: number;

    @ManyToOne(() => Athlete, { nullable: true })
    @JoinColumn({ name: "athleteId" })
    athlete?: Athlete;


    @Column({ type: "date", nullable: true })
    startDate?: string;

    @OneToMany(() => DietDay, day => day.dietPlan, { cascade: true })
    days!: DietDay[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
