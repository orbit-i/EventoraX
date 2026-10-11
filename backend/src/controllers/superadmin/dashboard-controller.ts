import { Request, Response } from "express";
import prisma from "../../prisma/client";
import { ok } from "../../utils/http";
import { monthStart, fillMonths } from "../../utils/months";
import { DAY_MS, expireOverdueOrgs } from "../../utils/orgStatus";

/** Sum of confirmed payments since a date (by confirmation date). Decimal → string so nothing is rounded. */
async function revenueSince(since?: Date) {
  const r = await prisma.payment.aggregate({
    where: { status: "CONFIRMED", ...(since ? { confirmedAt: { gte: since } } : {}) },
    _sum: { amount: true },
  });
  return String(r._sum.amount ?? 0);
}

// GET /api/v1/superadmin/dashboard
export async function platformDashboard(_req: Request, res: Response) {
  await expireOverdueOrgs();
  const now = new Date();
  const monthBegin = monthStart(0);
  const yearBegin = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const inAWeek = new Date(now.getTime() + 7 * DAY_MS);
  const dayAgo = new Date(now.getTime() - DAY_MS);

  const [
    statusGroups,
    revenueMonth,
    revenueYear,
    revenueAll,
    events,
    registrations,
    certificates,
    users,
    signupRows,
    newThisMonth,
    pendingPayments,
    recentlyExpired,
    expiringSoon,
    errors24h,
    failedLogins24h,
    recentActivity,
  ] = await Promise.all([
    prisma.organization.groupBy({ by: ["status"], _count: { _all: true } }),
    revenueSince(monthBegin),
    revenueSince(yearBegin),
    revenueSince(),
    prisma.event.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.registration.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.certificate.count({ where: { status: "ISSUED" } }),
    prisma.user.count({ where: { role: { not: "superAdmin" } } }),
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month, COUNT(*) AS count
      FROM organizations WHERE createdAt >= ${monthStart(11)} GROUP BY month`,
    prisma.organization.count({ where: { createdAt: { gte: monthBegin } } }),
    prisma.payment.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id: true, amount: true, method: true, createdAt: true, organization: { select: { id: true, name: true } }, plan: { select: { name: true } } },
    }),
    prisma.organization.findMany({
      where: { status: "expired", subscriptionEndsAt: { gte: weekAgo } },
      orderBy: { subscriptionEndsAt: "desc" },
      take: 5,
      select: { id: true, name: true, subscriptionEndsAt: true, plan: { select: { name: true } } },
    }),
    prisma.organization.findMany({
      where: { status: { in: ["trial", "active"] }, subscriptionEndsAt: { gte: now, lte: inAWeek } },
      orderBy: { subscriptionEndsAt: "asc" },
      take: 5,
      select: { id: true, name: true, status: true, subscriptionEndsAt: true },
    }),
    prisma.errorLog.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: dayAgo } } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        user: { select: { id: true, name: true, role: true } },
        organization: { select: { id: true, name: true } },
      },
    }),
  ]);

  const tenants = { trial: 0, active: 0, expired: 0, suspended: 0 } as Record<string, number>;
  for (const g of statusGroups) tenants[g.status] = g._count._all;
  const pendingCount = await prisma.payment.count({ where: { status: "PENDING" } });

  return ok(res, {
    tenants: { total: Object.values(tenants).reduce((a, b) => a + b, 0), ...tenants, newThisMonth },
    revenue: { month: revenueMonth, year: revenueYear, allTime: revenueAll },
    totals: { events, registrations, certificates, users },
    signups: fillMonths(signupRows, 12),
    alerts: {
      pendingPayments: { count: pendingCount, items: pendingPayments },
      recentlyExpired,
      expiringSoon,
      errors24h,
      failedLogins24h,
    },
    recentActivity,
  });
}
