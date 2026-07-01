import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { registrations } from "@db/schema";
import { eq, and, desc, count, like } from "drizzle-orm";

export const registrationRouter = createRouter({
  // Create registration (public - for event registration)
  create: publicQuery
    .input(z.object({
      eventId: z.number(),
      organizationId: z.number(),
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      department: z.string().optional(),
      rollNo: z.string().optional(),
      category: z.enum(["general", "vip", "speaker", "sponsor", "student", "staff"]).default("general"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const refNo = `REG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const reg = await db.insert(registrations).values({
        ...input,
        refNo,
        status: "registered",
        registeredVia: "web",
      });
      return reg;
    }),

  // Add attendee manually
  addManual: authedQuery
    .input(z.object({
      eventId: z.number(),
      organizationId: z.number(),
      name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      department: z.string().optional(),
      rollNo: z.string().optional(),
      category: z.enum(["general", "vip", "speaker", "sponsor", "student", "staff"]).default("general"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const refNo = `REG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const reg = await db.insert(registrations).values({
        ...input,
        refNo,
        status: "registered",
        registeredVia: "manual",
      });
      return reg;
    }),

  // List registrations for event
  list: authedQuery
    .input(z.object({
      eventId: z.number().optional(),
      organizationId: z.number(),
      status: z.string().optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const { organizationId, eventId, status, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(registrations.organizationId, organizationId)];
      if (eventId) conditions.push(eq(registrations.eventId, eventId));
      if (status) conditions.push(eq(registrations.status, status as any));

      let query;
      if (search) {
        query = db.select().from(registrations)
          .where(and(...conditions, like(registrations.name, `%${search}%`)))
          .orderBy(desc(registrations.createdAt))
          .limit(limit).offset(offset);
      } else {
        query = db.select().from(registrations)
          .where(and(...conditions))
          .orderBy(desc(registrations.createdAt))
          .limit(limit).offset(offset);
      }

      const list = await query;
      const [totalResult] = await db.select({ count: count() }).from(registrations).where(and(...conditions));

      return { registrations: list, total: totalResult?.count || 0, page, limit };
    }),

  // Update registration status (mark attendance)
  updateStatus: authedQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["registered", "attended", "absent", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(registrations).set({ status: input.status }).where(eq(registrations.id, input.id));
      return { success: true };
    }),

  // Bulk update status
  bulkUpdateStatus: authedQuery
    .input(z.object({
      ids: z.array(z.number()),
      status: z.enum(["registered", "attended", "absent", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      for (const id of input.ids) {
        await db.update(registrations).set({ status: input.status }).where(eq(registrations.id, id));
      }
      return { success: true };
    }),

  // Delete registration
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(registrations).where(eq(registrations.id, input.id));
      return { success: true };
    }),
});
