import { Request, Response } from "express";
import prisma from "../../prisma/client";
import { ok } from "../../utils/http";

// GET /api/v1/superadmin/plans   (every plan, hidden ones too, with how many tenants use it)
export async function listPlans(_req: Request, res: Response) {
  const plans = await prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { organizations: true } } },
  });
  return ok(res, plans.map(({ _count, ...p }) => ({ ...p, tenantCount: _count.organizations })));
}
