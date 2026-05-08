import { Request, Response } from "express";
import { ExerciseService } from "../services/ExerciseService";
import fs from 'fs';
import path from 'path';
import axios from 'axios';

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

    static getById = async (req: Request, res: Response) => {
        try {
            const exercise = await exerciseService.getById(req.params.id as string);
            if (!exercise) return res.status(404).json({ message: "Exercise not found" });
            res.json(exercise);
        } catch (error) {
            res.status(500).json({ message: "Error fetching exercise" });
        }
    };
    
    static getGif = async (req: Request, res: Response) => {
        try {
            const id = req.params.id as string;
            if (!id) return res.status(400).json({ message: "GIF ID is required" });

            const path = require('path');
            const axios = require('axios');
            
            const cacheDir = path.join(__dirname, '../../public/gifs');
            const filePath = path.join(cacheDir, `${id}.gif`);

            // Check if we already downloaded it
            if (fs.existsSync(filePath)) {
                res.setHeader('Content-Type', 'image/gif');
                return res.sendFile(filePath);
            }

            // Otherwise, fetch from WorkoutX, save to disk, and stream to client
            const workoutXKey = process.env.WORKOUTX_API_KEY || 'wx_628a805f4e4ff753270efd2f64a2d4a2e95930ed71af37543868bdad';
            
            const response = await axios({
                url: `https://api.workoutxapp.com/v1/gifs/${id}.gif`,
                method: 'GET',
                responseType: 'stream',
                headers: { 'X-WorkoutX-Key': workoutXKey }
            });

            // Ensure directory exists
            if (!fs.existsSync(cacheDir)){
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            // Pipe to file
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            // Also pipe to client
            res.setHeader('Content-Type', 'image/gif');
            response.data.pipe(res);

        } catch (error) {
            console.error("Error fetching GIF:", error);
            res.status(500).json({ message: "Error fetching GIF" });
        }
    };
}
