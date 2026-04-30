import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";
import { DietPlan } from "./DietPlan";

@Entity("nutritionist_profiles")
export class NutritionistProfile {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    userId!: number;

    @OneToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: User;

    @Column({ type: "text", nullable: true })
    bio?: string;

    @Column({ nullable: true })
    profilePicture?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    location?: string;

    @Column({ type: "int", default: 0 })
    experience_years!: number;

    @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
    rating!: number;

    @Column({ type: "int", default: 0 })
    total_clients!: number;

    @Column({ default: true })
    verified!: boolean;

    @Column({ type: "simple-array", nullable: true })
    specializations?: string[];

    @Column({ type: "simple-array", nullable: true })
    offerTypes?: string[];

    @OneToMany(() => DietPlan, (dietPlan) => dietPlan.nutritionistProfile)
    dietPlans!: DietPlan[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
