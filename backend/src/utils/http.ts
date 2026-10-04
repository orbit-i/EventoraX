import { Response } from "express";
import type { ZodError } from "zod";
import { fieldErrors } from "./validation";

export interface ListMeta {
  total: number;
  page: number;
  limit: number;
}

/** Success: { data, error: null, meta? } */
export function ok<T>(res: Response, data: T, status = 200, meta?: ListMeta) {
  return res.status(status).json(meta ? { data, error: null, meta } : { data, error: null });
}

/** Failure: { data: null, error: { code, message, fieldErrors? } } */
export function fail(
  res: Response,
  status: number,
  code: string,
  message: string,
  extra?: { fieldErrors?: Record<string, string> }
) {
  return res.status(status).json({ data: null, error: { code, message, ...extra } });
}

export function validationFail(res: Response, error: ZodError) {
  return fail(res, 400, "VALIDATION_ERROR", "Please fix the highlighted fields", {
    fieldErrors: fieldErrors(error),
  });
}

/** Reads ?page=&limit= safely. Limit is capped at 100. */
export function pagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit ?? "20"), 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

/** One query-string value as a trimmed string, or undefined if missing/empty. */
export function q(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}