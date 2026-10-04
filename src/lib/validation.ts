import { z } from "zod"

// These mirror the backend rules so users see problems before submitting.
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/\d/, "Include at least one number")
  .regex(/[^A-Za-z0-9]/, "Include at least one special character")

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s-]{10,16}$/, "Enter a valid phone number, e.g. +92 300 1234567")

export const PASSWORD_HINT = "8+ characters with an uppercase letter, a number and a special character"