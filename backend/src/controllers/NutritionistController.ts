import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { NutritionistProfile } from "../entities/NutritionistProfile";
import { NutritionConnection, NutritionConnectionStatus } from "../entities/NutritionConnection";
import { Athlete } from "../entities/Athlete";

export class NutritionistController {
    private nutritionistRepo = AppDataSource.getRepository(NutritionistProfile);
    private connectionRepo = AppDataSource.getRepository(NutritionConnection);
    private athleteRepo = AppDataSource.getRepository(Athlete);


    async getAll(req: Request, res: Response) {
        try {
            const nutritionists = await this.nutritionistRepo.find({
                relations: ["user"]
            });
            return res.json(nutritionists);
        } catch (error) {
            console.error("Error fetching nutritionists", error);
            res.status(500).json({ message: "Server error" });
        }
    }


    async sendConnectionRequest(req: Request, res: Response) {
        try {
            const nutritionistProfileId = String(req.body.nutritionistProfileId);
            const message = String(req.body.message || "");
            

            const userId = (req as any).user.id;
            const athlete = await this.athleteRepo.findOne({ where: { userId } });
            
            if (!athlete) return res.status(404).json({ message: "Athlete not found" });
            const athleteId = athlete.id;


            const existing = await this.connectionRepo.findOne({
                where: { athleteId, nutritionistProfileId }
            });

            if (existing) {
                return res.status(400).json({ message: "Request already exists." });
            }

            const request = this.connectionRepo.create({
                athleteId,
                nutritionistProfileId,
                message,
                initiator: "athlete",
                status: "pending"
            });

            await this.connectionRepo.save(request);
            res.status(201).json(request);
        } catch (error) {
            console.error("Error sending nutritionist connection request", error);
            res.status(500).json({ message: "Server error" });
        }
    }


    async getMyRequests(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const profile = await this.nutritionistRepo.findOne({ where: { userId } });
            if (!profile) return res.status(404).json({ message: "Profile not found" });

            const requests = await this.connectionRepo.find({
                where: { nutritionistProfileId: profile.id, status: "pending" },
                relations: ["athlete", "athlete.user"]
            });

            res.json(requests);
        } catch (error) {
            console.error("Error fetching nutritionist requests", error);
            res.status(500).json({ message: "Server error" });
        }
    }


    async getClients(req: Request, res: Response) {
        try {
            const nutritionistProfileId = String(req.params.id);
            
            const connections = await this.connectionRepo.find({
                where: { nutritionistProfileId, status: "accepted" },
                relations: ["athlete", "athlete.user", "athlete.dietaryProfile"]
            });
 

            const clients = connections.map(conn => ({
                connectionId: conn.id,
                status: conn.status,
                athlete: conn.athlete
            }));
 
            res.json(clients);
        } catch (error) {
            console.error("Error getting nutritionist clients", error);
            res.status(500).json({ message: "Server error" });
        }
    }
 

    async respondToRequest(req: Request, res: Response) {
        try {
            const connectionId = String(req.params.connectionId);
            const { status } = req.body;
 
            const connection = await this.connectionRepo.findOne({ where: { id: connectionId } });
            if (!connection) return res.status(404).json({ message: "Request not found" });
 
            connection.status = status as NutritionConnectionStatus;
            await this.connectionRepo.save(connection);
 
            res.json(connection);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    }
 

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = Number(req.params.userId);
            const updateData = req.body;
 
            let profile = await this.nutritionistRepo.findOne({ where: { userId } });
            if (!profile) {
                const newProfile = this.nutritionistRepo.create({ userId });
                this.nutritionistRepo.merge(newProfile, updateData);
                profile = await this.nutritionistRepo.save(newProfile);
            } else {
                this.nutritionistRepo.merge(profile, updateData);
                profile = await this.nutritionistRepo.save(profile);
            }
 
            res.json(profile);
        } catch (error) {
            console.error("Update profile error", error);
            res.status(500).json({ message: "Server error" });
        }
    }
}
