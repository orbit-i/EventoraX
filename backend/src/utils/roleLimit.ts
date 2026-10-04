import { Role } from "@prisma/client";
import type { OrgWithPlan } from "../middleware/checkOrgStatus";
import type { ScopedPrisma } from "../prisma/scopedClient";

// Used only if an org somehow has no plan: same limits as Pro.
const FALLBACK_LIMITS = { admin: 3, manager: 7 } as const;

/** Seats allowed for a role on the org's plan. null = unlimited. Viewers are always unlimited. */
export function seatLimitFor(org: OrgWithPlan, role: Role): number | null {
  if (role === "admin") return org.plan ? org.plan.maxAdmins : FALLBACK_LIMITS.admin;
  if (role === "manager") return org.plan ? org.plan.maxManagers : FALLBACK_LIMITS.manager;
  return null;
}

/** Active members + still-valid pending invites for a role. `db` is already org-scoped. */
export async function seatsUsed(db: ScopedPrisma, role: Role): Promise<number> {
  const [members, pendingInvites] = await Promise.all([
    db.user.count({ where: { role } }),
    db.invitation.count({ where: { role, acceptedAt: null, expiresAt: { gt: new Date() } } }),
  ]);
  return members + pendingInvites;
}