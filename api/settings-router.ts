import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { systemSettings, emailTemplates, announcements } from "@db/schema";
import { eq, desc, count } from "drizzle-orm";

export const settingsRouter = createRouter({
  // System settings
  getSetting: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, input.key)).limit(1);
      return setting?.value || null;
    }),

  getSettingsByCategory: publicQuery
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.select().from(systemSettings).where(eq(systemSettings.category, input.category));
    }),

  setSetting: adminQuery
    .input(z.object({ key: z.string(), value: z.string(), category: z.string().default("general") }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, input.key)).limit(1);
      if (existing[0]) {
        await db.update(systemSettings).set({ value: input.value }).where(eq(systemSettings.key, input.key));
      } else {
        await db.insert(systemSettings).values(input);
      }
      return { success: true };
    }),

  // Email templates
  listEmailTemplates: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(emailTemplates).orderBy(emailTemplates.name);
  }),

  updateEmailTemplate: adminQuery
    .input(z.object({
      id: z.number(),
      subject: z.string().optional(),
      bodyHtml: z.string().optional(),
      bodyText: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(emailTemplates).set(data).where(eq(emailTemplates.id, id));
      return { success: true };
    }),

  // Announcements
  listAnnouncements: adminQuery
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      const list = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(limit).offset(offset);
      const [totalResult] = await db.select({ count: count() }).from(announcements);

      return { announcements: list, total: totalResult?.count || 0, page, limit };
    }),

  createAnnouncement: adminQuery
    .input(z.object({
      title: z.string(),
      message: z.string(),
      target: z.enum(["all", "pro", "enterprise", "specific"]).default("all"),
      isEmail: z.boolean().default(true),
      isInApp: z.boolean().default(true),
      scheduledAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { scheduledAt, ...rest } = input;
      const announcement = await db.insert(announcements).values({
        ...rest,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: ctx.user.id,
        status: scheduledAt ? "scheduled" : "sent",
      });
      return announcement;
    }),
});
