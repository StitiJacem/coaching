import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Program } from "../entities/Program";
import { Athlete } from "../entities/Athlete";
import { User } from "../entities/User";

export class ProgramController {
    // GET /api/programs - Get all programs (with filters)
    static getAll = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const { coachId, athleteId, status } = req.query;

            const queryBuilder = programRepo.createQueryBuilder("program")
                .leftJoinAndSelect("program.athlete", "athlete")
                .leftJoinAndSelect("athlete.user", "athleteUser")
                .leftJoinAndSelect("program.coach", "coach");

            if (coachId) {
                queryBuilder.where("program.coachId = :coachId", { coachId });
            }
            if (athleteId) {
                queryBuilder.andWhere("program.athleteId = :athleteId", { athleteId });
            }
            if (status) {
                queryBuilder.andWhere("program.status = :status", { status });
            }

            const programs = await queryBuilder.getMany();
            res.json(programs);
        } catch (error) {
            console.error("Error fetching programs:", error);
            res.status(500).json({ message: "Error fetching programs" });
        }
    };

    // GET /api/programs/:id - Get single program
    static getById = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const program = await programRepo.findOne({
                where: { id: parseInt(req.params.id as string) },
                relations: ["athlete", "athlete.user", "coach"]
            });

            if (!program) {
                return res.status(404).json({ message: "Program not found" });
            }

            res.json(program);
        } catch (error) {
            console.error("Error fetching program:", error);
            res.status(500).json({ message: "Error fetching program" });
        }
    };

    // POST /api/programs - Create new program
    static create = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const userRepo = AppDataSource.getRepository(User);

            const { name, description, athleteId, coachId, startDate, endDate, type } = req.body;

            // Validate required fields
            if (!name || !athleteId || !coachId || !startDate) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            // Verify athlete exists
            const athlete = await athleteRepo.findOne({ where: { id: athleteId } });
            if (!athlete) {
                return res.status(404).json({ message: "Athlete not found" });
            }

            // Verify coach exists
            const coach = await userRepo.findOne({ where: { id: coachId, role: "coach" } });
            if (!coach) {
                return res.status(404).json({ message: "Coach not found" });
            }

            const program = new Program();
            program.name = name;
            program.description = description;
            program.athleteId = athleteId;
            program.coachId = coachId;
            program.startDate = new Date(startDate);
            program.endDate = endDate ? new Date(endDate) : undefined;
            program.type = type;
            program.status = "active";

            const savedProgram = await programRepo.save(program);

            // Load relations for response
            const programWithRelations = await programRepo.findOne({
                where: { id: savedProgram.id },
                relations: ["athlete", "athlete.user", "coach"]
            });

            res.status(201).json(programWithRelations);
        } catch (error) {
            console.error("Error creating program:", error);
            res.status(500).json({ message: "Error creating program" });
        }
    };

    // PUT /api/programs/:id - Update program
    static update = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const program = await programRepo.findOne({
                where: { id: parseInt(req.params.id as string) }
            });

            if (!program) {
                return res.status(404).json({ message: "Program not found" });
            }

            const { name, description, status, endDate, type } = req.body;

            if (name) program.name = name;
            if (description !== undefined) program.description = description;
            if (status) program.status = status;
            if (endDate) program.endDate = new Date(endDate);
            if (type) program.type = type;

            const updatedProgram = await programRepo.save(program);

            const programWithRelations = await programRepo.findOne({
                where: { id: updatedProgram.id },
                relations: ["athlete", "athlete.user", "coach"]
            });

            res.json(programWithRelations);
        } catch (error) {
            console.error("Error updating program:", error);
            res.status(500).json({ message: "Error updating program" });
        }
    };

    // DELETE /api/programs/:id - Delete program
    static delete = async (req: Request, res: Response) => {
        try {
            const programRepo = AppDataSource.getRepository(Program);
            const program = await programRepo.findOne({
                where: { id: parseInt(req.params.id as string) }
            });

            if (!program) {
                return res.status(404).json({ message: "Program not found" });
            }

            await programRepo.remove(program);
            res.json({ message: "Program deleted successfully" });
        } catch (error) {
            console.error("Error deleting program:", error);
            res.status(500).json({ message: "Error deleting program" });
        }
    };
}
