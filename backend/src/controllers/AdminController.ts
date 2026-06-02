import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { User } from "../entities/User";
import { CoachProfile } from "../entities/Coach";
import { Athlete } from "../entities/Athlete";
import { Program } from "../entities/Program";
import { sanitizeUser } from "../utils/sanitizeUser";
import { MoreThanOrEqual } from "typeorm";

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
            const sanitizedUsers = users.map(u => sanitizeUser(u));

            res.json(sanitizedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ message: "Error fetching users" });
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

            const nutritionistCount = await userRepo.count({ where: { role: 'nutritionist' } as any });
            const adminCount = await userRepo.count({ where: { role: 'admin' } as any });
            const verifiedCount = await userRepo.count({ where: { is_verified: true } as any });

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentUsers = await userRepo.count({ where: { created_at: MoreThanOrEqual(thirtyDaysAgo) } as any });

            res.json({
                totalUsers,
                totalCoaches,
                totalAthletes,
                totalPrograms,
                nutritionistCount,
                adminCount,
                verifiedCount,
                recentUsers
            });
        } catch (error) {
            console.error("Error fetching admin stats:", error);
            res.status(500).json({ message: "Error fetching admin stats" });
        }
    };

    static getRecentUsers = async (req: Request, res: Response) => {
        try {
            const userRepo = AppDataSource.getRepository(User);
            const users = await userRepo.find({
                order: { created_at: "DESC" },
                take: 5
            });
            res.json(users.map(u => sanitizeUser(u)));
        } catch (error) {
            console.error("Error fetching recent users:", error);
            res.status(500).json({ message: "Error fetching recent users" });
        }
    };

    static deleteUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userId = Number(id);
            const userRepo = AppDataSource.getRepository(User);
            
            const user = await userRepo.findOne({ where: { id: userId } });
            if (!user) return res.status(404).json({ message: "User not found" });

            // Helper to safely run raw SQL queries (some columns may not exist in DB schema)
            const safeQuery = async (sql: string, params: any[]) => {
                try { await AppDataSource.query(sql, params); }
                catch (e: any) { console.warn(`Cleanup skipped for: ${sql.split(' ')[2]} — ${e.message}`); }
            };

            // 1. Delete notifications
            await AppDataSource.getRepository("Notification").delete({ userId: userId });

            // 2. Delete messages/conversations
            await safeQuery(`DELETE FROM messages WHERE "senderId" = $1`, [userId]);
            await safeQuery(`DELETE FROM conversations WHERE "participant1Id" = $1 OR "participant2Id" = $1`, [userId]);

            // 3. Sessions where user is directly referenced as coach
            await safeQuery(`DELETE FROM sessions WHERE "coachId" = $1`, [userId]);

            // 4. Try to find and clean up ANY profile (athlete, coach, nutritionist) regardless of current role
            //    This handles users whose role was changed but profile records still exist.

            // Athlete profile
            const athlete = await AppDataSource.getRepository("Athlete").findOne({ where: { userId } });
            if (athlete) {
                await safeQuery(`DELETE FROM sessions WHERE "athleteId" = $1`, [athlete.id]);
                await safeQuery(`DELETE FROM exercise_logs WHERE "athleteId" = $1`, [athlete.id]);
                await safeQuery(`DELETE FROM workout_logs WHERE "athleteId" = $1`, [athlete.id]);
                await safeQuery(`DELETE FROM programs WHERE "athleteId" = $1`, [athlete.id]);
                await safeQuery(`DELETE FROM body_metrics WHERE "athleteId" = $1`, [athlete.id]);
                await safeQuery(`DELETE FROM coaching_requests WHERE "athleteId" = $1`, [athlete.id]);
                await safeQuery(`DELETE FROM nutrition_connections WHERE "athleteId" = $1`, [athlete.id]);
                await safeQuery(`DELETE FROM goals WHERE "athleteId" = $1`, [athlete.id]);
                await safeQuery(`DELETE FROM dietary_profiles WHERE "athleteId" = $1`, [athlete.id]);
                await safeQuery(`DELETE FROM meal_logs WHERE "athleteId" = $1`, [athlete.id]);
                await safeQuery(`DELETE FROM activity_events WHERE "athleteId" = $1`, [athlete.id]);
                await AppDataSource.getRepository("Athlete").delete({ id: athlete.id });
            }

            // Coach profile
            const coachProfile = await AppDataSource.getRepository("CoachProfile").findOne({ where: { userId } });
            if (coachProfile) {
                await safeQuery(`DELETE FROM coach_specializations WHERE "coachProfileId" = $1`, [coachProfile.id]);
                await safeQuery(`DELETE FROM coach_certifications WHERE "coachProfileId" = $1`, [coachProfile.id]);
                await safeQuery(`DELETE FROM programs WHERE "coachProfileId" = $1`, [coachProfile.id]);
                await safeQuery(`DELETE FROM coaching_requests WHERE "coachProfileId" = $1`, [coachProfile.id]);
                await AppDataSource.getRepository("CoachProfile").delete({ id: coachProfile.id });
            }

            // Nutritionist profile
            const nutritionistProfile = await AppDataSource.getRepository("NutritionistProfile").findOne({ where: { userId } });
            if (nutritionistProfile) {
                await safeQuery(`DELETE FROM nutrition_connections WHERE "nutritionistProfileId" = $1`, [nutritionistProfile.id]);
                await safeQuery(`DELETE FROM diet_plans WHERE "nutritionistProfileId" = $1`, [nutritionistProfile.id]);
                await AppDataSource.getRepository("NutritionistProfile").delete({ id: nutritionistProfile.id });
            }

            // 5. User invitations
            await safeQuery(`DELETE FROM user_invitations WHERE "coachId" = $1`, [userId]);

            // Finally delete the user
            await userRepo.delete(userId);

            res.json({ message: "User deleted successfully" });
        } catch (error: any) {
            console.error("Error deleting user:", error);
            res.status(500).json({ message: "Error deleting user", error: error.message });
        }
    };
}
