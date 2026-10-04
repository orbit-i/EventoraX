import { Request, Response, NextFunction } from "express";
import { Organization, Plan } from "@prisma/client";
import prisma from "../prisma/client";

export type OrgWithPlan = Organization & { plan: Plan | null };

declare global {
  namespace Express {
    interface Request {
      org?: OrgWithPlan;
    }
  }
}

/**
 * Loads the user's organization (with its plan) into req.org and blocks access when
 * the org can't be used. Use { allowExpired: true } on routes an expired org still
 * needs (org profile, settings, billing) so they can renew.
 */
export function checkOrgStatus(options: { allowExpired?: boolean } = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      return res.status(403).json({ error: "This action requires an organization account", code: "NO_ORG" });
    }

    let org = await prisma.organization.findUnique({ where: { id: orgId }, include: { plan: true } });
    if (!org) {
      return res.status(404).json({ error: "Organization not found", code: "NO_ORG" });
    }

    if (org.status === "suspended") {
      return res
        .status(403)
        .json({ error: "This organization has been suspended. Please contact support.", code: "ORG_SUSPENDED" });
    }

    // Trial or paid period has run out → mark the org as expired.
    if ((org.status === "trial" || org.status === "active") && org.subscriptionEndsAt < new Date()) {
      org = await prisma.organization.update({
        where: { id: org.id },
        data: { status: "expired" },
        include: { plan: true },
      });
    }

    if (org.status === "expired" && !options.allowExpired) {
      return res.status(402).json({ error: "Your plan has expired. Please renew to continue.", code: "ORG_EXPIRED" });
    }

    req.org = org;
    next();
  };
}