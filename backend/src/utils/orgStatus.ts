import { OrgStatus } from "@prisma/client";
import prisma from "../prisma/client";

/** Marks every trial / paid organization whose time has run out as expired (checkOrgStatus also does this per request). */
export async function expireOverdueOrgs(): Promise<number> {
  const result = await prisma.organization.updateMany({
    where: { status: { in: ["trial", "active"] }, subscriptionEndsAt: { lt: new Date() } },
    data: { status: "expired" },
  });
  return result.count;
}

/**
 * The status an organization should have when nothing is blocking it (after unsuspending or extending):
 * expired if its time is up, otherwise active if it has ever paid, else trial.
 */
export async function naturalStatus(orgId: string, subscriptionEndsAt: Date): Promise<OrgStatus> {
  if (subscriptionEndsAt < new Date()) return "expired";
  const paid = await prisma.payment.count({ where: { organizationId: orgId, status: "CONFIRMED" } });
  return paid > 0 ? "active" : "trial";
}

export const DAY_MS = 24 * 60 * 60 * 1000;
