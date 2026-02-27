import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { CoachProfile } from "./CoachProfile";

@Entity("coach_certifications")
export class CoachCertification {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    coachProfileId!: string;

    @ManyToOne(() => CoachProfile, (profile) => profile.certifications, { onDelete: "CASCADE" })
    @JoinColumn({ name: "coachProfileId" })
    coachProfile!: CoachProfile;

    @Column()
    name!: string;

    @Column({ nullable: true })
    issuer?: string;

    @Column({ type: "date", nullable: true })
    date_obtained?: Date;

    @Column({ nullable: true })
    document_url?: string;

    @Column({ default: false })
    verified!: boolean;

    @CreateDateColumn()
    created_at!: Date;
}
