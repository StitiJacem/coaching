import { AppDataSource } from "../orm/data-source";
import { User } from "../entities/User";
import { Repository } from "typeorm";

export class UserRepository {
    private repository: Repository<User>;

    constructor() {
        this.repository = AppDataSource.getRepository(User);
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.repository.findOneBy({ email });
    }

    async findByUsername(username: string): Promise<User | null> {
        return await this.repository.findOneBy({ username });
    }

    async create(user: User): Promise<User> {
        return await this.repository.save(user);
    }

    async updateVerification(userId: number, isVerified: boolean): Promise<void> {
        await this.repository.update(userId, {
            is_verified: isVerified,
            verification_code: null,
            code_expires_at: null
        });
    }
}
