import { z } from 'zod';

export const registerSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters"),

    email: z
        .string()
        .email("Invalid Email"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters"),

    role: z
        .enum(["superadmin", "orgadmin", "user"])
        .optional()
});

export const loginSchema = z.object({
    email: z
        .string()
        .email("Invalid Email"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
});