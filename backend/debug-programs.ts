import { AppDataSource } from "./src/orm/data-source";
import { Program } from "./src/entities/Program";

async function checkDrafts() {
    const ds = await AppDataSource.setOptions({
        host: 'localhost',
        port: 5433,
        username: 'postgres',
        password: 'root',
        database: 'Coach'
    }).initialize();

    const programRepo = ds.getRepository(Program);
    const programs = await programRepo.find({ relations: ["athlete", "coach"] });

    console.log("Total Programs:", programs.length);
    programs.forEach(p => {
        console.log(`ID: ${p.id}, Name: ${p.name}, Status: ${p.status}, CoachId: ${p.coachId}, AthleteId: ${p.athleteId}`);
    });

    process.exit(0);
}

checkDrafts();
