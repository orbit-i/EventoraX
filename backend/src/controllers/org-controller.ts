import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { saveUpload, deleteUpload } from "../utils/storage";
import { logActivity } from "../utils/activity";
import { fieldErrors } from "../utils/validation";
import { EMAIL_REGEX } from "../utils/password";
import bcrypt from "bcrypt";
import { ok, fail } from "../utils/http";
import { deleteUploadFolder } from "../utils/storage";
// Empty string from a form means "clear this field".
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .optional();

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #7c3aed")
  .optional();

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Organization name must be at least 2 characters").max(150).optional(),
  email: z
    .string()
    .trim()
    .max(191)
    .refine((v) => v === "" || EMAIL_REGEX.test(v), "Enter a valid email")
    .transform((v) => (v === "" ? null : v))
    .optional(),
  phone: optionalText(30),
  primaryColor: hexColor,
  accentColor: hexColor,
  signatoryName: optionalText(100),
  signatoryTitle: optionalText(100),
  whiteLabelName: optionalText(100),
  customDomain: optionalText(253),
  notificationPrefs: z
    .object({
      newRegistration: z.boolean(),
      attendance: z.boolean(),
      certificate: z.boolean(),
    })
    .partial()
    .optional(),
});

// GET /api/v1/org/me
export async function getOrgProfile(req: Request, res: Response) {
  return res.json(req.org);
}

// PATCH /api/v1/org/me
export async function updateOrgSettings(req: Request, res: Response) {
  const org = req.org!;
  const parsed = settingsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", fieldErrors: fieldErrors(parsed.error) });
  }

  const { notificationPrefs, ...fields } = parsed.data;

  // Enterprise-only features
  const features = (org.plan?.features ?? {}) as Record<string, unknown>;
  if (fields.whiteLabelName !== undefined && features.whiteLabel !== true) {
    return res.status(403).json({ error: "White label is available on the Enterprise plan", code: "PLAN_FEATURE" });
  }
  if (fields.customDomain !== undefined && features.customDomain !== true) {
    return res.status(403).json({ error: "Custom domains are available on the Enterprise plan", code: "PLAN_FEATURE" });
  }

  const mergedPrefs = notificationPrefs
    ? ({ ...((org.notificationPrefs ?? {}) as Record<string, unknown>), ...notificationPrefs } as Prisma.InputJsonValue)
    : undefined;

  try {
    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: { ...fields, ...(mergedPrefs ? { notificationPrefs: mergedPrefs } : {}) },
      include: { plan: true },
    });

    await logActivity(req, {
      action: "org.settings.update",
      entityType: "Organization",
      entityId: org.id,
      metadata: { fields: Object.keys(parsed.data) },
    });

    return res.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "That custom domain is already in use" });
    }
    throw err;
  }
}

// POST /api/v1/org/me/logo  and  /api/v1/org/me/signature   (multipart, field name: "file")
export function uploadOrgImage(kind: "logo" | "signature") {
  return async (req: Request, res: Response) => {
    const org = req.org!;
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded (form field name must be: file)" });
    }

    const url = await saveUpload(`orgs/${org.id}`, req.file.buffer, req.file.mimetype);

    if (kind === "logo") {
      await deleteUpload(org.logoUrl);
      await prisma.organization.update({ where: { id: org.id }, data: { logoUrl: url } });
    } else {
      await deleteUpload(org.signatureUrl);
      await prisma.organization.update({ where: { id: org.id }, data: { signatureUrl: url } });
    }

    await logActivity(req, { action: `org.${kind}.upload`, entityType: "Organization", entityId: org.id });
    return res.json({ url });
  };
}

   const dangerSchema = z.object({
     confirm: z.string(),
     password: z.string().min(1, "Enter your password"),
   });

   /** Danger-zone actions need the exact organization name AND the admin's password. */
   async function checkDangerConfirmation(req: Request, res: Response): Promise<boolean> {
     const org = req.org!;
     const parsed = dangerSchema.safeParse(req.body ?? {});
     if (!parsed.success) {
       fail(res, 400, "VALIDATION_ERROR", "Enter the organization name and your password");
       return false;
     }
     if (parsed.data.confirm.trim() !== org.name) {
       fail(res, 400, "VALIDATION_ERROR", "The name doesn't match", {
         fieldErrors: { confirm: `Type "${org.name}" exactly` },
       });
       return false;
     }
     const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
     if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
       fail(res, 400, "VALIDATION_ERROR", "Incorrect password", { fieldErrors: { password: "Incorrect password" } });
       return false;
     }
     return true;
   }

   // POST /api/v1/org/me/delete-data  { confirm, password }
   // Deletes every event (with its registrations, tickets, certificates, speakers, sponsors, schedule).
   // Team, settings and billing are kept.
   export async function deleteAllEventData(req: Request, res: Response) {
     if (!(await checkDangerConfirmation(req, res))) return;
     const org = req.org!;

     const result = await prisma.event.deleteMany({ where: { organizationId: org.id } });
     await Promise.all([
       deleteUploadFolder(`orgs/${org.id}/speakers`),
       deleteUploadFolder(`orgs/${org.id}/sponsors`),
     ]);

     await logActivity(req, { action: "org.data.delete", entityType: "Organization", entityId: org.id, metadata: { events: result.count } });
     return ok(res, { deletedEvents: result.count });
   }

   // POST /api/v1/org/me/close  { confirm, password }
   // Permanently deletes the organization, its team and all its data.
   export async function closeOrganization(req: Request, res: Response) {
     if (!(await checkDangerConfirmation(req, res))) return;
     const org = req.org!;

     await prisma.organization.delete({ where: { id: org.id } });
     await deleteUploadFolder(`orgs/${org.id}`);

     // Platform-level record (the org's own log is gone with it).
     await logActivity(req, {
       action: "org.close",
       organizationId: null,
       userId: null,
       entityType: "Organization",
       entityId: org.id,
       metadata: { name: org.name, closedBy: req.user!.email },
     });
     return ok(res, { closed: true });
   }