import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ nullable: true })
    first_name?: string;

    @Column({ nullable: true })
    last_name?: string;

    @Column({ nullable: true })
    username?: string;

    @Column({ unique: true })
    email!: string;

    @Column({ nullable: true })
    password?: string;

    @Column({ type: "varchar", default: "email" })
    oauth_provider!: string;

    @Column({ type: "varchar", nullable: true })
    oauth_id?: string;

    @Column({ type: "varchar", nullable: true })
    verification_code?: string | null;

    @Column({ default: false })
    is_verified!: boolean;

    @Column({ type: "varchar", default: "athlete" })
    role!: string;

    @Column({ default: false })
    onboarding_completed!: boolean;

    @Column({ default: false })
    profile_completed!: boolean;

    @Column({ type: "timestamp", nullable: true })
    code_expires_at?: Date | null;

    @CreateDateColumn()
    created_at!: Date;

    constructor(data?: Partial<User>) {
        if (data) {
            this.first_name = data.first_name;
            this.last_name = data.last_name;
            this.username = data.username || '';
            this.email = data.email || '';
            this.password = data.password;
            this.oauth_provider = data.oauth_provider || 'email';
            this.oauth_id = data.oauth_id;
            this.is_verified = data.is_verified || false;
            this.role = data.role || 'athlete';
            this.onboarding_completed = data.onboarding_completed || false;
            this.profile_completed = data.profile_completed || false;
            this.verification_code = data.verification_code;
            this.code_expires_at = data.code_expires_at;
            if (data.created_at) this.created_at = data.created_at;
        }
    }
}
