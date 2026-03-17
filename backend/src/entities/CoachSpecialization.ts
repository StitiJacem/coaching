import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { CoachProfile } from "./Coach";

@Entity("coach_specializations")
export class CoachSpecialization {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    coachProfileId!: string;

    @ManyToOne(() => CoachProfile, (profile) => profile.specializations, { onDelete: "CASCADE" })
    @JoinColumn({ name: "coachProfileId" })
    coachProfile!: CoachProfile;

    @Column()
    specialization!: string;

    @Column({ default: false })
    is_primary!: boolean;

    @CreateDateColumn()
    created_at!: Date;
}
