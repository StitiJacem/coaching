import "reflect-metadata";
import { AppDataSource } from "./src/orm/data-source";
import { Program } from "./src/entities/Program";
import { ProgramDay } from "./src/entities/ProgramDay";
import { ProgramExercise } from "./src/entities/ProgramExercise";

async function runTest() {
    console.log("Initializing DB...");
    await AppDataSource.initialize();

    console.log("Creating Test Program...");
    const program = new Program();
    program.name = "Test Bulk Save";
    program.type = "Strength";
    program.startDate = new Date();
    program.status = "draft";
    program.isConfigured = false;

    const day = new ProgramDay();
    day.day_number = 1;
    day.title = "Day 1";
    day.program = program;

    const ex1 = new ProgramExercise();
    ex1.exercise_id = "chest_01";
    ex1.exercise_name = "Pushup";
    ex1.sets = 3;
    ex1.reps = 10;
    ex1.order = 0;
    ex1.programDay = day;

    const ex2 = new ProgramExercise();
    ex2.exercise_id = "back_01";
    ex2.exercise_name = "Pullup";
    ex2.sets = 3;
    ex2.reps = 10;
    ex2.order = 1;
    ex2.programDay = day;

    day.exercises = [ex1, ex2];
    program.days = [day];

    const repo = AppDataSource.getRepository(Program);
    const saved = await repo.save(program);

    console.log("Saved Program ID:", saved.id);

    const fetched = await repo.findOne({
        where: { id: saved.id },
        relations: ["days", "days.exercises"]
    });

    console.log("Fetched Days Count:", fetched?.days?.length);
    console.log("Fetched Exercises Count in Day 1:", fetched?.days?.[0]?.exercises?.length);
    console.log(JSON.stringify(fetched?.days?.[0]?.exercises, null, 2));

    await AppDataSource.destroy();
}

runTest().catch(console.error);
