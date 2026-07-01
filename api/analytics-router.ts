import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { events, registrations, certificates } from "@db/schema";
import { eq, and, count, sql } from "drizzle-orm";

export const analyticsRouter = createRouter({
  // Get org dashboard analytics
  orgStats: authedQuery
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const { organizationId } = input;

      const [eventCount] = await db.select({ count: count() }).from(events).where(eq(events.organizationId, organizationId));
      const [regCount] = await db.select({ count: count() }).from(registrations).where(eq(registrations.organizationId, organizationId));
      const [certCount] = await db.select({ count: count() }).from(certificates).where(eq(certificates.organizationId, organizationId));
      const [attendedCount] = await db.select({ count: count() }).from(registrations).where(
        and(eq(registrations.organizationId, organizationId), eq(registrations.status, "attended"))
      );

      // Events by status
      const eventsByStatus = await db
        .select({ status: events.status, count: count() })
        .from(events)
        .where(eq(events.organizationId, organizationId))
        .groupBy(events.status);

      // Monthly registrations (last 6 months)
      const monthlyRegs = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const [result] = await db.select({ count: count() }).from(registrations).where(
          and(
            eq(registrations.organizationId, organizationId),
            sql`${registrations.createdAt} >= ${monthStart}`,
            sql`${registrations.createdAt} <= ${monthEnd}`
          )
        );
        monthlyRegs.push({
          month: date.toLocaleString("en-US", { month: "short", year: "numeric" }),
          count: result?.count || 0,
        });
      }

      return {
        totalEvents: eventCount?.count || 0,
        totalRegistrations: regCount?.count || 0,
        totalCertificates: certCount?.count || 0,
        totalAttended: attendedCount?.count || 0,
        attendanceRate: regCount?.count ? Math.round(((attendedCount?.count || 0) / regCount.count) * 100) : 0,
        eventsByStatus,
        monthlyRegistrations: monthlyRegs,
      };
    }),

  // Superadmin platform stats
  platformStats: authedQuery.query(async () => {
    const db = getDb();
    const { organizations } = await import("@db/schema");

    const [orgCount] = await db.select({ count: count() }).from(organizations);
    const [eventCount] = await db.select({ count: count() }).from(events);
    const [regCount] = await db.select({ count: count() }).from(registrations);
    const [certCount] = await db.select({ count: count() }).from(certificates);

    return {
      totalOrganizations: orgCount?.count || 0,
      totalEvents: eventCount?.count || 0,
      totalRegistrations: regCount?.count || 0,
      totalCertificates: certCount?.count || 0,
    };
  }),
});
