import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import { ok, fail, validationFail, pagination, q } from "../../utils/http";
import { isOneOf, parseDate, isUniqueViolation } from "../../utils/schemas";
import { logActivity } from "../../utils/activity";
import { EMAIL_REGEX } from "../../utils/password";
import { randomToken } from "../../utils/tokens";
import { signImpersonationToken } from "../../utils/jwt";
import { deleteUploadFolder, deletePrivateFolder } from "../../utils/storage";
import { toCsv } from "../../utils/csv";
import { DAY_MS, expireOverdueOrgs, naturalStatus } from "../../utils/orgStatus";

const ORG_STATUSES = ["trial", "active", "expired", "suspended"] as const;
const SORTS = ["newest", "oldest", "name", "ending"] as const;

const TENANT_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  email: true,
  phone: true,
  logoUrl: true,
  status: true,
  subscriptionEndsAt: true,
  suspendedAt: true,
  createdAt: true,
  plan: { select: { id: true, name: true } },
  _count: { select: { users: true, events: true } },
} as const;

function buildWhere(query: Record<string, unknown>): Prisma.OrganizationWhereInput {
  const where: Prisma.OrganizationWhereInput = {};
  const status = q(query.status);
  const planId = q(query.planId);
  const search = q(query.search);
  const from = parseDate(q(query.from));
  const to = parseDate(q(query.to), true);
  if (isOneOf(ORG_STATUSES, status)) where.status = status;
  if (planId === "none") where.planId = null;
  else if (planId) where.planId = planId;
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { slug: { contains: search } },
      { users: { some: { email: { contains: search } } } },
    ];
  }
  return where;
}

function orderOf(sort: string | undefined): Prisma.OrganizationOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name":
      return { name: "asc" };
    case "ending":
      return { subscriptionEndsAt: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

// GET /api/v1/superadmin/tenants?search=&status=&planId=&from=&to=&sort=&page=&limit=
export async function listTenants(req: Request, res: Response) {
  await expireOverdueOrgs();
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const where = buildWhere(query);
  const sort = q(query.sort);
  const [items, total] = await Promise.all([
    prisma.organization.findMany({ where, select: TENANT_LIST_SELECT, orderBy: orderOf(isOneOf(SORTS, sort) ? sort : undefined), skip, take: limit }),
    prisma.organization.count({ where }),
  ]);
  return ok(res, items, 200, { total, page, limit });
}

// GET /api/v1/superadmin/tenants/stats
export async function tenantStats(_req: Request, res: Response) {
  await expireOverdueOrgs();
  const groups = await prisma.organization.groupBy({ by: ["status"], _count: { _all: true } });
  const byStatus = { trial: 0, active: 0, expired: 0, suspended: 0 } as Record<string, number>;
  for (const g of groups) byStatus[g.status] = g._count._all;
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  return ok(res, { total, ...byStatus });
}

// GET /api/v1/superadmin/tenants/export   (CSV, same filters as the list)
export async function exportTenants(req: Request, res: Response) {
  const where = buildWhere(req.query as Record<string, unknown>);
  const rows = await prisma.organization.findMany({ where, select: TENANT_LIST_SELECT, orderBy: { createdAt: "desc" }, take: 10000 });
  const csv = toCsv(
    ["Organization", "Slug", "Email", "Phone", "Plan", "Status", "Plan ends", "Team", "Events", "Created"],
    rows.map((o) => [
      o.name,
      o.slug,
      o.email ?? "",
      o.phone ?? "",
      o.plan?.name ?? "",
      o.status,
      o.subscriptionEndsAt.toISOString().slice(0, 10),
      String(o._count.users),
      String(o._count.events),
      o.createdAt.toISOString().slice(0, 10),
    ])
  );
  await logActivity(req, { action: "tenant.export", metadata: { count: rows.length } });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="tenants-${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(csv);
}

async function findTenant(req: Request) {
  return prisma.organization.findUnique({ where: { id: String(req.params.id) }, include: { plan: true } });
}

// GET /api/v1/superadmin/tenants/:id   (everything the drill-down page shows)
export async function getTenant(req: Request, res: Response) {
  const org = await findTenant(req);
  if (!org) return fail(res, 404, "NOT_FOUND", "Organization not found");
  const id = org.id;

  const [events, archived, registrations, attended, certificates, ticketsUsed, idCards, roleGroups, pendingInvites, users, recentEvents, payments, activity, lastActivity, paidTotal] =
    await Promise.all([
      prisma.event.count({ where: { organizationId: id, status: { not: "ARCHIVED" } } }),
      prisma.event.count({ where: { organizationId: id, status: "ARCHIVED" } }),
      prisma.registration.count({ where: { organizationId: id, status: { not: "CANCELLED" } } }),
      prisma.registration.count({ where: { organizationId: id, status: "ATTENDED" } }),
      prisma.certificate.count({ where: { organizationId: id, status: "ISSUED" } }),
      prisma.ticket.count({ where: { organizationId: id, isUsed: true } }),
      prisma.idCard.count({ where: { organizationId: id } }),
      prisma.user.groupBy({ by: ["role"], where: { organizationId: id }, _count: { _all: true } }),
      prisma.invitation.count({ where: { organizationId: id, acceptedAt: null, expiresAt: { gt: new Date() } } }),
      prisma.user.findMany({
        where: { organizationId: id },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, email: true, role: true, isActive: true, emailVerified: true, lastLoginAt: true, createdAt: true },
      }),
      prisma.event.findMany({
        where: { organizationId: id },
        orderBy: { startDateTime: "desc" },
        take: 8,
        select: { id: true, title: true, status: true, startDateTime: true, _count: { select: { registrations: true } } },
      }),
      prisma.payment.findMany({ where: { organizationId: id }, orderBy: { createdAt: "desc" }, take: 10, include: { plan: { select: { id: true, name: true } } } }),
      prisma.activityLog.findMany({
        where: { OR: [{ organizationId: id }, { entityType: "Organization", entityId: id }] },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, action: true, entityType: true, entityId: true, metadata: true, createdAt: true, ipAddress: true, user: { select: { id: true, name: true, role: true } } },
      }),
      prisma.activityLog.findFirst({ where: { organizationId: id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      prisma.payment.aggregate({ where: { organizationId: id, status: "CONFIRMED" }, _sum: { amount: true } }),
    ]);

  const roles = { admin: 0, manager: 0, viewer: 0 } as Record<string, number>;
  for (const g of roleGroups) roles[g.role] = g._count._all;

  return ok(res, {
    organization: org,
    usage: {
      events,
      archivedEvents: archived,
      registrations,
      attended,
      certificates,
      ticketsCheckedIn: ticketsUsed,
      idCards,
      team: roles,
      pendingInvites,
      lastActivityAt: lastActivity?.createdAt ?? null,
      totalPaid: String(paidTotal._sum.amount ?? 0),
    },
    users,
    recentEvents: recentEvents.map(({ _count, ...e }) => ({ ...e, registrations: _count.registrations })),
    payments,
    activity,
  });
}

const createSchema = z.object({
  orgName: z.string().trim().min(2, "Enter the organization's name").max(150),
  orgEmail: z.string().trim().toLowerCase().max(191).refine((v) => v === "" || EMAIL_REGEX.test(v), "Enter a valid email address").optional(),
  phone: z.string().trim().max(30).optional(),
  adminName: z.string().trim().min(2, "Enter the admin's full name").max(100),
  adminEmail: z.string().trim().toLowerCase().max(191).refine((v) => EMAIL_REGEX.test(v), "Enter a valid email address"),
  planId: z.string().min(1, "Choose a plan"),
  status: z.enum(["trial", "active"]),
  days: z.coerce.number().int("Whole days only").min(1, "At least 1 day").max(3650, "At most 10 years"),
});

async function uniqueSlug(name: string): Promise<string> {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "org";
  let slug = base;
  for (let i = 1; await prisma.organization.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  return slug;
}

/** A readable temporary password that passes the password rules (upper, lower, digit, symbol). */
function temporaryPassword() {
  return `Evx-${randomToken(6).slice(0, 8)}${Math.floor(10 + Math.random() * 89)}!`;
}

// POST /api/v1/superadmin/tenants   (add a tenant by hand, e.g. a university that paid offline)
export async function createTenant(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const d = parsed.data;

  const plan = await prisma.plan.findUnique({ where: { id: d.planId } });
  if (!plan) return fail(res, 400, "VALIDATION_ERROR", "Choose a plan", { fieldErrors: { planId: "That plan doesn't exist" } });
  if (await prisma.user.findUnique({ where: { email: d.adminEmail } })) {
    return fail(res, 409, "EMAIL_TAKEN", "Someone already uses this email", { fieldErrors: { adminEmail: "An account with this email already exists" } });
  }

  const password = temporaryPassword();
  try {
    const { org, user } = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: d.orgName,
          slug: await uniqueSlug(d.orgName),
          email: d.orgEmail || d.adminEmail,
          phone: d.phone || null,
          status: d.status,
          planId: plan.id,
          subscriptionEndsAt: new Date(Date.now() + d.days * DAY_MS),
        },
      });
      const user = await tx.user.create({
        data: { name: d.adminName, email: d.adminEmail, phone: d.phone || null, password: await bcrypt.hash(password, 10), role: "admin", organizationId: org.id, emailVerified: true },
      });
      return { org, user };
    });
    await logActivity(req, { action: "tenant.create", entityType: "Organization", entityId: org.id, metadata: { name: org.name, plan: plan.name, status: d.status } });
    return ok(res, { organization: org, admin: { id: user.id, name: user.name, email: user.email }, temporaryPassword: password }, 201);
  } catch (err) {
    if (isUniqueViolation(err)) return fail(res, 409, "EMAIL_TAKEN", "Someone already uses this email", { fieldErrors: { adminEmail: "An account with this email already exists" } });
    throw err;
  }
}

const updateSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(150).optional(),
  email: z.string().trim().toLowerCase().max(191).refine((v) => v === "" || EMAIL_REGEX.test(v), "Enter a valid email address").optional(),
  phone: z.string().trim().max(30).optional(),
});

// PATCH /api/v1/superadmin/tenants/:id   { name?, email?, phone? }
export async function updateTenant(req: Request, res: Response) {
  const org = await findTenant(req);
  if (!org) return fail(res, 404, "NOT_FOUND", "Organization not found");
  const parsed = updateSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const d = parsed.data;
  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: { ...(d.name ? { name: d.name } : {}), ...(d.email !== undefined ? { email: d.email || null } : {}), ...(d.phone !== undefined ? { phone: d.phone || null } : {}) },
    include: { plan: true },
  });
  await logActivity(req, { action: "tenant.update", entityType: "Organization", entityId: org.id, metadata: { name: updated.name } });
  return ok(res, updated);
}

// POST /api/v1/superadmin/tenants/:id/plan   { planId }
export async function changeTenantPlan(req: Request, res: Response) {
  const org = await findTenant(req);
  if (!org) return fail(res, 404, "NOT_FOUND", "Organization not found");
  const parsed = z.object({ planId: z.string().min(1, "Choose a plan") }).safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan) return fail(res, 400, "VALIDATION_ERROR", "Choose a plan", { fieldErrors: { planId: "That plan doesn't exist" } });

  // Moving to a smaller plan never removes people; the org just can't add more until it's under the limit again.
  const updated = await prisma.organization.update({ where: { id: org.id }, data: { planId: plan.id }, include: { plan: true } });
  await logActivity(req, { action: "tenant.plan", entityType: "Organization", entityId: org.id, metadata: { name: org.name, from: org.plan?.name ?? null, to: plan.name } });
  return ok(res, updated);
}

const extendSchema = z
  .object({
    days: z.coerce.number().int("Whole days only").min(1, "At least 1 day").max(3650, "At most 10 years").optional(),
    until: z.string().optional(),
  })
  .refine((v) => v.days !== undefined || v.until, { message: "Enter a number of days or a date", path: ["days"] });

// POST /api/v1/superadmin/tenants/:id/extend   { days } (added to the later of now / the current end)  or  { until: "2026-12-31" }
export async function extendTenant(req: Request, res: Response) {
  const org = await findTenant(req);
  if (!org) return fail(res, 404, "NOT_FOUND", "Organization not found");
  const parsed = extendSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  let ends: Date;
  if (parsed.data.until) {
    const until = parseDate(parsed.data.until, true);
    if (!until || until < new Date()) return fail(res, 400, "VALIDATION_ERROR", "Pick a date in the future", { fieldErrors: { until: "Pick a date in the future" } });
    ends = until;
  } else {
    const from = Math.max(Date.now(), org.subscriptionEndsAt.getTime());
    ends = new Date(from + parsed.data.days! * DAY_MS);
  }
  const status = org.status === "suspended" ? "suspended" : await naturalStatus(org.id, ends);
  const updated = await prisma.organization.update({ where: { id: org.id }, data: { subscriptionEndsAt: ends, status }, include: { plan: true } });
  await logActivity(req, {
    action: "tenant.extend",
    entityType: "Organization",
    entityId: org.id,
    metadata: { name: org.name, from: org.subscriptionEndsAt.toISOString(), to: ends.toISOString(), status },
  });
  return ok(res, updated);
}

// POST /api/v1/superadmin/tenants/:id/suspend   { reason }
export async function suspendTenant(req: Request, res: Response) {
  const org = await findTenant(req);
  if (!org) return fail(res, 404, "NOT_FOUND", "Organization not found");
  const parsed = z.object({ reason: z.string().trim().min(3, "Tell the organization why (they'll see this)").max(1000) }).safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  if (org.status === "suspended") return fail(res, 409, "ALREADY_SUSPENDED", "This organization is already suspended");
  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: { status: "suspended", suspendedAt: new Date(), suspendedReason: parsed.data.reason },
    include: { plan: true },
  });
  await logActivity(req, { action: "tenant.suspend", entityType: "Organization", entityId: org.id, metadata: { name: org.name, reason: parsed.data.reason } });
  return ok(res, updated);
}

// POST /api/v1/superadmin/tenants/:id/unsuspend
export async function unsuspendTenant(req: Request, res: Response) {
  const org = await findTenant(req);
  if (!org) return fail(res, 404, "NOT_FOUND", "Organization not found");
  if (org.status !== "suspended") return fail(res, 409, "NOT_SUSPENDED", "This organization isn't suspended");
  const status = await naturalStatus(org.id, org.subscriptionEndsAt);
  const updated = await prisma.organization.update({ where: { id: org.id }, data: { status, suspendedAt: null, suspendedReason: null }, include: { plan: true } });
  await logActivity(req, { action: "tenant.unsuspend", entityType: "Organization", entityId: org.id, metadata: { name: org.name, status } });
  return ok(res, updated);
}

// POST /api/v1/superadmin/tenants/:id/impersonate   → a 1-hour session as the org's first admin
export async function impersonateTenant(req: Request, res: Response) {
  const org = await findTenant(req);
  if (!org) return fail(res, 404, "NOT_FOUND", "Organization not found");
  const admin = await prisma.user.findFirst({
    where: { organizationId: org.id, role: "admin", isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, tokenVersion: true },
  });
  if (!admin) return fail(res, 409, "NO_ADMIN", "This organization has no active admin to log in as");
  const token = signImpersonationToken({ userId: admin.id, tokenVersion: admin.tokenVersion, imp: req.user!.userId });
  await logActivity(req, { action: "tenant.impersonate", entityType: "Organization", entityId: org.id, metadata: { name: org.name, as: admin.email } });
  return ok(res, { token, user: { id: admin.id, name: admin.name, email: admin.email }, organization: { id: org.id, name: org.name, status: org.status } });
}

// DELETE /api/v1/superadmin/tenants/:id   { confirm: "<exact organization name>" }
// Permanently deletes the organization with its team, events, payments and files.
export async function deleteTenant(req: Request, res: Response) {
  const org = await findTenant(req);
  if (!org) return fail(res, 404, "NOT_FOUND", "Organization not found");
  const confirm = typeof req.body?.confirm === "string" ? req.body.confirm.trim() : "";
  if (confirm !== org.name) {
    return fail(res, 400, "VALIDATION_ERROR", "Type the organization's name exactly to confirm", { fieldErrors: { confirm: `Type "${org.name}" to confirm` } });
  }
  await prisma.organization.delete({ where: { id: org.id } });
  await Promise.all([deleteUploadFolder(`orgs/${org.id}`), deletePrivateFolder(`orgs/${org.id}`)]);
  await logActivity(req, { action: "tenant.delete", entityType: "Organization", entityId: org.id, metadata: { name: org.name } });
  return ok(res, { id: org.id, deleted: true });
}
