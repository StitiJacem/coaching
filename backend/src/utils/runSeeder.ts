import "reflect-metadata";
import { AppDataSource } from "../orm/data-source";
import { seedDatabase } from "./seeder";

async function runSeeder() {
    await AppDataSource.initialize();
    await seedDatabase();
    await AppDataSource.destroy();
}

runSeeder().catch((error) => {
    console.error("Database seeding failed:", error);
    process.exit(1);
});
