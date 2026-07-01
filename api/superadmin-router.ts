import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { organizations, plans, payments, users, certificates, activityLogs } from "@db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export const superadminRouter = createRouter({
  // Dashboard stats
  dashboardStats: adminQuery.query(async () => {
    const db = getDb();

    const [totalOrgs] = await db.select({ count: count() }).from(organizations);
    const [trialOrgs] = await db.select({ count: count() }).from(organizations).where(eq(organizations.status, "trial"));
    const [activeOrgs] = await db.select({ count: count() }).from(organizations).where(eq(organizations.status, "active"));
    const [expiredOrgs] = await db.select({ count: count() }).from(organizations).where(eq(organizations.status, "expired"));
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalCerts] = await db.select({ count: count() }).from(certificates);

    // Revenue
    const [revenueResult] = await db.select({
      total: sql`COALESCE(SUM(${payments.amount}), 0)`,
    }).from(payments).where(eq(payments.status, "completed"));

    return {
      totalOrganizations: totalOrgs?.count || 0,
      trialOrganizations: trialOrgs?.count || 0,
      activeOrganizations: activeOrgs?.count || 0,
      expiredOrganizations: expiredOrgs?.count || 0,
      totalUsers: totalUsers?.count || 0,
      totalCertificates: totalCerts?.count || 0,
      totalRevenue: Number(revenueResult?.total) || 0,
    };
  }),

  // Tenant management
  listTenants: adminQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      let query;
      if (input?.status) {
        query = db.select().from(organizations)
          .where(eq(organizations.status, input.status as any))
          .orderBy(desc(organizations.createdAt))
          .limit(limit).offset(offset);
      } else {
        query = db.select().from(organizations)
          .orderBy(desc(organizations.createdAt))
          .limit(limit).offset(offset);
      }

      const orgs = await query;
      const [totalResult] = await db.select({ count: count() }).from(organizations);

      return { tenants: orgs, total: totalResult?.count || 0, page, limit };
    }),

  // Update tenant status
  updateTenant: adminQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["trial", "active", "expired", "suspended"]).optional(),
      planId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(organizations).set(data).where(eq(organizations.id, id));
      return { success: true };
    }),

  // Plans management
  listPlans: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(plans).orderBy(plans.price);
  }),

  createPlan: adminQuery
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      price: z.string(),
      billingPeriod: z.enum(["monthly", "yearly"]).default("yearly"),
      maxAdmins: z.number().default(3),
      maxManagers: z.number().default(7),
      features: z.array(z.string()).optional(),
      isActive: z.boolean().default(true),
      trialDays: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const plan = await db.insert(plans).values(input);
      return plan;
    }),

  updatePlan: adminQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      price: z.string().optional(),
      maxAdmins: z.number().optional(),
      maxManagers: z.number().optional(),
      isActive: z.boolean().optional(),
      isVisible: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(plans).set(data).where(eq(plans.id, id));
      return { success: true };
    }),

  // Revenue
  revenueList: adminQuery
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page || 1;
      const limit = input?.limit || 50;
      const offset = (page - 1) * limit;

      const list = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(limit).offset(offset);
      const [totalResult] = await db.select({ count: count() }).from(payments);

      return { payments: list, total: totalResult?.count || 0, page, limit };
    }),

  // Users list
  listUsers: adminQuery
    .input(z.object({
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page || 1;
      const limit = input?.limit || 50;
      const offset = (page - 1) * limit;

      const userList = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
      const [totalResult] = await db.select({ count: count() }).from(users);

      return { users: userList, total: totalResult?.count || 0, page, limit };
    }),

  // Activity logs
  activityLogs: adminQuery
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page || 1;
      const limit = input?.limit || 50;
      const offset = (page - 1) * limit;

      const logs = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit).offset(offset);
      const [totalResult] = await db.select({ count: count() }).from(activityLogs);

      return { logs, total: totalResult?.count || 0, page, limit };
    }),
});
