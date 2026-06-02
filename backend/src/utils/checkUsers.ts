import { AppDataSource } from "../orm/data-source";
import { User } from "../entities/User";

async function main() {
    await AppDataSource.initialize();
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find({ order: { id: "ASC" } });
    console.log("DB_USERS:", JSON.stringify(users, null, 2));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
