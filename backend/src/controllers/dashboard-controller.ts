import { Request, Response } from "express";
import prisma from "../prisma/client";
import { ok } from "../utils/http";

const EVENT_SUMMARY = {
  id: true,
  title: true,
  startDateTime: true,
  endDateTime: true,
  status: true,
  mode: true,
  location: true,
  maxAttendees: true,
  _count: { select: { registrations: true } },
} as const;

/** First day (UTC) of the month `monthsBack` months ago. */
function monthStart(monthsBack: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
}

/** The last `count` months as "YYYY-MM", oldest first. */
function monthKeys(count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = monthStart(i);
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function fillMonths(rows: { month: string; count: bigint | number }[], count: number) {
  const byMonth = new Map(rows.map((r) => [r.month, Number(r.count)]));
  return monthKeys(count).map((month) => ({ month, count: byMonth.get(month) ?? 0 }));
}

/** Active (non-cancelled) registrations per month — one grouped query. */
async function monthlyRegistrations(organizationId: string, months: number) {
  const since = monthStart(months - 1);
  const rows = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
    SELECT DATE_FORMAT(registrationDate, '%Y-%m') AS month, COUNT(*) AS count
    FROM registrations
    WHERE organizationId = ${organizationId} AND registrationDate >= ${since} AND status <> 'CANCELLED'
    GROUP BY month`;
  return fillMonths(rows, months);
}

/** Certificates issued per month — one grouped query. */
async function monthlyCertificates(organizationId: string, months: number) {
  const since = monthStart(months - 1);
  const rows = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
    SELECT DATE_FORMAT(issuedAt, '%Y-%m') AS month, COUNT(*) AS count
    FROM certificates
    WHERE organizationId = ${organizationId} AND issuedAt >= ${since}
    GROUP BY month`;
  return fillMonths(rows, months);
}

// GET /api/v1/dashboard/overview
export async function getOverview(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const now = new Date();

  const [events, registrations, certificates, teamMembers, upcomingEvents, recentEvents, recentActivity, registrationTrend] =
    await Promise.all([
      db.event.count({ where: { status: { not: "ARCHIVED" } } }),
      db.registration.count({ where: { status: { not: "CANCELLED" } } }),
      db.certificate.count({ where: { status: "ISSUED" } }),
      db.user.count(),
      db.event.findMany({
        where: { status: { notIn: ["ARCHIVED", "COMPLETED"] }, endDateTime: { gte: now } },
        orderBy: { startDateTime: "asc" },
        take: 5,
        select: EVENT_SUMMARY,
      }),
      db.event.findMany({
        where: { status: { not: "ARCHIVED" } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: EVENT_SUMMARY,
      }),
      db.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        // No IP / user agent here: everyone in the org can see the overview.
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
      }),
      monthlyRegistrations(org.id, 6),
    ]);

  return ok(res, {
    organization: {
      id: org.id,
      name: org.name,
      logoUrl: org.logoUrl,
      status: org.status,
      subscriptionEndsAt: org.subscriptionEndsAt,
      msLeft: Math.max(0, org.subscriptionEndsAt.getTime() - now.getTime()),
      plan: org.plan ? { id: org.plan.id, name: org.plan.name } : null,
    },
    totals: { events, registrations, certificates, teamMembers },
    upcomingEvents,
    recentEvents,
    recentActivity,
    registrationTrend,
  });
}

// GET /api/v1/analytics
export async function getAnalytics(req: Request, res: Response) {
  const db = req.db!;
  const orgId = req.org!.id;

  const [eventsByStatus, regsByStatus, viaGroups, categoryGroups, certificatesIssued, regsMonthly, certsMonthly, recentRunEvents, topEvents] =
    await Promise.all([
      db.event.groupBy({ by: ["status"], _count: { _all: true } }),
      db.registration.groupBy({ by: ["status"], _count: { _all: true } }),
      db.registration.groupBy({ by: ["registeredVia"], where: { status: { not: "CANCELLED" } }, _count: { _all: true } }),
      db.registration.groupBy({ by: ["categoryId"], where: { status: { not: "CANCELLED" } }, _count: { _all: true } }),
      db.certificate.count({ where: { status: "ISSUED" } }),
      monthlyRegistrations(orgId, 12),
      monthlyCertificates(orgId, 12),
      db.event.findMany({
        where: { status: { in: ["ONGOING", "COMPLETED"] } },
        orderBy: { startDateTime: "desc" },
        take: 10,
        select: { id: true, title: true, startDateTime: true },
      }),
      db.event.findMany({
        where: { status: { not: "ARCHIVED" } },
        orderBy: { registrations: { _count: "desc" } },
        take: 5,
        select: { id: true, title: true, startDateTime: true, maxAttendees: true, _count: { select: { registrations: true } } },
      }),
    ]);

  // Overall registration numbers
  const byStatus: Record<string, number> = { REGISTERED: 0, ATTENDED: 0, ABSENT: 0, CANCELLED: 0 };
  for (const g of regsByStatus) byStatus[g.status] = g._count._all;
  const activeRegs = (byStatus.REGISTERED ?? 0) + (byStatus.ATTENDED ?? 0) + (byStatus.ABSENT ?? 0);

  // Attendance per recent event
  const runIds = recentRunEvents.map((e) => e.id);
  const perEvent = runIds.length
    ? await db.registration.groupBy({ by: ["eventId", "status"], where: { eventId: { in: runIds } }, _count: { _all: true } })
    : [];
  const attendanceByEvent = recentRunEvents.map((e) => {
    const rows = perEvent.filter((r) => r.eventId === e.id);
    const count = (s: string) => rows.find((r) => r.status === s)?._count._all ?? 0;
    const active = count("REGISTERED") + count("ATTENDED") + count("ABSENT");
    const attended = count("ATTENDED");
    return {
      id: e.id,
      title: e.title,
      startDateTime: e.startDateTime,
      registered: active,
      attended,
      rate: active > 0 ? Math.round((attended / active) * 100) : 0,
    };
  });

  // Categories: merge by label across events (e.g. every event's "VIP")
  const categoryIds = categoryGroups.map((g) => g.categoryId).filter((id): id is string => id !== null);
  const categories = categoryIds.length
    ? await db.eventCategory.findMany({ where: { id: { in: categoryIds } }, select: { id: true, label: true } })
    : [];
  const labelOf = new Map(categories.map((c) => [c.id, c.label]));
  const byLabel = new Map<string, number>();
  for (const g of categoryGroups) {
    const label = g.categoryId ? labelOf.get(g.categoryId) ?? "General" : "General";
    byLabel.set(label, (byLabel.get(label) ?? 0) + g._count._all);
  }
  const categoryBreakdown = [...byLabel.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return ok(res, {
    totals: {
      events: eventsByStatus.reduce((sum, g) => sum + (g.status === "ARCHIVED" ? 0 : g._count._all), 0),
      registrations: activeRegs,
      attended: byStatus.ATTENDED ?? 0,
      attendanceRate: activeRegs > 0 ? Math.round(((byStatus.ATTENDED ?? 0) / activeRegs) * 100) : 0,
      certificatesIssued,
    },
    eventsByStatus: eventsByStatus.map((g) => ({ status: g.status, count: g._count._all })),
    registrationsByStatus: byStatus,
    registeredVia: viaGroups.map((g) => ({ via: g.registeredVia, count: g._count._all })),
    monthlyRegistrations: regsMonthly,
    monthlyCertificates: certsMonthly,
    attendanceByEvent,
    categoryBreakdown,
    topEvents: topEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startDateTime: e.startDateTime,
      maxAttendees: e.maxAttendees,
      registrations: e._count.registrations,
    })),
  });
}