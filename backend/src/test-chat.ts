import { AppDataSource } from "./orm/data-source";
import { ChatController } from "./controllers/ChatController";
import { User } from "./entities/User";
import { Athlete } from "./entities/Athlete";
import { CoachingRequest } from "./entities/CoachingRequest";
import { NutritionConnection } from "./entities/NutritionConnection";

async function main() {
    await AppDataSource.initialize();
    console.log("Connected to DB!");
    
    // Find athlete users
    const users = await AppDataSource.getRepository(User).find({ where: { role: "athlete" } });
    console.log("Found athletes users:", users.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}`, email: u.email })));
    
    for (const u of users) {
        console.log(`\nChecking for user ID ${u.id} (${u.first_name} ${u.last_name}):`);
        const athlete = await AppDataSource.getRepository(Athlete).findOne({ where: { userId: u.id } });
        if (!athlete) {
            console.log("-> No athlete profile found!");
            continue;
        }
        console.log(`-> Athlete profile found: id = ${athlete.id}`);
        
        // Check coaching requests
        const requests = await AppDataSource.getRepository(CoachingRequest).find({
            where: { athleteId: athlete.id },
            relations: ["coachProfile", "coachProfile.user"]
        });
        console.log("-> Coaching requests:", requests.map(r => ({ id: r.id, coach: r.coachProfile?.user?.first_name, status: r.status, initiator: r.initiator })));
        
        // Check nutrition connections
        const connections = await AppDataSource.getRepository(NutritionConnection).find({
            where: { athleteId: athlete.id },
            relations: ["nutritionistProfile", "nutritionistProfile.user"]
        });
        console.log("-> Nutrition connections:", connections.map(c => ({ id: c.id, nutritionist: c.nutritionistProfile?.user?.first_name, status: c.status, initiator: c.initiator })));
        
        // Fetch contacts using ChatController
        const contacts = await ChatController.fetchContacts(u.id, "athlete");
        console.log("-> ChatController.fetchContacts returned:", contacts.map(c => ({ id: c.id, first_name: c.first_name, role: c.role })));
    }
    
    await AppDataSource.destroy();
}

main().catch(console.error);
