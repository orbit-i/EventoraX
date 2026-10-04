import { z } from "zod";
import { Prisma } from "@prisma/client";

const HTTP_URL = /^https?:\/\/\S+$/i;

/** Optional text field: "" or missing → null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

/** Optional http(s) link: "" or missing → null. */
export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || HTTP_URL.test(v), "Must be a full link starting with http:// or https://");

/** Optional image: a full http(s) link, or a file we stored (/uploads/...). */
export const optionalImage = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine(
    (v) => v === null || HTTP_URL.test(v) || v.startsWith("/uploads/"),
    "Must be an uploaded image or a full http(s) link"
  );

export function isOneOf<T extends string>(list: readonly T[], value: string | undefined): value is T {
  return value !== undefined && (list as readonly string[]).includes(value);
}

/** Parses a date from a query string. Date-only values can be pushed to the end of that day. */
export function parseDate(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  return date;
}

export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}