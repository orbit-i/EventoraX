import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import { ok, pagination, q } from "../../utils/http";
import { parseDate } from "../../utils/schemas";
import { logActivity } from "../../utils/activity";
import { toCsv } from "../../utils/csv";
import { DAY_MS } from "../../utils/orgStatus";

const LOCKOUT_MINUTES = 15;
const MAX_FAILED_LOGINS = 5;
// An IP is "suspicious" with this many failed logins in 24 h, or failures for this many different emails.
const SUSPICIOUS_FAILURES = 10;
const SUSPICIOUS_EMAILS = 3;

function activityWhere(query: Record<string, unknown>): Prisma.ActivityLogWhereInput {
  const where: Prisma.ActivityLogWhereInput = {};
  const action = q(query.action);
  const orgId = q(query.orgId);
  const userId = q(query.userId);
  const search = q(query.search);
  const from = parseDate(q(query.from));
  const to = parseDate(q(query.to), true);
  if (action) where.action = { startsWith: action }; // "tenant" covers tenant.create, tenant.suspend…
  if (orgId === "platform") where.organizationId = null;
  else if (orgId) where.OR = [{ organizationId: orgId }, { entityType: "Organization", entityId: orgId }];
  if (userId) where.userId = userId;
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  if (search) {
    const match: Prisma.ActivityLogWhereInput[] = [{ ipAddress: { contains: search } }, { user: { email: { contains: search } } }, { user: { name: { contains: search } } }];
    where.AND = [{ OR: match }];
  }
  return where;
}

const ACTIVITY_SELECT = {
  id: true,
  action: true,
  entityType: true,
  entityId: true,
  metadata: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, role: true } },
  organization: { select: { id: true, name: true } },
} as const;

// GET /api/v1/superadmin/security/activity?action=&orgId=&userId=&search=&from=&to=&page=&limit=
export async function platformActivity(req: Request, res: Response) {
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const where = activityWhere(query);
  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({ where, select: ACTIVITY_SELECT, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.activityLog.count({ where }),
  ]);
  return ok(res, items, 200, { total, page, limit });
}

// GET /api/v1/superadmin/security/activity/export   (CSV, same filters, newest first, up to 20,000 rows)
export async function exportPlatformActivity(req: Request, res: Response) {
  const rows = await prisma.activityLog.findMany({ where: activityWhere(req.query as Record<string, unknown>), select: ACTIVITY_SELECT, orderBy: { createdAt: "desc" }, take: 20000 });
  const csv = toCsv(
    ["Time (UTC)", "Who", "Email", "Role", "Organization", "Action", "Details", "IP address", "Device"],
    rows.map((r) => [
      r.createdAt.toISOString(),
      r.user?.name ?? "System",
      r.user?.email ?? "",
      r.user?.role ?? "",
      r.organization?.name ?? "(platform)",
      r.action,
      r.metadata ? JSON.stringify(r.metadata) : "",
      r.ipAddress ?? "",
      r.userAgent ?? "",
    ])
  );
  await logActivity(req, { action: "security.export", metadata: { count: rows.length } });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="security-log-${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(csv);
}

// GET /api/v1/superadmin/security/logins?status=failed|success&search=&from=&to=&page=&limit=
export async function loginAttempts(req: Request, res: Response) {
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const where: Prisma.LoginAttemptWhereInput = {};
  const status = q(query.status);
  const search = q(query.search);
  const from = parseDate(q(query.from));
  const to = parseDate(q(query.to), true);
  if (status === "failed") where.success = false;
  if (status === "success") where.success = true;
  if (search) where.OR = [{ email: { contains: search.toLowerCase() } }, { ipAddress: { contains: search } }];
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  const [items, total] = await Promise.all([
    prisma.loginAttempt.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.loginAttempt.count({ where }),
  ]);
  return ok(res, items, 200, { total, page, limit });
}

// GET /api/v1/superadmin/security/overview   (failed logins, locked accounts, suspicious IPs, recent sessions)
export async function securityOverview(_req: Request, res: Response) {
  const now = Date.now();
  const dayAgo = new Date(now - DAY_MS);
  const lockWindow = new Date(now - LOCKOUT_MINUTES * 60 * 1000);
  const [failed24h, success24h, failedByIp, failedByEmailRecent, recentSessions] = await Promise.all([
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: dayAgo } } }),
    prisma.loginAttempt.count({ where: { success: true, createdAt: { gte: dayAgo } } }),
    prisma.loginAttempt.groupBy({ by: ["ipAddress"], where: { success: false, createdAt: { gte: dayAgo } }, _count: { _all: true }, _max: { createdAt: true } }),
    prisma.loginAttempt.groupBy({ by: ["email"], where: { success: false, createdAt: { gte: lockWindow } }, _count: { _all: true }, _max: { createdAt: true } }),
    prisma.user.findMany({
      where: { lastLoginAt: { gte: dayAgo } },
      orderBy: { lastLoginAt: "desc" },
      take: 20,
      select: { id: true, name: true, email: true, role: true, lastLoginAt: true, organization: { select: { id: true, name: true } } },
    }),
  ]);

  // How many different emails each IP failed for (one extra query, only for IPs that failed).
  const ips = failedByIp.map((g) => g.ipAddress).filter((ip): ip is string => Boolean(ip));
  const pairs = ips.length
    ? await prisma.loginAttempt.groupBy({ by: ["ipAddress", "email"], where: { success: false, createdAt: { gte: dayAgo }, ipAddress: { in: ips } } })
    : [];
  const emailsPerIp = new Map<string, number>();
  for (const p of pairs) if (p.ipAddress) emailsPerIp.set(p.ipAddress, (emailsPerIp.get(p.ipAddress) ?? 0) + 1);

  const suspiciousIps = failedByIp
    .filter((g) => g.ipAddress)
    .map((g) => ({ ip: g.ipAddress!, failures: g._count._all, emails: emailsPerIp.get(g.ipAddress!) ?? 1, lastAt: g._max.createdAt }))
    .filter((x) => x.failures >= SUSPICIOUS_FAILURES || x.emails >= SUSPICIOUS_EMAILS)
    .sort((a, b) => b.failures - a.failures);

  // Same rule as the login route: 5 failures in 15 minutes → locked (the window restarts after a success).
  const lockedAccounts = failedByEmailRecent
    .filter((g) => g._count._all >= MAX_FAILED_LOGINS)
    .map((g) => ({ email: g.email, failures: g._count._all, lastAt: g._max.createdAt, unlocksAt: g._max.createdAt ? new Date(g._max.createdAt.getTime() + LOCKOUT_MINUTES * 60 * 1000) : null }));

  return ok(res, {
    failed24h,
    success24h,
    suspiciousIps,
    lockedAccounts,
    recentSessions,
    rules: { suspiciousFailures: SUSPICIOUS_FAILURES, suspiciousEmails: SUSPICIOUS_EMAILS, lockoutMinutes: LOCKOUT_MINUTES, maxFailedLogins: MAX_FAILED_LOGINS },
  });
}
