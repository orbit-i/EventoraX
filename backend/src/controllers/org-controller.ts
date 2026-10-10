import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import prisma from "../prisma/client";
import { deleteUpload, deleteUploadFolder } from "../utils/storage";
import { logActivity } from "../utils/activity";
import { EMAIL_REGEX } from "../utils/password";
import { optionalImage, isUniqueViolation } from "../utils/schemas";
import { ok, fail, validationFail } from "../utils/http";

// Empty string from a form means "clear this field".
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((v) => (v === "" ? null : v))
    .optional();

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #7c3aed")
  .optional();

const HOSTNAME = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

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
  logoUrl: optionalImage.optional(),
  signatureUrl: optionalImage.optional(),
  primaryColor: hexColor,
  accentColor: hexColor,
  signatoryName: optionalText(100),
  signatoryTitle: optionalText(100),
  whiteLabelName: optionalText(100),
  customDomain: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v.replace(/^https?:\/\//, "").replace(/\/+$/, ""))
    .refine((v) => v === "" || HOSTNAME.test(v), "Enter a domain like events.university.edu.pk (no http://)")
    .transform((v) => (v === "" ? null : v))
    .optional(),
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
  return ok(res, req.org);
}

// PATCH /api/v1/org/me   (any subset of the settings fields)
export async function updateOrgSettings(req: Request, res: Response) {
  const org = req.org!;
  const parsed = settingsSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const { notificationPrefs, ...fields } = parsed.data;

  // Enterprise-only features (sending the current empty value is fine).
  const features = (org.plan?.features ?? {}) as Record<string, unknown>;
  if (fields.whiteLabelName !== undefined && fields.whiteLabelName !== org.whiteLabelName && features.whiteLabel !== true) {
    return fail(res, 403, "PLAN_FEATURE", "White label is available on the Enterprise plan", {
      fieldErrors: { whiteLabelName: "Available on the Enterprise plan" },
    });
  }
  if (fields.customDomain !== undefined && fields.customDomain !== org.customDomain && features.customDomain !== true) {
    return fail(res, 403, "PLAN_FEATURE", "Custom domains are available on the Enterprise plan", {
      fieldErrors: { customDomain: "Available on the Enterprise plan" },
    });
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

    // Replaced or removed images: delete the old files we stored.
    if (fields.logoUrl !== undefined && fields.logoUrl !== org.logoUrl) await deleteUpload(org.logoUrl);
    if (fields.signatureUrl !== undefined && fields.signatureUrl !== org.signatureUrl) await deleteUpload(org.signatureUrl);

    await logActivity(req, {
      action: "org.settings.update",
      entityType: "Organization",
      entityId: org.id,
      metadata: { fields: Object.keys(parsed.data) },
    });

    return ok(res, updated);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return fail(res, 409, "DOMAIN_TAKEN", "That custom domain is already in use", {
        fieldErrors: { customDomain: "Another organization already uses this domain" },
      });
    }
    throw err;
  }
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