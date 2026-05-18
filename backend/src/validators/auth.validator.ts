import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email address" }),
        password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
        first_name: z.string().min(2, { message: "First name is required" }),
        last_name: z.string().min(2, { message: "Last name is required" }),
        role: z.enum(['athlete', 'coach', 'nutritionist']).optional(),
        phone: z.string().optional()
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email address" }),
        password: z.string().min(1, { message: "Password is required" })
    })
});

export const verifyEmailSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email address" }),
        code: z.string().min(6, { message: "Verification code must be 6 characters" }).max(6)
    })
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email address" })
    })
});

export const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string().email({ message: "Invalid email address" }),
        code: z.string().min(1, { message: "Reset code is required" }),
        newPassword: z.string().min(8, { message: "New password must be at least 8 characters long" })
    })
});
