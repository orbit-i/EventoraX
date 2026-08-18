import { z } from "zod";

const createPlanSchema = z.object({
    planName: z
        .string()
        .min(2, "Plan name must be at least 2 characters")
        .max(50, "Plan name cannot exceed 50 characters")
        .trim(),

    planTier: z
        .enum(["Startup", "Pro", "Enterprise"]),

    monthlyPrice: z
        .number()
        .min(0, "Monthly price cannot be negative"),

    yearlyPrice: z
        .number()
        .min(0, "Yearly price cannot be negative"),

    billingCycle: z
        .enum(["Monthly", "Yearly", "Both"]),

    description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .trim(),

    features: z
        .array(z.string().trim())
        .min(1, "At least one feature is required"),

    maxUsers: z
        .number()
        .int()
        .min(1, "Maximum users at least 1")
        .nullable()
        .optional(),

    storageLimit: z
        .string()
        .min(1, "Storage limit is required")
        .trim(),

    unlimited: z
        .boolean()
        .default(false),

    status: z
        .enum(["Active", "Inactive", "Draft"])
        .default("Active"),

    isPopular: z
        .boolean()
        .default(false)
});

const updatePlanSchema = createPlanSchema.partial();

export {
    createPlanSchema,
    updatePlanSchema
}