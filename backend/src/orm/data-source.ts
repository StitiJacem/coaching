import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Athlete } from "../entities/Athlete";
import { Program } from "../entities/Program";
import { Session } from "../entities/Session";
import { Goal } from "../entities/Goal";
import { CoachProfile } from "../entities/Coach";
import { CoachSpecialization } from "../entities/CoachSpecialization";
import { CoachCertification } from "../entities/CoachCertification";
import { ProgramDay } from "../entities/ProgramDay";
import { ProgramExercise } from "../entities/ProgramExercise";
import { WorkoutLog } from "../entities/WorkoutLog";
import { ExerciseLog } from "../entities/ExerciseLog";
import { CoachingRequest } from "../entities/CoachingRequest";
import { UserInvitation } from "../entities/UserInvitation";
import { ActivityEvent } from "../entities/ActivityEvent";
import { Notification } from "../entities/Notification";
import * as dotenv from "dotenv";

dotenv.config();

dotenv.config();

console.log("DB CONFIG: Host =", process.env.DB_HOST, ", User =", process.env.DB_USER, ", DB =", process.env.DB_NAME);

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "coaching_db",
    synchronize: true,
    logging: false,
    entities: [User, Athlete, Program, Session, Goal, CoachProfile, CoachSpecialization, CoachCertification, ProgramDay, ProgramExercise, WorkoutLog, ExerciseLog, CoachingRequest, UserInvitation, ActivityEvent, Notification],
    migrations: [],
    subscribers: [],
});
