import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { organizations, organizationMembers, plans } from "@db/schema";
import { eq, desc, count } from "drizzle-orm";

export const orgRouter = createRouter({
  // Create organization (on registration)
  create: publicQuery
    .input(z.object({
      name: z.string().min(2),
      slug: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      planId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // Get default plan (Pro)
      const defaultPlan = await db.select().from(plans).where(eq(plans.slug, "pro")).limit(1);
      const planId = input.planId || defaultPlan[0]?.id;

      const org = await db.insert(organizations).values({
        ...input,
        planId,
        trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day trial
        status: "trial",
      });
      return org;
    }),

  // Get organization by ID
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const org = await db.select().from(organizations).where(eq(organizations.id, input.id)).limit(1);
      return org[0] || null;
    }),

  // Get organization by slug
  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const org = await db.select().from(organizations).where(eq(organizations.slug, input.slug)).limit(1);
      return org[0] || null;
    }),

  // Get current user's organizations
  myOrgs: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;
    const memberships = await db
      .select({
        org: organizations,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, userId));
    return memberships;
  }),

  // Update organization
  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      logo: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      primaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      whiteLabelName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(organizations).set(data).where(eq(organizations.id, id));
      return { success: true };
    }),

  // List all organizations (admin)
  list: adminQuery
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

      const orgs = await db.select().from(organizations)
        .where(input?.status ? eq(organizations.status, input.status as any) : undefined)
        .orderBy(desc(organizations.createdAt))
        .limit(limit).offset(offset);

      const [totalResult] = await db.select({ count: count() }).from(organizations);
      const total = totalResult?.count || 0;

      return { orgs, total, page, limit };
    }),

  // Get dashboard stats for an org
  dashboardStats: authedQuery
    .input(z.object({ orgId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const { orgId } = input;

      // Import related tables inline to avoid circular deps
      const { events, registrations, certificates, organizationMembers } = await import("@db/schema");

      const [eventsCount] = await db.select({ count: count() }).from(events).where(eq(events.organizationId, orgId));
      const [regsCount] = await db.select({ count: count() }).from(registrations).where(eq(registrations.organizationId, orgId));
      const [certsCount] = await db.select({ count: count() }).from(certificates).where(eq(certificates.organizationId, orgId));
      const [teamCount] = await db.select({ count: count() }).from(organizationMembers).where(eq(organizationMembers.organizationId, orgId));

      return {
        totalEvents: eventsCount?.count || 0,
        totalRegistrations: regsCount?.count || 0,
        totalCertificates: certsCount?.count || 0,
        totalTeamMembers: teamCount?.count || 0,
      };
    }),
});
