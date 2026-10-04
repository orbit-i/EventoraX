import { Role } from "@prisma/client";

export const ROLE_SEAT_LIMITS: Partial<Record<Role, number>> = {
  admin: 3,
  manager: 7,
};

export async function getRoleUsageCount(db: any, organizationId: string, role: Role) {
  const activeCount = await db.user.count({
    where: { organizationId, role },
  });

  const pendingInviteCount = await db.invitation.count({
    where: {
      organizationId,
      role,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  return activeCount + pendingInviteCount;
}