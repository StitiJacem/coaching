import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Athlete } from "./Athlete";
import { User } from "./User";

@Entity("programs")
export class Program {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column()
    athleteId!: number;

    @ManyToOne(() => Athlete)
    @JoinColumn({ name: "athleteId" })
    athlete!: Athlete;

    @Column()
    coachId!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "coachId" })
    coach!: User;

    @Column({ default: "active" })
    status!: string;

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
