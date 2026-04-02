import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Notification } from "../entities/Notification";

export class NotificationController {
    static getAll = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
            const offset = parseInt(req.query.offset as string) || 0;
            const unreadOnly = req.query.unread === "true";

            const repo = AppDataSource.getRepository(Notification);
            const qb = repo
                .createQueryBuilder("n")
                .where("n.userId = :userId", { userId: user.id })
                .orderBy("n.created_at", "DESC")
                .take(limit)
                .skip(offset);

            if (unreadOnly) qb.andWhere("n.read = false");

            const [notifications, total] = await qb.getManyAndCount();

            res.json({ notifications, total, limit, offset });
        } catch (error) {
            console.error("Error fetching notifications:", error);
            res.status(500).json({ message: "Error fetching notifications" });
        }
    };

    static markRead = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { ids } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ message: "ids array is required" });
            }

            const repo = AppDataSource.getRepository(Notification);
            await repo
                .createQueryBuilder()
                .update(Notification)
                .set({ read: true })
                .where("userId = :userId", { userId: user.id })
                .andWhere("id IN (:...ids)", { ids })
                .execute();

            res.json({ message: "Marked as read" });
        } catch (error) {
            console.error("Error marking notifications read:", error);
            res.status(500).json({ message: "Error marking notifications read" });
        }
    };
}
