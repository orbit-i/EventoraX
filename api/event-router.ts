import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { events } from "@db/schema";
import { eq, and, desc, count, like } from "drizzle-orm";

export const eventRouter = createRouter({
  // Create event
  create: authedQuery
    .input(z.object({
      organizationId: z.number(),
      name: z.string().min(2),
      mode: z.enum(["physical", "online", "hybrid"]).default("physical"),
      description: z.string().optional(),
      topic: z.string().optional(),
      categories: z.array(z.string()).optional(),
      venue: z.string().optional(),
      meetingLink: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      organizer: z.string().optional(),
      maxAttendees: z.number().optional(),
      ticketPrice: z.string().optional(),
      certificateTemplateId: z.number().optional(),
      autoIssueCert: z.boolean().optional(),
      registrationOpen: z.boolean().default(true),
      status: z.enum(["draft", "upcoming", "active", "completed", "archived"]).default("draft"),
      image: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { startDate, endDate, ...rest } = input;
      const event = await db.insert(events).values({
        ...rest,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        createdBy: ctx.user.id,
        categories: input.categories || [],
      });
      return event;
    }),

  // Get event by ID
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const event = await db.select().from(events).where(eq(events.id, input.id)).limit(1);
      return event[0] || null;
    }),

  // List events for organization
  list: authedQuery
    .input(z.object({
      organizationId: z.number(),
      status: z.string().optional(),
      mode: z.string().optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const { organizationId, status, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(events.organizationId, organizationId)];
      if (status) conditions.push(eq(events.status, status as any));

      let query;
      if (search) {
        query = db.select().from(events)
          .where(and(...conditions, like(events.name, `%${search}%`)))
          .orderBy(desc(events.createdAt))
          .limit(limit).offset(offset);
      } else {
        query = db.select().from(events)
          .where(and(...conditions))
          .orderBy(desc(events.createdAt))
          .limit(limit).offset(offset);
      }

      const eventList = await query;
      const [totalResult] = await db.select({ count: count() }).from(events).where(and(...conditions));

      return { events: eventList, total: totalResult?.count || 0, page, limit };
    }),

  // Update event
  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      mode: z.enum(["physical", "online", "hybrid"]).optional(),
      description: z.string().optional(),
      topic: z.string().optional(),
      categories: z.array(z.string()).optional(),
      venue: z.string().optional(),
      meetingLink: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      organizer: z.string().optional(),
      maxAttendees: z.number().optional(),
      ticketPrice: z.string().optional(),
      certificateTemplateId: z.number().optional(),
      autoIssueCert: z.boolean().optional(),
      registrationOpen: z.boolean().optional(),
      status: z.enum(["draft", "upcoming", "active", "completed", "archived"]).optional(),
      image: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, startDate, endDate, ...data } = input;
      const updateData: any = { ...data };
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      await db.update(events).set(updateData).where(eq(events.id, id));
      return { success: true };
    }),

  // Delete event
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(events).where(eq(events.id, input.id));
      return { success: true };
    }),

  // Duplicate event
  duplicate: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [event] = await db.select().from(events).where(eq(events.id, input.id)).limit(1);
      if (!event) throw new Error("Event not found");

      const { id: _, createdAt, updatedAt, ...eventData } = event;
      const newEvent = await db.insert(events).values({
        ...eventData,
        name: `${eventData.name} (Copy)`,
        status: "draft",
      });
      return newEvent;
    }),
});
