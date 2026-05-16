import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("exercises")
export class Exercise {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ nullable: true })
    target_muscle?: string;

    @Column({ default: 'beginner' })
    difficulty_level!: string; // 'beginner', 'intermediate', 'advanced'

    @Column({ nullable: true })
    gif_url?: string;

    @Column({ nullable: true })
    video_url?: string;

    @Column({ default: false })
    is_custom!: boolean; // False for standard seeded exercises, True for coach-created

    @Column({ nullable: true })
    coachId?: string; // If custom, who created it

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
