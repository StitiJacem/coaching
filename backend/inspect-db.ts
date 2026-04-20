import "reflect-metadata";
import { DataSource } from "typeorm";
import { Session } from "./src/entities/Session";
import { Athlete } from "./src/entities/Athlete";
import { Program } from "./src/entities/Program";

const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "root",
    database: "Coach",
    synchronize: false,
    entities: [Session, Athlete, Program]
});

async function run() {
    await AppDataSource.initialize();
    console.log("Connected to DB.");

    const repo = AppDataSource.getRepository(Session);
    const sessions = await repo.find({
        order: { id: "DESC" },
        take: 3
    });

    for (const s of sessions) {
        console.log(`Session ${s.id}: ${s.title}`);
        console.log("Workout Data Exercises:");
        if (s.workoutData && s.workoutData.exercises) {
            console.log(`Length: ${s.workoutData.exercises.length}`);
            s.workoutData.exercises.forEach((ex: any, i: number) => {
                console.log(`  [${i}] ${ex.name || ex.exercise_name} (ID: ${ex.id || ex.exercise_id})`);
            });
        } else {
            console.log("  None");
        }
        console.log("----------------------");
    }

    await AppDataSource.destroy();
}

run().catch(console.error);
