import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ok, fail, validationFail } from "../utils/http";
import { logActivity } from "../utils/activity";
import { randomToken, hashToken } from "../utils/tokens";
import { API_TOKEN_PREFIX, planHasApi } from "../middleware/apiToken";

const MAX_ACTIVE_TOKENS = 20;

/** Token management only on plans that include the REST API (Enterprise). */
export function requireApiPlan(req: Request, res: Response, next: NextFunction) {
  if (!planHasApi(req.org!.plan)) return fail(res, 403, "PLAN_REQUIRED", "API tokens are part of the Enterprise plan");
  next();
}

const TOKEN_SELECT = { id: true, name: true, prefix: true, lastUsedAt: true, expiresAt: true, revokedAt: true, createdAt: true, createdById: true } as const;

// GET /api/v1/api-tokens
export async function listTokens(req: Request, res: Response) {
  const db = req.db!;
  const tokens = await db.apiToken.findMany({ orderBy: [{ revokedAt: "asc" }, { createdAt: "desc" }], select: TOKEN_SELECT });
  const creatorIds = [...new Set(tokens.map((t) => t.createdById).filter((x): x is string => Boolean(x)))];
  const creators = creatorIds.length ? await db.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true } }) : [];
  const name = new Map(creators.map((c) => [c.id, c.name]));
  return ok(res, tokens.map((t) => ({ ...t, createdBy: t.createdById ? name.get(t.createdById) ?? null : null })));
}

const createSchema = z.object({
  name: z.string({ error: "Give the token a name" }).trim().min(2, "Give the token a name, e.g. “Website sign-up form”").max(80),
  expiresInDays: z.union([z.literal(30), z.literal(90), z.literal(365), z.null()]).default(null),
});

// POST /api/v1/api-tokens   { name, expiresInDays: 30 | 90 | 365 | null }   → the full token, shown ONCE
export async function createToken(req: Request, res: Response) {
  const db = req.db!;
  const parsed = createSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const active = await db.apiToken.count({ where: { revokedAt: null } });
  if (active >= MAX_ACTIVE_TOKENS) return fail(res, 409, "TOO_MANY_TOKENS", `You can have at most ${MAX_ACTIVE_TOKENS} active tokens — revoke one you no longer use`);

  const raw = `${API_TOKEN_PREFIX}${randomToken(20)}`; // 40 hex characters after the prefix
  const token = await db.apiToken.create({
    data: {
      organizationId: req.org!.id,
      name: parsed.data.name,
      tokenHash: hashToken(raw),
      prefix: raw.slice(0, API_TOKEN_PREFIX.length + 6),
      expiresAt: parsed.data.expiresInDays ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000) : null,
      createdById: req.user!.userId,
    },
    select: TOKEN_SELECT,
  });
  await logActivity(req, { action: "api.token.create", entityType: "ApiToken", entityId: token.id, metadata: { name: token.name } });
  return ok(res, { token: raw, record: { ...token, createdBy: req.user!.name } }, 201);
}

// POST /api/v1/api-tokens/:id/revoke
export async function revokeToken(req: Request, res: Response) {
  const db = req.db!;
  const token = await db.apiToken.findUnique({ where: { id: String(req.params.id) }, select: TOKEN_SELECT });
  if (!token) return fail(res, 404, "NOT_FOUND", "Token not found");
  if (token.revokedAt) return fail(res, 409, "ALREADY_REVOKED", "This token is already revoked");
  await db.apiToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } });
  await logActivity(req, { action: "api.token.revoke", entityType: "ApiToken", entityId: token.id, metadata: { name: token.name } });
  return ok(res, { id: token.id, revoked: true });
}
