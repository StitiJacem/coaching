import { AppDataSource } from "./orm/data-source";
import { User } from "./entities/User";
import * as bcrypt from "bcryptjs";

async function main() {
    await AppDataSource.initialize();
    console.log("Connected to DB!");
    
    const hashedPassword = await bcrypt.hash("password123", 10);
    await AppDataSource.getRepository(User).update({ email: "mahdiayadi@gmail.com" }, { password: hashedPassword });
    console.log("Password for mahdiayadi@gmail.com updated to password123 successfully!");
    
    await AppDataSource.destroy();
}

main().catch(console.error);
