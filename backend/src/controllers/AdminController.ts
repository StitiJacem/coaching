import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { User } from "../entities/User";
import { CoachProfile } from "../entities/Coach";
import { Athlete } from "../entities/Athlete";
import { Program } from "../entities/Program";

export class AdminController {
    static getAllUsers = async (req: Request, res: Response) => {
        try {
            const userRepo = AppDataSource.getRepository(User);
            const { role, search } = req.query;

            const queryBuilder = userRepo.createQueryBuilder("user");

            if (role) {
                queryBuilder.andWhere("user.role = :role", { role });
            }

            if (search) {
                queryBuilder.andWhere(
                    "(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)",
                    { search: `%${search}%` }
                );
            }

            queryBuilder.orderBy("user.created_at", "DESC");

            const users = await queryBuilder.getMany();
            
            // Remove sensitive data
            const sanitizedUsers = users.map(u => {
                const { password, verification_code, ...rest } = u;
                return rest;
            });

            res.json(sanitizedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ message: "Error fetching users" });
        }
    };

    static updateUserRole = async (req: Request, res: Response) => {
        try {
            const { userId, newRole } = req.body;
            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            user.role = newRole;
            await userRepo.save(user);

            res.json({ message: `User role updated to ${newRole}`, user });
        } catch (error) {
            console.error("Error updating user role:", error);
            res.status(500).json({ message: "Error updating user role" });
        }
    };

    static getStats = async (req: Request, res: Response) => {
        try {
            const userRepo = AppDataSource.getRepository(User);
            const coachRepo = AppDataSource.getRepository(CoachProfile);
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const programRepo = AppDataSource.getRepository(Program);

            const totalUsers = await userRepo.count();
            const totalCoaches = await coachRepo.count();
            const totalAthletes = await athleteRepo.count();
            const totalPrograms = await programRepo.count();

            res.json({
                totalUsers,
                totalCoaches,
                totalAthletes,
                totalPrograms,
                activeUsers24h: Math.floor(totalUsers * 0.1) // Placeholder for now
            });
        } catch (error) {
            console.error("Error fetching admin stats:", error);
            res.status(500).json({ message: "Error fetching admin stats" });
        }
    };

    static deleteUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userRepo = AppDataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { id: Number(id) } });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Note: In a real app we'd handle cascading deletes or soft deletes
            await userRepo.remove(user);

            res.json({ message: "User deleted successfully" });
        } catch (error) {
            console.error("Error deleting user:", error);
            res.status(500).json({ message: "Error deleting user" });
        }
    };
}
