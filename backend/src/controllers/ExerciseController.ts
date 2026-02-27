import { Request, Response } from "express";
import { ExerciseService } from "../services/ExerciseService";

const exerciseService = new ExerciseService();

export class ExerciseController {
    static getAll = async (req: Request, res: Response) => {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const exercises = await exerciseService.getAllExercises(limit);
            res.json(exercises);
        } catch (error) {
            console.error("Error fetching exercises:", error);
            res.status(500).json({ message: "Error fetching exercises" });
        }
    };

    static search = async (req: Request, res: Response) => {
        try {
            const name = req.query.name as string;
            if (!name) {
                return res.status(400).json({ message: "Search name is required" });
            }
            const exercises = await exerciseService.searchExercises(name);
            res.json(exercises);
        } catch (error) {
            console.error("Error searching exercises:", error);
            res.status(500).json({ message: "Error searching exercises" });
        }
    };

    static getByBodyPart = async (req: Request, res: Response) => {
        try {
            const bodyPart = req.params.bodyPart as string;
            const exercises = await exerciseService.getByBodyPart(bodyPart);
            res.json(exercises);
        } catch (error) {
            console.error("Error fetching exercises by body part:", error);
            res.status(500).json({ message: "Error fetching body part" });
        }
    };
}
