import { z } from "zod";

export const createTenantSchema = z.object({
    organizationName: z
        .string()
        .min(2, "Organization name must be at least 2 characters"),

    admin: z.object(
        {
            email: z
                .string()
                .email("Invalid email"),

            username: z
                .string()
                .min(3, "Username must be at least 3 characters"),

            password: z
                .string()
                .min(8, "Password must be at least 8 characters")
        }
    ),

    plan: z
        .enum(["Startup", "Pro", "Enterprise"])
        .optional(),

    status: z
        .enum(["Active", "Suspended", "Trial"])
        .optional(),

    trialEndDate: z
        .string()
        .optional()
});