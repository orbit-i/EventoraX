import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import { ok, fail, validationFail, pagination, q } from "../../utils/http";
import { isOneOf, parseDate } from "../../utils/schemas";
import { logActivity } from "../../utils/activity";
import { toCsv } from "../../utils/csv";
import { escapeHtml, sendNotice, sendRenewalEmail } from "../../utils/mail";
import { orgAdminEmails } from "../../utils/orgContacts";
import { monthStart, fillMonths } from "../../utils/months";
import { DAY_MS, expireOverdueOrgs } from "../../utils/orgStatus";

const STATUSES = ["PENDING", "CONFIRMED", "REJECTED"] as const;
const METHODS = ["JAZZCASH", "EASYPAISA", "BANK_TRANSFER", "OTHER"] as const;
const METHOD_LABEL: Record<string, string> = { JAZZCASH: "JazzCash", EASYPAISA: "Easypaisa", BANK_TRANSFER: "Bank transfer", OTHER: "Other" };
const YEAR_MS = 365 * DAY_MS;

const PAYMENT_INCLUDE = {
  organization: { select: { id: true, name: true, status: true, subscriptionEndsAt: true } },
  plan: { select: { id: true, name: true } },
} as const;

function buildWhere(query: Record<string, unknown>): Prisma.PaymentWhereInput {
  const where: Prisma.PaymentWhereInput = {};
  const status = q(query.status);
  const method = q(query.method);
  const planId = q(query.planId);
  const orgId = q(query.orgId);
  const search = q(query.search);
  const from = parseDate(q(query.from));
  const to = parseDate(q(query.to), true);
  if (isOneOf(STATUSES, status)) where.status = status;
  if (isOneOf(METHODS, method)) where.method = method;
  if (planId) where.planId = planId;
  if (orgId) where.organizationId = orgId;
  if (from || to) where.createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
  if (search) where.OR = [{ referenceNo: { contains: search } }, { organization: { name: { contains: search } } }];
  return where;
}

/** Adds the reviewer's name (confirmedById is a plain column, not a relation). */
async function withReviewers<T extends { confirmedById: string | null }>(rows: T[]) {
  const ids = [...new Set(rows.map((r) => r.confirmedById).filter((id): id is string => Boolean(id)))];
  const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
  const names = new Map(users.map((u) => [u.id, u.name]));
  return rows.map((r) => ({ ...r, reviewedBy: r.confirmedById ? names.get(r.confirmedById) ?? null : null }));
}

// GET /api/v1/superadmin/payments?status=&method=&planId=&orgId=&search=&from=&to=&page=&limit=
export async function listPayments(req: Request, res: Response) {
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const where = buildWhere(query);
  // Pending ones first (oldest waiting longest on top), then newest.
  const pendingOnly = q(query.status) === "PENDING";
  const [rows, total] = await Promise.all([
    prisma.payment.findMany({ where, include: PAYMENT_INCLUDE, orderBy: pendingOnly ? { createdAt: "asc" } : { createdAt: "desc" }, skip, take: limit }),
    prisma.payment.count({ where }),
  ]);
  return ok(res, await withReviewers(rows), 200, { total, page, limit });
}

// GET /api/v1/superadmin/payments/stats
export async function paymentStats(_req: Request, res: Response) {
  const groups = await prisma.payment.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amount: true } });
  const out: Record<string, { count: number; amount: string }> = {
    PENDING: { count: 0, amount: "0" },
    CONFIRMED: { count: 0, amount: "0" },
    REJECTED: { count: 0, amount: "0" },
  };
  for (const g of groups) out[g.status] = { count: g._count._all, amount: String(g._sum.amount ?? 0) };
  return ok(res, out);
}

// GET /api/v1/superadmin/payments/export   (CSV with the same filters)
export async function exportPayments(req: Request, res: Response) {
  const rows = await withReviewers(
    await prisma.payment.findMany({ where: buildWhere(req.query as Record<string, unknown>), include: PAYMENT_INCLUDE, orderBy: { createdAt: "desc" }, take: 20000 })
  );
  const csv = toCsv(
    ["Date", "Organization", "Plan", "Amount (PKR)", "Method", "Reference", "Status", "Reviewed by", "Reviewed at", "Period start", "Period end", "Note"],
    rows.map((p) => [
      p.createdAt.toISOString().slice(0, 10),
      p.organization.name,
      p.plan?.name ?? "",
      String(p.amount),
      METHOD_LABEL[p.method] ?? p.method,
      p.referenceNo ?? "",
      p.status,
      p.reviewedBy ?? "",
      p.confirmedAt?.toISOString().slice(0, 10) ?? "",
      p.periodStart?.toISOString().slice(0, 10) ?? "",
      p.periodEnd?.toISOString().slice(0, 10) ?? "",
      p.reviewNote ?? "",
    ])
  );
  await logActivity(req, { action: "payment.export", metadata: { count: rows.length } });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(csv);
}

const reviewSchema = z.object({
  note: z.string().trim().max(1000).optional(),
  notify: z.boolean().default(true),
});

async function notifyOrg(orgId: string, subject: string, title: string, body: string) {
  const to = await orgAdminEmails(orgId);
  for (const email of to) {
    await sendNotice(email, subject, title, body, { path: "/dashboard/billing", label: "Open billing" }).catch((err) => console.error("Payment email failed:", err));
  }
}

// POST /api/v1/superadmin/payments/:id/confirm   { note?, notify? }
// Activates the plan for one year: from the current end date if the plan is still running, otherwise from today.
export async function confirmPayment(req: Request, res: Response) {
  const parsed = reviewSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const payment = await prisma.payment.findUnique({ where: { id: String(req.params.id) }, include: { organization: true, plan: true } });
  if (!payment) return fail(res, 404, "NOT_FOUND", "Payment not found");
  if (payment.status !== "PENDING") return fail(res, 409, "ALREADY_REVIEWED", `This payment was already ${payment.status.toLowerCase()}`);

  const org = payment.organization;
  const now = new Date();
  const stillRunning = org.status === "active" && org.subscriptionEndsAt > now;
  const periodStart = stillRunning ? org.subscriptionEndsAt : now;
  const periodEnd = new Date(periodStart.getTime() + YEAR_MS);

  const [updated] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "CONFIRMED", confirmedById: req.user!.userId, confirmedAt: now, periodStart, periodEnd, reviewNote: parsed.data.note || null },
      include: PAYMENT_INCLUDE,
    }),
    prisma.organization.update({
      where: { id: org.id },
      // A suspended org stays suspended (the superadmin reactivates it separately); its paid time is still recorded.
      data: { planId: payment.planId ?? org.planId, subscriptionEndsAt: periodEnd, ...(org.status === "suspended" ? {} : { status: "active" }) },
    }),
  ]);

  await logActivity(req, {
    action: "payment.confirm",
    entityType: "Organization",
    entityId: org.id,
    metadata: { name: org.name, plan: payment.plan?.name ?? null, amount: String(payment.amount), until: periodEnd.toISOString() },
  });
  if (parsed.data.notify) {
    const until = periodEnd.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" });
    const vars = {
      orgName: org.name,
      plan: payment.plan?.name ?? "selected",
      amount: `PKR ${Number(payment.amount).toLocaleString("en-PK")}`,
      until,
      note: parsed.data.note ? `Note from our team: ${parsed.data.note}` : "",
    };
    void (async () => {
      for (const email of await orgAdminEmails(org.id)) await sendRenewalEmail(email, vars).catch((err) => console.error("Payment email failed:", err));
    })();
  }
  return ok(res, (await withReviewers([updated]))[0]);
}

// POST /api/v1/superadmin/payments/:id/reject   { note (reason, required), notify? }
export async function rejectPayment(req: Request, res: Response) {
  const parsed = reviewSchema.extend({ note: z.string({ error: "Tell the organization why it was rejected" }).trim().min(3, "Tell the organization why it was rejected").max(1000) }).safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const payment = await prisma.payment.findUnique({ where: { id: String(req.params.id) }, include: { organization: true, plan: true } });
  if (!payment) return fail(res, 404, "NOT_FOUND", "Payment not found");
  if (payment.status !== "PENDING") return fail(res, 409, "ALREADY_REVIEWED", `This payment was already ${payment.status.toLowerCase()}`);

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "REJECTED", confirmedById: req.user!.userId, confirmedAt: new Date(), reviewNote: parsed.data.note },
    include: PAYMENT_INCLUDE,
  });
  await logActivity(req, {
    action: "payment.reject",
    entityType: "Organization",
    entityId: payment.organizationId,
    metadata: { name: payment.organization.name, amount: String(payment.amount), reason: parsed.data.note },
  });
  if (parsed.data.notify) {
    void notifyOrg(
      payment.organizationId,
      "Payment could not be confirmed — EventoraX",
      "We couldn't confirm your payment",
      `<p>Your ${escapeHtml(METHOD_LABEL[payment.method] ?? payment.method)} payment (reference <strong>${escapeHtml(payment.referenceNo ?? "—")}</strong>) could not be confirmed.</p><p>Reason: ${escapeHtml(
        parsed.data.note
      )}</p><p>Please check the details and submit it again from the Billing page, or reply to this email.</p>`
    );
  }
  return ok(res, (await withReviewers([updated]))[0]);
}

// GET /api/v1/superadmin/revenue   (charts + outstanding list)
export async function revenueOverview(_req: Request, res: Response) {
  await expireOverdueOrgs();
  const now = new Date();
  const soon = new Date(now.getTime() + 14 * DAY_MS);
  const [monthlyRows, byPlan, byMethod, plans, outstanding] = await Promise.all([
    prisma.$queryRaw<{ month: string; count: string | null }[]>`
      SELECT DATE_FORMAT(confirmedAt, '%Y-%m') AS month, SUM(amount) AS count
      FROM payments WHERE status = 'CONFIRMED' AND confirmedAt >= ${monthStart(11)} GROUP BY month`,
    prisma.payment.groupBy({ by: ["planId"], where: { status: "CONFIRMED" }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.payment.groupBy({ by: ["method"], where: { status: "CONFIRMED" }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.plan.findMany({ select: { id: true, name: true } }),
    // Organizations that have run out (or will within 14 days) and haven't sent a payment yet.
    prisma.organization.findMany({
      where: {
        OR: [{ status: "expired" }, { status: { in: ["trial", "active"] }, subscriptionEndsAt: { lte: soon } }],
        payments: { none: { status: "PENDING" } },
      },
      orderBy: { subscriptionEndsAt: "asc" },
      take: 50,
      select: { id: true, name: true, email: true, status: true, subscriptionEndsAt: true, plan: { select: { id: true, name: true, price: true } } },
    }),
  ]);
  const planName = new Map(plans.map((p) => [p.id, p.name]));
  return ok(res, {
    monthly: fillMonths(monthlyRows, 12).map((m) => ({ month: m.month, amount: m.count })),
    byPlan: byPlan
      .map((g) => ({ planId: g.planId, plan: g.planId ? planName.get(g.planId) ?? "Deleted plan" : "No plan", amount: Number(g._sum.amount ?? 0), count: g._count._all }))
      .sort((a, b) => b.amount - a.amount),
    byMethod: byMethod.map((g) => ({ method: g.method, amount: Number(g._sum.amount ?? 0), count: g._count._all })).sort((a, b) => b.amount - a.amount),
    outstanding,
  });
}
