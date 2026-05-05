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
            const userId = Number(id);
            const userRepo = AppDataSource.getRepository(User);
            
            // Find the user to know their role and related IDs
            const user = await userRepo.findOne({ where: { id: userId } });
            if (!user) return res.status(404).json({ message: "User not found" });

            // Aggressive manual cleanup for tables that might block deletion
            // 1. Delete notifications
            await AppDataSource.getRepository("Notification").delete({ userId: userId });
            
            // 2. Delete conversations/messages where user is participant
            await AppDataSource.query(`DELETE FROM messages WHERE "senderId" = $1`, [userId]);
            await AppDataSource.query(`DELETE FROM conversations WHERE "participant1Id" = $1 OR "participant2Id" = $1`, [userId]);

            // 3. Handle User-level relationships (e.g., sessions where user is coach)
            await AppDataSource.query(`DELETE FROM sessions WHERE "coachId" = $1`, [userId]);

            // 4. Handle Role-Specific Profiles
            if (user.role === 'athlete') {
                const athlete = await AppDataSource.getRepository("Athlete").findOne({ where: { userId } });
                if (athlete) {
                    // Must delete sessions where athlete is a participant
                    await AppDataSource.query(`DELETE FROM sessions WHERE "athleteId" = $1`, [athlete.id]);
                    
                    await AppDataSource.query(`DELETE FROM exercise_logs WHERE "athleteId" = $1`, [athlete.id]);
                    await AppDataSource.query(`DELETE FROM workout_logs WHERE "athleteId" = $1`, [athlete.id]);
                    await AppDataSource.query(`DELETE FROM programs WHERE "athleteId" = $1`, [athlete.id]);
                    await AppDataSource.query(`DELETE FROM body_metrics WHERE "athleteId" = $1`, [athlete.id]);
                    await AppDataSource.query(`DELETE FROM coaching_requests WHERE "athleteId" = $1`, [athlete.id]);
                    await AppDataSource.query(`DELETE FROM nutrition_connections WHERE "athleteId" = $1`, [athlete.id]);
                    await AppDataSource.getRepository("Athlete").delete({ id: athlete.id });
                }
            } else if (user.role === 'coach' || user.role === 'nutritionist') {
                const profileRepo = AppDataSource.getRepository(user.role === 'coach' ? "CoachProfile" : "NutritionistProfile");
                const profile = await profileRepo.findOne({ where: { userId } } as any) as any;
                if (profile) {
                    if (user.role === 'coach') {
                        await AppDataSource.query(`DELETE FROM coach_specializations WHERE "coachProfileId" = $1`, [profile.id]);
                        await AppDataSource.query(`DELETE FROM coach_certifications WHERE "coachProfileId" = $1`, [profile.id]);
                        await AppDataSource.query(`DELETE FROM programs WHERE "coachProfileId" = $1`, [profile.id]);
                        await AppDataSource.query(`DELETE FROM coaching_requests WHERE "coachProfileId" = $1`, [profile.id]);
                    } else if (user.role === 'nutritionist') {
                        await AppDataSource.query(`DELETE FROM nutrition_connections WHERE "nutritionistProfileId" = $1`, [profile.id]);
                        await AppDataSource.query(`DELETE FROM diet_plans WHERE "nutritionistProfileId" = $1`, [profile.id]);
                    }
                    await profileRepo.delete({ id: profile.id });
                }
            }

            // Finally delete the user
            await userRepo.delete(userId);

            res.json({ message: "User deleted successfully" });
        } catch (error: any) {
            console.error("Error deleting user:", error);
            res.status(500).json({ message: "Error deleting user", error: error.message });
        }
    };
}
