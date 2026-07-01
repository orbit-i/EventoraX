import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { certificates } from "@db/schema";
import { eq, and, desc, count, like } from "drizzle-orm";
import crypto from "crypto";

export const certificateRouter = createRouter({
  // Generate certificate
  create: authedQuery
    .input(z.object({
      eventId: z.number(),
      organizationId: z.number(),
      registrationId: z.number(),
      name: z.string(),
      email: z.string().email(),
      eventName: z.string(),
      organizationName: z.string(),
      category: z.string().optional(),
      issueDate: z.string(),
      templateId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const verifyCode = crypto.randomBytes(16).toString("hex");
      const sha256Hash = crypto.createHash("sha256").update(`${input.name}-${input.eventName}-${Date.now()}`).digest("hex");

      const { issueDate, ...rest } = input;
      const cert = await db.insert(certificates).values({
        ...rest,
        issueDate: new Date(issueDate),
        verifyCode,
        sha256Hash,
        status: "active",
      });
      return { cert, verifyCode };
    }),

  // Verify certificate (public)
  verify: publicQuery
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [cert] = await db.select().from(certificates).where(eq(certificates.verifyCode, input.code)).limit(1);
      if (!cert) return { valid: false, cert: null };
      return { valid: cert.status === "active", cert };
    }),

  // List certificates for org
  list: authedQuery
    .input(z.object({
      organizationId: z.number(),
      eventId: z.number().optional(),
      status: z.string().optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const { organizationId, eventId, status, search, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions = [eq(certificates.organizationId, organizationId)];
      if (eventId) conditions.push(eq(certificates.eventId, eventId));
      if (status) conditions.push(eq(certificates.status, status as any));

      let query;
      if (search) {
        query = db.select().from(certificates)
          .where(and(...conditions, like(certificates.name, `%${search}%`)))
          .orderBy(desc(certificates.createdAt))
          .limit(limit).offset(offset);
      } else {
        query = db.select().from(certificates)
          .where(and(...conditions))
          .orderBy(desc(certificates.createdAt))
          .limit(limit).offset(offset);
      }

      const list = await query;
      const [totalResult] = await db.select({ count: count() }).from(certificates).where(and(...conditions));

      return { certificates: list, total: totalResult?.count || 0, page, limit };
    }),

  // Revoke certificate
  revoke: authedQuery
    .input(z.object({ id: z.number(), reason: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(certificates).set({
        status: "revoked",
        revokeReason: input.reason,
      }).where(eq(certificates.id, input.id));
      return { success: true };
    }),

  // Increment download count
  incrementDownload: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [cert] = await db.select().from(certificates).where(eq(certificates.id, input.id)).limit(1);
      if (cert) {
        await db.update(certificates).set({
          downloadCount: (cert.downloadCount || 0) + 1,
        }).where(eq(certificates.id, input.id));
      }
      return { success: true };
    }),
});
