import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { speakers } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const speakerRouter = createRouter({
  create: authedQuery
    .input(z.object({
      eventId: z.number(),
      organizationId: z.number(),
      name: z.string(),
      title: z.string().optional(),
      company: z.string().optional(),
      topic: z.string().optional(),
      bio: z.string().optional(),
      photo: z.string().optional(),
      linkedIn: z.string().optional(),
      displayOrder: z.number().default(0),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const speaker = await db.insert(speakers).values(input);
      return speaker;
    }),

  list: publicQuery
    .input(z.object({ eventId: z.number(), organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(speakers)
        .where(and(eq(speakers.eventId, input.eventId), eq(speakers.organizationId, input.organizationId)))
        .orderBy(speakers.displayOrder);
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      title: z.string().optional(),
      company: z.string().optional(),
      topic: z.string().optional(),
      bio: z.string().optional(),
      photo: z.string().optional(),
      linkedIn: z.string().optional(),
      displayOrder: z.number().optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(speakers).set(data).where(eq(speakers.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(speakers).where(eq(speakers.id, input.id));
      return { success: true };
    }),
});
