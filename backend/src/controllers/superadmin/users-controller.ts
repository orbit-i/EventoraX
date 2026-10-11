import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import { ok, fail, validationFail, pagination, q } from "../../utils/http";
import { isOneOf } from "../../utils/schemas";
import { logActivity } from "../../utils/activity";
import { randomToken, hashToken } from "../../utils/tokens";
import { sendResetPasswordEmail } from "../../utils/mail";
import { toCsv } from "../../utils/csv";

const ROLES = ["superAdmin", "admin", "manager", "viewer"] as const;
const RESET_TOKEN_MINUTES = 15;

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  emailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  twoFactorEnabledAt: true,
  organization: { select: { id: true, name: true, status: true } },
} as const;

function buildWhere(query: Record<string, unknown>): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  const role = q(query.role);
  const orgId = q(query.orgId);
  const status = q(query.status);
  const search = q(query.search);
  if (isOneOf(ROLES, role)) where.role = role;
  if (orgId) where.organizationId = orgId;
  if (status === "active") where.isActive = true;
  if (status === "disabled") where.isActive = false;
  if (status === "unverified") where.emailVerified = false;
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }, { organization: { name: { contains: search } } }];
  return where;
}

// GET /api/v1/superadmin/users?search=&role=&orgId=&status=active|disabled|unverified&page=&limit=
export async function listUsers(req: Request, res: Response) {
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const where = buildWhere(query);
  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: USER_SELECT, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.user.count({ where }),
  ]);
  return ok(res, items, 200, { total, page, limit });
}

// GET /api/v1/superadmin/users/stats
export async function userStats(_req: Request, res: Response) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, disabled, unverified, activeWeek, roles] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { emailVerified: false } }),
    prisma.user.count({ where: { lastLoginAt: { gte: weekAgo } } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);
  return ok(res, { total, disabled, unverified, activeWeek, byRole: Object.fromEntries(roles.map((r) => [r.role, r._count._all])) });
}

// GET /api/v1/superadmin/users/export   (CSV, same filters)
export async function exportUsers(req: Request, res: Response) {
  const rows = await prisma.user.findMany({ where: buildWhere(req.query as Record<string, unknown>), select: USER_SELECT, orderBy: { createdAt: "desc" }, take: 20000 });
  const csv = toCsv(
    ["Name", "Email", "Phone", "Role", "Organization", "Active", "Email verified", "Last login", "Joined"],
    rows.map((u) => [
      u.name,
      u.email,
      u.phone ?? "",
      u.role,
      u.organization?.name ?? "(platform)",
      u.isActive ? "yes" : "no",
      u.emailVerified ? "yes" : "no",
      u.lastLoginAt?.toISOString() ?? "",
      u.createdAt.toISOString().slice(0, 10),
    ])
  );
  await logActivity(req, { action: "user.export", metadata: { count: rows.length } });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(csv);
}

async function findUser(req: Request) {
  return prisma.user.findUnique({ where: { id: String(req.params.id) }, select: { ...USER_SELECT, tokenVersion: true } });
}

// GET /api/v1/superadmin/users/:id   (profile + recent actions + recent logins)
export async function getUser(req: Request, res: Response) {
  const user = await findUser(req);
  if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
  const [activity, logins] = await Promise.all([
    prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, action: true, entityType: true, entityId: true, metadata: true, createdAt: true, ipAddress: true, organization: { select: { id: true, name: true } } },
    }),
    prisma.loginAttempt.findMany({ where: { email: user.email }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, success: true, ipAddress: true, userAgent: true, createdAt: true } }),
  ]);
  const { tokenVersion: _tv, ...profile } = user;
  return ok(res, { user: profile, activity: activity.map((a) => ({ ...a, user: { id: user.id, name: user.name, role: user.role } })), logins });
}

/** Superadmins can't lock themselves (or another superadmin) out from here. */
function guard(req: Request, res: Response, user: { id: string; role: string }) {
  if (user.id === req.user!.userId) return fail(res, 400, "SELF", "You can't do this to your own account here. Use your account settings.");
  if (user.role === "superAdmin") return fail(res, 403, "PROTECTED", "Other superadmin accounts can't be changed from this page.");
  return null;
}

// POST /api/v1/superadmin/users/:id/disable   (also logs them out everywhere)
export async function disableUser(req: Request, res: Response) {
  const user = await findUser(req);
  if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
  const blocked = guard(req, res, user);
  if (blocked) return blocked;
  await prisma.user.update({ where: { id: user.id }, data: { isActive: false, tokenVersion: { increment: 1 } } });
  await logActivity(req, { action: "user.disable", entityType: "User", entityId: user.id, metadata: { name: user.name, email: user.email, org: user.organization?.name ?? null } });
  return ok(res, { id: user.id, isActive: false });
}

// POST /api/v1/superadmin/users/:id/enable
export async function enableUser(req: Request, res: Response) {
  const user = await findUser(req);
  if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
  const blocked = guard(req, res, user);
  if (blocked) return blocked;
  await prisma.user.update({ where: { id: user.id }, data: { isActive: true } });
  await logActivity(req, { action: "user.enable", entityType: "User", entityId: user.id, metadata: { name: user.name, email: user.email, org: user.organization?.name ?? null } });
  return ok(res, { id: user.id, isActive: true });
}

// POST /api/v1/superadmin/users/:id/logout   (ends every session of this user)
export async function forceLogout(req: Request, res: Response) {
  const user = await findUser(req);
  if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
  const blocked = guard(req, res, user);
  if (blocked) return blocked;
  await prisma.user.update({ where: { id: user.id }, data: { tokenVersion: { increment: 1 } } });
  await logActivity(req, { action: "user.logout", entityType: "User", entityId: user.id, metadata: { name: user.name, email: user.email } });
  return ok(res, { id: user.id, loggedOut: true });
}

const resetSchema = z.object({ mode: z.enum(["link", "temporary"], { error: "Choose how to reset the password" }) });

// POST /api/v1/superadmin/users/:id/reset-password   { mode: "link" (email a reset link) | "temporary" (shown once) }
export async function resetUserPassword(req: Request, res: Response) {
  const parsed = resetSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const user = await findUser(req);
  if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
  const blocked = guard(req, res, user);
  if (blocked) return blocked;

  if (parsed.data.mode === "link") {
    const token = randomToken();
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({ data: { token: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000) } }),
    ]);
    await sendResetPasswordEmail(user.email, token).catch((err) => console.error("Reset email failed:", err));
    await logActivity(req, { action: "user.password.link", entityType: "User", entityId: user.id, metadata: { name: user.name, email: user.email } });
    return ok(res, { mode: "link", sentTo: user.email });
  }

  const password = `Evx-${randomToken(6).slice(0, 8)}${Math.floor(10 + Math.random() * 89)}!`;
  await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 10), tokenVersion: { increment: 1 } } });
  await logActivity(req, { action: "user.password.temporary", entityType: "User", entityId: user.id, metadata: { name: user.name, email: user.email } });
  return ok(res, { mode: "temporary", temporaryPassword: password });
}

// POST /api/v1/superadmin/users/:id/reset-2fa   (they lost their phone and their recovery codes)
export async function resetTwoFactor(req: Request, res: Response) {
  const user = await findUser(req);
  if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
  const blocked = guard(req, res, user);
  if (blocked) return blocked;
  if (!user.twoFactorEnabledAt) return fail(res, 409, "NOT_ENABLED", "Two-factor login is already off for this account");
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabledAt: null, twoFactorSecret: null, twoFactorRecoveryCodes: Prisma.DbNull, tokenVersion: { increment: 1 } },
  });
  await logActivity(req, { action: "user.2fa.reset", entityType: "User", entityId: user.id, metadata: { name: user.name, email: user.email } });
  return ok(res, { id: user.id, twoFactorEnabled: false });
}
