import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import { ok, fail, validationFail, pagination, q } from "../../utils/http";
import { isOneOf } from "../../utils/schemas";
import { logActivity } from "../../utils/activity";
import { audienceWhere, deliverAnnouncement } from "../../services/announcements";

const STATUSES = ["DRAFT", "SCHEDULED", "SENT"] as const;

const fields = z.object({
  title: z.string({ error: "Give it a title" }).trim().min(3, "Give it a title (3+ characters)").max(120, "At most 120 characters"),
  body: z.string({ error: "Write the message" }).trim().min(5, "Write the message").max(5000, "At most 5,000 characters"),
  targetPlanId: z.string().min(1).nullable().default(null),
  sendEmail: z.boolean().default(false),
  sendInApp: z.boolean().default(true),
  mode: z.enum(["now", "schedule", "draft"], { error: "Choose when to send it" }),
  scheduledAt: z.string().optional(),
});

const schema = fields
  .refine((v) => v.sendEmail || v.sendInApp, { message: "Choose at least one way to deliver it", path: ["sendInApp"] })
  .refine((v) => v.mode !== "schedule" || (v.scheduledAt && !Number.isNaN(Date.parse(v.scheduledAt)) && Date.parse(v.scheduledAt) > Date.now() + 30_000), {
    message: "Pick a date and time in the future",
    path: ["scheduledAt"],
  });

async function enrich<T extends { targetPlanId: string | null; createdById: string | null }>(rows: T[]) {
  const [plans, users] = await Promise.all([
    prisma.plan.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ where: { id: { in: rows.map((r) => r.createdById).filter((x): x is string => Boolean(x)) } }, select: { id: true, name: true } }),
  ]);
  const planName = new Map(plans.map((p) => [p.id, p.name]));
  const userName = new Map(users.map((u) => [u.id, u.name]));
  return rows.map((r) => ({
    ...r,
    targetPlan: r.targetPlanId ? { id: r.targetPlanId, name: planName.get(r.targetPlanId) ?? "Deleted plan" } : null,
    createdBy: r.createdById ? userName.get(r.createdById) ?? null : null,
  }));
}

// GET /api/v1/superadmin/announcements?status=&page=&limit=
export async function listAnnouncements(req: Request, res: Response) {
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const status = q(query.status);
  const where: Prisma.AnnouncementWhereInput = isOneOf(STATUSES, status) ? { status } : {};
  const [rows, total] = await Promise.all([
    prisma.announcement.findMany({ where, orderBy: [{ createdAt: "desc" }], skip, take: limit }),
    prisma.announcement.count({ where }),
  ]);
  return ok(res, await enrich(rows), 200, { total, page, limit });
}

// GET /api/v1/superadmin/announcements/stats   (counts per status, for the tabs)
export async function announcementStats(_req: Request, res: Response) {
  const counts = await prisma.announcement.groupBy({ by: ["status"], _count: { _all: true } });
  const out = { DRAFT: 0, SCHEDULED: 0, SENT: 0 } as Record<string, number>;
  for (const c of counts) out[c.status] = c._count._all;
  return ok(res, { ...out, total: out.DRAFT! + out.SCHEDULED! + out.SENT! });
}

// GET /api/v1/superadmin/announcements/audience?planId=   (how many organizations / people it would reach)
export async function audiencePreview(req: Request, res: Response) {
  const planId = q(req.query.planId) ?? null;
  const where = audienceWhere(planId);
  const [orgs, admins, members] = await Promise.all([
    prisma.organization.count({ where }),
    prisma.user.count({ where: { role: "admin", isActive: true, organization: where } }),
    prisma.user.count({ where: { isActive: true, organization: where } }),
  ]);
  return ok(res, { organizations: orgs, admins, members });
}

function dataFrom(d: z.infer<typeof fields>) {
  return {
    title: d.title,
    body: d.body,
    targetPlanId: d.targetPlanId,
    sendEmail: d.sendEmail,
    sendInApp: d.sendInApp,
    status: d.mode === "schedule" ? ("SCHEDULED" as const) : ("DRAFT" as const),
    scheduledAt: d.mode === "schedule" ? new Date(d.scheduledAt!) : null,
  };
}

async function planOk(res: Response, planId: string | null) {
  if (!planId) return true;
  if (await prisma.plan.findUnique({ where: { id: planId } })) return true;
  fail(res, 400, "VALIDATION_ERROR", "Choose who receives it", { fieldErrors: { targetPlanId: "That plan doesn't exist" } });
  return false;
}

async function fresh(id: string) {
  return (await enrich([await prisma.announcement.findUniqueOrThrow({ where: { id } })]))[0];
}

// POST /api/v1/superadmin/announcements   { title, body, targetPlanId, sendEmail, sendInApp, mode: now|schedule|draft, scheduledAt? }
export async function createAnnouncement(req: Request, res: Response) {
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  if (!(await planOk(res, parsed.data.targetPlanId))) return;
  const a = await prisma.announcement.create({ data: { ...dataFrom(parsed.data), createdById: req.user!.userId } });
  const delivery = parsed.data.mode === "now" ? await deliverAnnouncement(a.id) : null;
  await logActivity(req, {
    action: parsed.data.mode === "now" ? "announcement.send" : parsed.data.mode === "schedule" ? "announcement.schedule" : "announcement.draft",
    entityType: "Announcement",
    entityId: a.id,
    metadata: { title: a.title, ...(delivery ? { orgs: delivery.orgCount } : {}), ...(a.scheduledAt ? { at: a.scheduledAt.toISOString() } : {}) },
  });
  return ok(res, await fresh(a.id), 201);
}

async function editable(req: Request, res: Response) {
  const a = await prisma.announcement.findUnique({ where: { id: String(req.params.id) } });
  if (!a) {
    fail(res, 404, "NOT_FOUND", "Announcement not found");
    return null;
  }
  if (a.status === "SENT") {
    fail(res, 409, "ALREADY_SENT", "This announcement was already sent");
    return null;
  }
  return a;
}

// PATCH /api/v1/superadmin/announcements/:id   (drafts and scheduled ones; same body as create)
export async function updateAnnouncement(req: Request, res: Response) {
  const a = await editable(req, res);
  if (!a) return;
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  if (!(await planOk(res, parsed.data.targetPlanId))) return;
  await prisma.announcement.update({ where: { id: a.id }, data: dataFrom(parsed.data) });
  const delivery = parsed.data.mode === "now" ? await deliverAnnouncement(a.id) : null;
  await logActivity(req, {
    action: parsed.data.mode === "now" ? "announcement.send" : "announcement.update",
    entityType: "Announcement",
    entityId: a.id,
    metadata: { title: parsed.data.title, ...(delivery ? { orgs: delivery.orgCount } : {}) },
  });
  return ok(res, await fresh(a.id));
}

// POST /api/v1/superadmin/announcements/:id/send   (send a draft / scheduled one right now)
export async function sendAnnouncementNow(req: Request, res: Response) {
  const a = await editable(req, res);
  if (!a) return;
  const delivery = await deliverAnnouncement(a.id);
  await logActivity(req, { action: "announcement.send", entityType: "Announcement", entityId: a.id, metadata: { title: a.title, orgs: delivery.orgCount } });
  return ok(res, await fresh(a.id));
}

// POST /api/v1/superadmin/announcements/:id/unschedule   (scheduled → draft)
export async function unscheduleAnnouncement(req: Request, res: Response) {
  const a = await editable(req, res);
  if (!a) return;
  await prisma.announcement.update({ where: { id: a.id }, data: { status: "DRAFT", scheduledAt: null } });
  await logActivity(req, { action: "announcement.unschedule", entityType: "Announcement", entityId: a.id, metadata: { title: a.title } });
  return ok(res, await fresh(a.id));
}

// DELETE /api/v1/superadmin/announcements/:id   (drafts and scheduled only — sent ones stay as history)
export async function deleteAnnouncement(req: Request, res: Response) {
  const a = await editable(req, res);
  if (!a) return;
  await prisma.announcement.delete({ where: { id: a.id } });
  await logActivity(req, { action: "announcement.delete", entityType: "Announcement", entityId: a.id, metadata: { title: a.title } });
  return ok(res, { id: a.id, deleted: true });
}
