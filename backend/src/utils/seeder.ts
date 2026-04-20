import { AppDataSource } from "../orm/data-source";
import { User } from "../entities/User";
import { Athlete } from "../entities/Athlete";
import { CoachProfile } from "../entities/Coach";
import { CoachSpecialization } from "../entities/CoachSpecialization";
import { Program } from "../entities/Program";
import { Session } from "../entities/Session";
import { Goal } from "../entities/Goal";
import * as bcrypt from "bcryptjs";

export const seedDatabase = async () => {
    try {
        const userRepo = AppDataSource.getRepository(User);
        const athleteRepo = AppDataSource.getRepository(Athlete);
        const programRepo = AppDataSource.getRepository(Program);
        const sessionRepo = AppDataSource.getRepository(Session);
        const goalRepo = AppDataSource.getRepository(Goal);


        const count = await userRepo.count();
        if (count > 0) {
            console.log("Database already seeded");
            return;
        }

        console.log("Seeding database...");


        const coach = new User();
        coach.first_name = "Alex";
        coach.last_name = "Martin";
        coach.email = "coach@escd.tn";
        coach.password = await bcrypt.hash("password123", 10);
        coach.role = "coach";
        coach.is_verified = true;
        coach.onboarding_completed = true;
        await userRepo.save(coach);

        // --- NEW ADMIN USER ---
        const admin = new User();
        admin.first_name = "System";
        admin.last_name = "Admin";
        admin.email = "admin@gosport.tn";
        admin.password = await bcrypt.hash("adminpassword", 10);
        admin.role = "admin";
        admin.is_verified = true;
        admin.onboarding_completed = true;
        admin.profile_completed = true;
        await userRepo.save(admin);
        // -----------------------



        const coachProfileRepo = AppDataSource.getRepository(CoachProfile);
        const specRepo = AppDataSource.getRepository(CoachSpecialization);

        const coachProfile = new CoachProfile();
        coachProfile.user = coach;
        coachProfile.bio = "Elite performance coach specializing in Padel and Strength training. 10+ years experience.";
        coachProfile.experience_years = 12;
        coachProfile.rating = 4.9;
        coachProfile.verified = true;
        await coachProfileRepo.save(coachProfile);

        const specs = ["PADEL", "MUSCULATION"];
        for (const specName of specs) {
            const spec = new CoachSpecialization();
            spec.coachProfile = coachProfile;
            spec.specialization = specName;
            await specRepo.save(spec);
        }


        const athletesData = [
            { first: "Sarah", last: "Connor", sport: "CrossFit" },
            { first: "Mike", last: "Ross", sport: "Musculation" },
            { first: "Jessica", last: "Pearson", sport: "Pilates" },
            { first: "Harvey", last: "Specter", sport: "Padel" }
        ];

        for (const data of athletesData) {
            const user = new User();
            user.first_name = data.first;
            user.last_name = data.last;
            user.email = `${data.first.toLowerCase()}@example.com`;
            user.password = await bcrypt.hash("password123", 10);
            user.role = "athlete";
            user.is_verified = true;
            await userRepo.save(user);

            const athlete = new Athlete();
            athlete.user = user;
            athlete.sport = data.sport;
            athlete.lastActive = new Date();
            await athleteRepo.save(athlete);


            const program = new Program();
            program.name = `${data.sport} Training`;
            program.athlete = athlete;
            program.coach = coach;
            program.status = "active";
            program.startDate = new Date();
            await programRepo.save(program);


            const session = new Session();
            session.program = program;
            session.athlete = athlete;
            session.date = new Date();
            session.time = "10:00";
            session.type = data.sport;
            session.status = "upcoming";
            await sessionRepo.save(session);
        }

        console.log("Database seeded successfully");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
};
