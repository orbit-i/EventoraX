import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { getScopedPrisma } from "../prisma/scopedClient";
import { hashToken } from "../utils/tokens";
import { fail } from "../utils/http";

export const API_TOKEN_PREFIX = "evx_live_";

declare global {
  namespace Express {
    interface Request {
      apiToken?: { id: string; name: string };
    }
  }
}

/** Does this organization's plan include the REST API? (Plans → features.restApi) */
export function planHasApi(plan: { features: unknown } | null | undefined) {
  const f = plan?.features as Record<string, unknown> | null | undefined;
  return f?.restApi === true;
}

/**
 * Authenticates a REST API call: `Authorization: Bearer evx_live_…`.
 * Sets req.org (+ plan), req.db (scoped to that organization) and req.apiToken. No user session is involved.
 */
export async function requireApiToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!raw.startsWith(API_TOKEN_PREFIX)) {
    return fail(res, 401, "NO_TOKEN", "Send your API token as: Authorization: Bearer evx_live_…");
  }
  const token = await prisma.apiToken.findUnique({ where: { tokenHash: hashToken(raw) }, include: { organization: { include: { plan: true } } } });
  if (!token || token.revokedAt) return fail(res, 401, "BAD_TOKEN", "This API token is invalid or has been revoked");
  if (token.expiresAt && token.expiresAt < new Date()) return fail(res, 401, "TOKEN_EXPIRED", "This API token has expired — create a new one in Dashboard → API");

  const org = token.organization;
  if (org.status === "suspended") return fail(res, 403, "ORG_SUSPENDED", "This organization is suspended");
  if (org.status === "expired" || org.subscriptionEndsAt < new Date()) return fail(res, 402, "ORG_EXPIRED", "The organization's plan has expired");
  if (!planHasApi(org.plan)) return fail(res, 403, "PLAN_REQUIRED", "The REST API is part of the Enterprise plan");

  // Remember when it was last used (at most once a minute, to keep writes low).
  if (!token.lastUsedAt || Date.now() - token.lastUsedAt.getTime() > 60_000) {
    void prisma.apiToken.update({ where: { id: token.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
  }

  req.org = org;
  req.db = getScopedPrisma(org.id);
  req.apiToken = { id: token.id, name: token.name };
  next();
}
