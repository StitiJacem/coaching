import { Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { User } from "../entities/User";
import * as bcrypt from "bcryptjs";

export class UserController {
    static updateProfile = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const userRepo = AppDataSource.getRepository(User);
            const currentUser = await userRepo.findOne({ where: { id: user.id } });

            if (!currentUser) {
                return res.status(404).json({ message: "User not found" });
            }

            const { first_name, last_name, email } = req.body;

            if (first_name !== undefined) currentUser.first_name = first_name;
            if (last_name !== undefined) currentUser.last_name = last_name;
            
            if (email !== undefined && email !== currentUser.email) {
                // Check if email already taken
                const existing = await userRepo.findOne({ where: { email } });
                if (existing) {
                    return res.status(400).json({ message: "Email already in use" });
                }
                currentUser.email = email;
            }

            await userRepo.save(currentUser);

            // Return user without password
            const { password, ...userSansPassword } = currentUser;
            res.json(userSansPassword);
        } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ message: "Error updating profile" });
        }
    };

    static changePassword = async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const { currentPassword, newPassword } = req.body;
            const userRepo = AppDataSource.getRepository(User);
            const currentUser = await userRepo.findOne({ where: { id: user.id } });

            if (!currentUser) {
                return res.status(404).json({ message: "User not found" });
            }

            if (currentUser.password) {
                const isValid = await bcrypt.compare(currentPassword, currentUser.password);
                if (!isValid) {
                    return res.status(400).json({ message: "Invalid current password" });
                }
            }

            currentUser.password = await bcrypt.hash(newPassword, 10);
            await userRepo.save(currentUser);

            res.json({ message: "Password updated successfully" });
        } catch (error) {
            console.error("Error changing password:", error);
            res.status(500).json({ message: "Error changing password" });
        }
    };
}
