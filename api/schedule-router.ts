import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { schedules } from "@db/schema";
import { eq, and, asc } from "drizzle-orm";

export const scheduleRouter = createRouter({
  create: authedQuery
    .input(z.object({
      eventId: z.number(),
      organizationId: z.number(),
      title: z.string(),
      speakerId: z.number().optional(),
      speakerName: z.string().optional(),
      timeStart: z.string(),
      timeEnd: z.string(),
      location: z.string().optional(),
      description: z.string().optional(),
      displayOrder: z.number().default(0),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const session = await db.insert(schedules).values(input);
      return session;
    }),

  list: publicQuery
    .input(z.object({ eventId: z.number(), organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(schedules)
        .where(and(eq(schedules.eventId, input.eventId), eq(schedules.organizationId, input.organizationId)))
        .orderBy(asc(schedules.displayOrder), asc(schedules.timeStart));
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      speakerId: z.number().optional(),
      speakerName: z.string().optional(),
      timeStart: z.string().optional(),
      timeEnd: z.string().optional(),
      location: z.string().optional(),
      description: z.string().optional(),
      displayOrder: z.number().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(schedules).set(data).where(eq(schedules.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(schedules).where(eq(schedules.id, input.id));
      return { success: true };
    }),
});
