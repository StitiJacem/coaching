import { AppDataSource } from "./backend/src/orm/data-source";
import { User } from "./backend/src/entities/User";
import { CoachProfile } from "./backend/src/entities/Coach";

async function checkCoaches() {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        const userRepo = AppDataSource.getRepository(User);
        const coachProfileRepo = AppDataSource.getRepository(CoachProfile);

        const coachesCount = await userRepo.count({ where: { role: 'coach' } });
        console.log(`Total users with role 'coach': ${coachesCount}`);

        const profilesCount = await coachProfileRepo.count();
        console.log(`Total coach profiles: ${profilesCount}`);

        const allCoaches = await userRepo.find({ where: { role: 'coach' } });
        for (const coach of allCoaches) {
            const profile = await coachProfileRepo.findOne({ where: { userId: coach.id } });
            console.log(`Coach: ${coach.username} (ID: ${coach.id}), Profile: ${profile ? 'Yes' : 'No'}, Verified: ${profile?.verified}`);
        }

        await AppDataSource.destroy();
    } catch (err) {
        console.error("Error during Data Source initialization", err);
    }
}

checkCoaches();
