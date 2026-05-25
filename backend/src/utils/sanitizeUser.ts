import { User } from "../entities/User";

export type SafeUser = Omit<User, "password" | "verification_code" | "code_expires_at" | "oauth_id" | "fcmToken"> & {
    athleteId?: number | null;
    nutritionistProfileId?: string | null;
};

export function sanitizeUser<T extends Partial<User> & Record<string, any>>(user: T): Partial<SafeUser> {
    const {
        password,
        verification_code,
        code_expires_at,
        oauth_id,
        fcmToken,
        ...safeUser
    } = user;

    return safeUser;
}
