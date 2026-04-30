import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";
import { CoachSpecialization } from "./CoachSpecialization";
import { CoachCertification } from "./CoachCertification";
import { Program } from "./Program";

@Entity("coach_profiles")
export class CoachProfile {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    userId!: number;

    @OneToOne(() => User, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user!: User;

    @Column({ type: "text", nullable: true })
    bio?: string;

    @Column({ type: "int", default: 0 })
    experience_years!: number;

    @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
    rating!: number;

    @Column({ type: "int", default: 0 })
    total_clients!: number;

    @Column({ default: true })
    verified!: boolean;

    @OneToMany(() => CoachSpecialization, (specialization) => specialization.coachProfile, { cascade: true })
    specializations!: CoachSpecialization[];

    @OneToMany(() => CoachCertification, (certification) => certification.coachProfile, { cascade: true })
    certifications!: CoachCertification[];

    @OneToMany(() => Program, (program) => program.coachProfile)
    programs!: Program[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
