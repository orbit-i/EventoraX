import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sponsors } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const sponsorRouter = createRouter({
  create: authedQuery
    .input(z.object({
      eventId: z.number(),
      organizationId: z.number(),
      name: z.string(),
      logo: z.string().optional(),
      website: z.string().optional(),
      tier: z.enum(["platinum", "gold", "silver", "bronze"]).default("bronze"),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const sponsor = await db.insert(sponsors).values(input);
      return sponsor;
    }),

  list: publicQuery
    .input(z.object({ eventId: z.number(), organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(sponsors)
        .where(and(eq(sponsors.eventId, input.eventId), eq(sponsors.organizationId, input.organizationId)))
        .orderBy(sponsors.tier);
    }),

  update: authedQuery
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      logo: z.string().optional(),
      website: z.string().optional(),
      tier: z.enum(["platinum", "gold", "silver", "bronze"]).optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(sponsors).set(data).where(eq(sponsors.id, id));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(sponsors).where(eq(sponsors.id, input.id));
      return { success: true };
    }),
});
