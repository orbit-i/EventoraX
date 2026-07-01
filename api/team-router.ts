import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { organizationMembers, users, organizations } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const teamRouter = createRouter({
  // List team members
  list: authedQuery
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const members = await db
        .select({
          member: organizationMembers,
          user: users,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, input.organizationId))
        .orderBy(desc(organizationMembers.joinedAt));
      return members;
    }),

  // Invite member (mock - would send email in real app)
  invite: authedQuery
    .input(z.object({
      organizationId: z.number(),
      email: z.string().email(),
      role: z.enum(["admin", "manager", "viewer"]).default("manager"),
    }))
    .mutation(async ({ input }) => {
      // In real app, this would create an invitation and send email
      // For now, we just return success
      return { success: true, message: `Invitation sent to ${input.email}` };
    }),

  // Update member role
  updateRole: authedQuery
    .input(z.object({
      memberId: z.number(),
      role: z.enum(["admin", "manager", "viewer"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(organizationMembers).set({ role: input.role }).where(eq(organizationMembers.id, input.memberId));
      return { success: true };
    }),

  // Remove member
  remove: authedQuery
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(organizationMembers).where(eq(organizationMembers.id, input.memberId));
      return { success: true };
    }),

  // Get plan limits
  planLimits: authedQuery
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [org] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
      if (!org?.planId) return { maxAdmins: 3, maxManagers: 7 };

      const { plans } = await import("@db/schema");
      const [plan] = await db.select().from(plans).where(eq(plans.id, org.planId)).limit(1);
      return {
        maxAdmins: plan?.maxAdmins || 3,
        maxManagers: plan?.maxManagers || 7,
      };
    }),
});
