import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tickets } from "@db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export const ticketRouter = createRouter({
  // Create ticket (auto-generated on registration)
  create: authedQuery
    .input(z.object({
      eventId: z.number(),
      organizationId: z.number(),
      registrationId: z.number(),
      attendeeName: z.string(),
      eventName: z.string(),
      type: z.enum(["free", "paid", "vip"]).default("free"),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const ticketNo = `TIX-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const ticket = await db.insert(tickets).values({
        ...input,
        ticketNo,
        isUsed: false,
      });
      return { ticket, ticketNo };
    }),

  // List tickets for org/event
  list: authedQuery
    .input(z.object({
      organizationId: z.number(),
      eventId: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const { organizationId, eventId, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(tickets.organizationId, organizationId)];
      if (eventId) conditions.push(eq(tickets.eventId, eventId));

      const list = await db.select().from(tickets)
        .where(and(...conditions))
        .orderBy(desc(tickets.createdAt))
        .limit(limit).offset(offset);

      const [totalResult] = await db.select({ count: count() }).from(tickets).where(and(...conditions));

      return { tickets: list, total: totalResult?.count || 0, page, limit };
    }),

  // Scan QR ticket (public)
  scan: publicQuery
    .input(z.object({ ticketNo: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketNo, input.ticketNo)).limit(1);
      if (!ticket) return { found: false, message: "Ticket not found" };
      if (ticket.isUsed) return { found: true, used: true, message: "Ticket already used" };

      await db.update(tickets).set({ isUsed: true, usedAt: new Date() }).where(eq(tickets.id, ticket.id));
      return { found: true, used: false, message: "Ticket validated", ticket };
    }),

  // Get ticket by number (public)
  getByNumber: publicQuery
    .input(z.object({ ticketNo: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketNo, input.ticketNo)).limit(1);
      return ticket || null;
    }),
});
