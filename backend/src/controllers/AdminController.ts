import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { User } from "../entities/User";
import { CoachProfile } from "../entities/Coach";
import { Athlete } from "../entities/Athlete";
import { Program } from "../entities/Program";
import { Session } from "../entities/Session";
import { WorkoutLog } from "../entities/WorkoutLog";
import { Goal } from "../entities/Goal";
import { DietPlan } from "../entities/DietPlan";
import { CoachingRequest } from "../entities/CoachingRequest";
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

    static getAnalytics = async (req: Request, res: Response) => {
        try {
            const { period, role, status } = req.query;

            const userRepo = AppDataSource.getRepository(User);
            const coachRepo = AppDataSource.getRepository(CoachProfile);
            const athleteRepo = AppDataSource.getRepository(Athlete);
            const programRepo = AppDataSource.getRepository(Program);
            const sessionRepo = AppDataSource.getRepository(Session);
            const workoutLogRepo = AppDataSource.getRepository(WorkoutLog);
            const goalRepo = AppDataSource.getRepository(Goal);
            const dietPlanRepo = AppDataSource.getRepository(DietPlan);
            const coachingRequestRepo = AppDataSource.getRepository(CoachingRequest);

            // Compute time filter date limit
            let dateLimit: Date | null = null;
            if (period === "week") {
                dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - 7);
            } else if (period === "month") {
                dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - 30);
            } else if (period === "year") {
                dateLimit = new Date();
                dateLimit.setFullYear(dateLimit.getFullYear() - 1);
            }

            // Build Where condition for user counts/list
            const userWhere: any = {};
            if (role) {
                userWhere.role = role;
            }
            if (status) {
                userWhere.is_verified = (status === "verified");
            }
            if (dateLimit) {
                userWhere.created_at = MoreThanOrEqual(dateLimit);
            }

            // Cards data
            const totalUsers = await userRepo.count({ where: userWhere });
            
            const coachWhere: any = {};
            if (dateLimit) coachWhere.created_at = MoreThanOrEqual(dateLimit);
            const totalCoaches = await coachRepo.count({ where: coachWhere });

            const athleteWhere: any = {};
            if (dateLimit) athleteWhere.created_at = MoreThanOrEqual(dateLimit);
            const totalAthletes = await athleteRepo.count({ where: athleteWhere });

            const nutritionistWhere: any = { role: "nutritionist" };
            if (status) nutritionistWhere.is_verified = (status === "verified");
            if (dateLimit) nutritionistWhere.created_at = MoreThanOrEqual(dateLimit);
            const totalNutritionists = await userRepo.count({ where: nutritionistWhere });

            // Count new users registered this month (from the 1st of the current month)
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);
            const newUsersThisMonth = await userRepo.count({
                where: { created_at: MoreThanOrEqual(firstDayOfMonth) } as any
            });

            // Activity metrics
            const programWhere: any = {};
            const sessionWhere: any = {};
            const workoutLogWhere: any = {};
            const goalWhere: any = {};
            const dietPlanWhere: any = {};

            if (dateLimit) {
                programWhere.created_at = MoreThanOrEqual(dateLimit);
                sessionWhere.created_at = MoreThanOrEqual(dateLimit);
                workoutLogWhere.created_at = MoreThanOrEqual(dateLimit);
                goalWhere.created_at = MoreThanOrEqual(dateLimit);
                dietPlanWhere.created_at = MoreThanOrEqual(dateLimit);
            }

            const programsCount = await programRepo.count({ where: programWhere });
            const sessionsCount = await sessionRepo.count({ where: sessionWhere });
            
            // For workout logs we count the completed ones
            const completedWorkoutWhere = { ...workoutLogWhere, status: "completed" };
            const completedWorkoutsCount = await workoutLogRepo.count({ where: completedWorkoutWhere });
            
            const goalsCount = await goalRepo.count({ where: goalWhere });
            const dietPlansCount = await dietPlanRepo.count({ where: dietPlanWhere });

            // Monthly Registrations (group in memory for last 6 months)
            const users = await userRepo.find({ select: ["created_at", "role"] });
            const monthsData: { [key: string]: number } = {};
            
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const key = d.toLocaleString("fr-FR", { month: "long", year: "numeric" });
                monthsData[key] = 0;
            }

            users.forEach((u) => {
                if (role && u.role !== role) return;
                const key = new Date(u.created_at).toLocaleString("fr-FR", { month: "long", year: "numeric" });
                if (monthsData[key] !== undefined) {
                    monthsData[key]++;
                }
            });

            const monthlyRegistrations = Object.keys(monthsData).map((month) => ({
                month,
                count: monthsData[month]
            }));

            // Top Coaches details
            const coaches = await coachRepo.find({ relations: ["user"] });
            const topCoaches = await Promise.all(
                coaches.map(async (c) => {
                    const athletesCount = await coachingRequestRepo.count({
                        where: { coachProfileId: c.id, status: "accepted" as any }
                    });
                    const coachProgramsCount = await programRepo.count({
                        where: { coachProfileId: c.id }
                    });
                    return {
                        name: c.user ? `${c.user.first_name || ""} ${c.user.last_name || ""}`.trim() || c.user.username || "Coach" : "Coach",
                        email: c.user ? c.user.email : "N/A",
                        athletesCount,
                        programsCount: coachProgramsCount,
                        rating: Number(c.rating || 0),
                        status: c.verified ? "Vérifié" : "Non vérifié"
                    };
                })
            );

            // Sort top coaches: highest active client count first, then most programs created
            topCoaches.sort((a, b) => b.athletesCount - a.athletesCount || b.programsCount - a.programsCount);

            res.json({
                cards: {
                    totalUsers,
                    totalCoaches,
                    totalAthletes,
                    totalNutritionists,
                    newUsersThisMonth
                },
                activity: {
                    programsCount,
                    sessionsCount,
                    completedWorkoutsCount,
                    goalsCount,
                    dietPlansCount
                },
                monthlyRegistrations,
                topCoaches: topCoaches.slice(0, 5) // top 5
            });
        } catch (error) {
            console.error("Error fetching admin analytics:", error);
            res.status(500).json({ message: "Error fetching admin analytics" });
        }
    };
}
