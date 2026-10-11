import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import { ok, fail, validationFail } from "../../utils/http";
import { isUniqueViolation } from "../../utils/schemas";
import { logActivity } from "../../utils/activity";

/** On/off features a plan can include (shown as a matrix on the Plans page and the pricing page). */
const PLAN_FEATURES = [
  "unlimitedEvents",
  "unlimitedAttendees",
  "qrTicketing",
  "bulkCertificates",
  "analytics",
  "emailAutomation",
  "auditLogs",
  "restApi",
  "customDomain",
  "whiteLabel",
  "prioritySupport",
] as const;

// GET /api/v1/superadmin/plans   (every plan, hidden ones too, with how many tenants use it)
export async function listPlans(_req: Request, res: Response) {
  const plans = await prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { organizations: true } } },
  });
  return ok(res, plans.map(({ _count, ...p }) => ({ ...p, tenantCount: _count.organizations })));
}

// GET /api/v1/plans   (public: plans shown on the pricing page)
export async function publicPlans(_req: Request, res: Response) {
  const plans = await prisma.plan.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, price: true, currency: true, maxAdmins: true, maxManagers: true, description: true, features: true },
  });
  return ok(res, plans);
}

const limit = z.union([z.null(), z.coerce.number().int("Whole number").min(0, "0 or more").max(10000)]);

const planFields = z.object({
  name: z.string().trim().min(2, "Give the plan a name").max(50),
  price: z.coerce.number({ error: "Enter a price" }).min(0, "Price can't be negative").max(10_000_000),
  maxAdmins: limit,
  maxManagers: limit,
  description: z.string().trim().max(300).nullish(),
  features: z.record(z.string(), z.union([z.boolean(), z.number()])),
  isVisible: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});
// Creating fills in sensible defaults; editing (PATCH) changes only the fields that were sent.
const planSchema = planFields.extend({
  features: planFields.shape.features.default({}),
  isVisible: z.boolean().default(true),
  sortOrder: planFields.shape.sortOrder.default(0),
});
const planUpdateSchema = planFields.partial();

function cleanFeatures(input: Record<string, boolean | number>, previous?: Prisma.JsonValue | null): Prisma.InputJsonValue {
  // Keep any extra values the seed stored (e.g. template counts), overwrite the known toggles.
  const base = previous && typeof previous === "object" && !Array.isArray(previous) ? (previous as Record<string, unknown>) : {};
  const out: Record<string, unknown> = { ...base };
  for (const key of PLAN_FEATURES) out[key] = input[key] === true;
  return out as Prisma.InputJsonValue;
}

function nameTaken(res: Response) {
  return fail(res, 409, "NAME_TAKEN", "Another plan already has this name", { fieldErrors: { name: "Another plan already has this name" } });
}

// POST /api/v1/superadmin/plans
export async function createPlan(req: Request, res: Response) {
  const parsed = planSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const d = parsed.data;
  try {
    const plan = await prisma.plan.create({
      data: { name: d.name, price: d.price, maxAdmins: d.maxAdmins, maxManagers: d.maxManagers, description: d.description || null, features: cleanFeatures(d.features), isVisible: d.isVisible, sortOrder: d.sortOrder },
    });
    await logActivity(req, { action: "plan.create", entityType: "Plan", entityId: plan.id, metadata: { name: plan.name } });
    return ok(res, { ...plan, tenantCount: 0 }, 201);
  } catch (err) {
    if (isUniqueViolation(err)) return nameTaken(res);
    throw err;
  }
}

// PATCH /api/v1/superadmin/plans/:id   (any subset of the fields)
export async function updatePlan(req: Request, res: Response) {
  const existing = await prisma.plan.findUnique({ where: { id: String(req.params.id) } });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Plan not found");
  const parsed = planUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const d = parsed.data;
  try {
    const plan = await prisma.plan.update({
      where: { id: existing.id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.price !== undefined ? { price: d.price } : {}),
        ...(d.maxAdmins !== undefined ? { maxAdmins: d.maxAdmins } : {}),
        ...(d.maxManagers !== undefined ? { maxManagers: d.maxManagers } : {}),
        ...(d.description !== undefined ? { description: d.description || null } : {}),
        ...(d.features !== undefined ? { features: cleanFeatures(d.features, existing.features) } : {}),
        ...(d.isVisible !== undefined ? { isVisible: d.isVisible } : {}),
        ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
      },
      include: { _count: { select: { organizations: true } } },
    });
    const { _count, ...rest } = plan;
    const visibilityOnly = Object.keys(req.body ?? {}).length === 1 && d.isVisible !== undefined;
    await logActivity(req, {
      action: visibilityOnly ? (plan.isVisible ? "plan.show" : "plan.hide") : "plan.update",
      entityType: "Plan",
      entityId: plan.id,
      metadata: { name: plan.name },
    });
    return ok(res, { ...rest, tenantCount: _count.organizations });
  } catch (err) {
    if (isUniqueViolation(err)) return nameTaken(res);
    throw err;
  }
}

// DELETE /api/v1/superadmin/plans/:id   (only when no organization uses it — otherwise hide it)
export async function deletePlan(req: Request, res: Response) {
  const plan = await prisma.plan.findUnique({ where: { id: String(req.params.id) }, include: { _count: { select: { organizations: true } } } });
  if (!plan) return fail(res, 404, "NOT_FOUND", "Plan not found");
  if (plan._count.organizations > 0) {
    return fail(res, 409, "PLAN_IN_USE", `${plan._count.organizations} organization(s) are on this plan. Move them first, or hide the plan instead.`);
  }
  await prisma.plan.delete({ where: { id: plan.id } });
  await logActivity(req, { action: "plan.delete", entityType: "Plan", entityId: plan.id, metadata: { name: plan.name } });
  return ok(res, { id: plan.id, deleted: true });
}
