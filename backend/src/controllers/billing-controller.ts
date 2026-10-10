import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../prisma/client";
import { ok, fail, validationFail, pagination } from "../utils/http";
import { optionalImage, optionalText } from "../utils/schemas";
import { getSetting } from "../utils/settings";
import { logActivity } from "../utils/activity";
import { sendMail, escapeHtml } from "../utils/mail";

const PLAN_SUMMARY = { select: { id: true, name: true } } as const;

// GET /api/v1/billing
export async function getBilling(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;

  const [plans, paymentAccounts, whatsapp, supportEmail, pendingPayment, paymentCount] = await Promise.all([
    prisma.plan.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } }),
    getSetting("payments.accounts", { jazzcash: "", easypaisa: "", bankIban: "" }),
    getSetting<string>("contact.whatsapp", ""),
    getSetting<string>("contact.email", ""),
    db.payment.findFirst({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, include: { plan: PLAN_SUMMARY } }),
    db.payment.count(),
  ]);

  return ok(res, {
    organization: { status: org.status, subscriptionEndsAt: org.subscriptionEndsAt, plan: org.plan },
    plans,
    paymentAccounts,
    support: { whatsapp, email: supportEmail },
    pendingPayment,
    paymentCount,
  });
}

// GET /api/v1/billing/payments?page=&limit=
export async function listPayments(req: Request, res: Response) {
  const db = req.db!;
  const { page, limit, skip } = pagination(req.query as Record<string, unknown>);
  const [items, total] = await Promise.all([
    db.payment.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit, include: { plan: PLAN_SUMMARY } }),
    db.payment.count(),
  ]);
  return ok(res, items, 200, { total, page, limit });
}

const paymentSchema = z.object({
  planId: z.string().min(1, "Choose a plan"),
  method: z.enum(["JAZZCASH", "EASYPAISA", "BANK_TRANSFER", "OTHER"]),
  referenceNo: z.string().trim().min(3, "Enter the transaction / reference number from your receipt").max(100),
  proofUrl: optionalImage,
  notes: optionalText(1000),
});

// POST /api/v1/billing/payments   { planId, method, referenceNo, proofUrl?, notes? }
// The amount always comes from the plan, never from the browser.
export async function submitPayment(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const parsed = paymentSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan || !plan.isVisible) {
    return fail(res, 400, "VALIDATION_ERROR", "That plan isn't available", { fieldErrors: { planId: "Choose a plan" } });
  }

  const pending = await db.payment.findFirst({ where: { status: "PENDING" } });
  if (pending) {
    return fail(res, 409, "PAYMENT_PENDING", "You already have a payment waiting for confirmation. Cancel it first to submit a new one.");
  }

  const payment = await db.payment.create({
    data: {
      organizationId: org.id,
      planId: plan.id,
      amount: plan.price,
      currency: plan.currency,
      method: parsed.data.method,
      referenceNo: parsed.data.referenceNo,
      proofUrl: parsed.data.proofUrl,
      notes: parsed.data.notes,
      status: "PENDING",
    },
    include: { plan: PLAN_SUMMARY },
  });

  await logActivity(req, {
    action: "billing.payment.submit",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { plan: plan.name, method: payment.method, amount: String(plan.price) },
  });

  // Let the platform team know (if a contact email is configured).
  const notifyTo = await getSetting<string>("contact.email", "");
  if (notifyTo) {
    await sendMail(
      notifyTo,
      `New payment to confirm — ${org.name}`,
      `<p><strong>${escapeHtml(org.name)}</strong> submitted a ${escapeHtml(payment.method)} payment of ${escapeHtml(
        `${plan.currency} ${String(plan.price)}`
      )} for the ${escapeHtml(plan.name)} plan.</p><p>Reference: ${escapeHtml(payment.referenceNo ?? "")}</p>`
    ).catch((err) => console.error("Payment notification failed:", err));
  }

  return ok(res, payment, 201);
}

// DELETE /api/v1/billing/payments/:id   (only a payment that is still pending)
export async function cancelPayment(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const result = await db.payment.deleteMany({ where: { id, status: "PENDING" } });
  if (result.count === 0) {
    return fail(res, 404, "NOT_FOUND", "No pending payment found — it may already have been confirmed");
  }
  await logActivity(req, { action: "billing.payment.cancel", entityType: "Payment", entityId: id });
  return ok(res, { id, cancelled: true });
}