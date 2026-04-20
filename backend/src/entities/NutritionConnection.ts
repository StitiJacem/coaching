import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Athlete } from "./Athlete";
import { NutritionistProfile } from "./NutritionistProfile";

export type NutritionConnectionStatus = 'pending' | 'accepted' | 'rejected';

@Entity("nutrition_connections")
export class NutritionConnection {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    athleteId!: number;

    @ManyToOne(() => Athlete, (athlete) => athlete.nutritionConnections)
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @Column()
    nutritionistProfileId!: string;

    @ManyToOne(() => NutritionistProfile)
    @JoinColumn({ name: "nutritionistProfileId" })
    nutritionistProfile!: NutritionistProfile;

    @Column({
        type: "enum",
        enum: ["nutritionist", "athlete"],
        default: "athlete"
    })
    initiator!: 'nutritionist' | 'athlete';

    @Column({
        type: "enum",
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    })
    status!: NutritionConnectionStatus;

    @Column({ type: "text", nullable: true })
    message?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
