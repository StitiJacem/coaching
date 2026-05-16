const { AppDataSource } = require("./backend/src/orm/data-source");
const { User } = require("./backend/src/entities/User");
const { CoachProfile } = require("./backend/src/entities/Coach");

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
            console.log(`Coach: ${coach.username} (ID: ${coach.id}), Profile: ${profile ? 'Yes' : 'No'}`);
        }

        await AppDataSource.destroy();
    } catch (err) {
        console.error("Error during Data Source initialization", err);
    }
}

checkCoaches();
