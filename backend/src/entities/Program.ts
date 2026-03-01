import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Athlete } from "./Athlete";
import { User } from "./User";
import { CoachProfile } from "./Coach";
import { ProgramDay } from "./ProgramDay";

@Entity("programs")
export class Program {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ nullable: true })
    athleteId?: number;

    @ManyToOne(() => Athlete, { nullable: true })
    @JoinColumn({ name: "athleteId" })
    athlete?: Athlete;

    @Column({ nullable: true })
    coachId!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "coachId" })
    coach!: User;

    @Column({ nullable: true })
    coachProfileId?: string;

    @ManyToOne(() => CoachProfile, (profile) => profile.programs)
    @JoinColumn({ name: "coachProfileId" })
    coachProfile?: CoachProfile;

    @Column({ default: false })
    is_template!: boolean;

    @Column({ nullable: true })
    specialization?: string;

    @Column({ default: "active" })
    status!: string;

    @Column({ default: false })
    isConfigured!: boolean;

    @Column({ type: "jsonb", nullable: true })
    scheduleConfig?: any;

    @OneToMany(() => ProgramDay, (day) => day.program, { cascade: true })
    days!: ProgramDay[];

    @Column({ type: "date" })
    startDate!: Date;

    @Column({ type: "date", nullable: true })
    endDate?: Date;

    @Column({ nullable: true })
    type?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
