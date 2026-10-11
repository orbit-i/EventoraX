import { Request, Response } from "express";
import { z } from "zod";
import { EmailTemplateType } from "@prisma/client";
import prisma from "../../prisma/client";
import { ok, fail, validationFail } from "../../utils/http";
import { isOneOf } from "../../utils/schemas";
import { logActivity } from "../../utils/activity";
import { getSetting, setSetting } from "../../utils/settings";
import { TEMPLATE_DEFINITIONS, TEMPLATE_TYPES, definitionOf, sampleVars } from "../../utils/emailTemplates";
import { mailStatus, renderEmail, sendMail, verifyMailTransport, type SmtpSettings } from "../../utils/mail";
import { encryptSecret } from "../../utils/secrets";

function typeParam(req: Request): EmailTemplateType | null {
  const t = String(req.params.type ?? "").toUpperCase();
  return isOneOf(TEMPLATE_TYPES, t) ? t : null;
}

// GET /api/v1/superadmin/emails   (every template: default or edited, with its variables)
export async function listTemplates(_req: Request, res: Response) {
  const rows = await prisma.emailTemplate.findMany();
  const byType = new Map(rows.map((r) => [r.type, r]));
  const editorIds = [...new Set(rows.map((r) => r.updatedById).filter((x): x is string => Boolean(x)))];
  const editors = editorIds.length ? await prisma.user.findMany({ where: { id: { in: editorIds } }, select: { id: true, name: true } }) : [];
  const editorName = new Map(editors.map((e) => [e.id, e.name]));
  return ok(
    res,
    TEMPLATE_DEFINITIONS.map((d) => {
      const row = byType.get(d.type);
      return {
        type: d.type,
        name: d.name,
        description: d.description,
        usedFor: d.usedFor,
        variables: d.variables,
        subject: row?.subject ?? d.subject,
        bodyHtml: row?.bodyHtml ?? d.bodyHtml,
        defaultSubject: d.subject,
        defaultBodyHtml: d.bodyHtml,
        isCustom: Boolean(row),
        updatedAt: row?.updatedAt ?? null,
        updatedBy: row?.updatedById ? editorName.get(row.updatedById) ?? null : null,
      };
    })
  );
}

const templateSchema = z.object({
  subject: z.string({ error: "Write a subject" }).trim().min(2, "Write a subject").max(200),
  bodyHtml: z.string({ error: "Write the email" }).trim().min(10, "The email is too short").max(50_000, "The email is too long"),
});

// PUT /api/v1/superadmin/emails/:type   { subject, bodyHtml }
export async function saveTemplate(req: Request, res: Response) {
  const type = typeParam(req);
  if (!type) return fail(res, 404, "NOT_FOUND", "Unknown email template");
  const parsed = templateSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const data = { ...parsed.data, updatedById: req.user!.userId };
  const row = await prisma.emailTemplate.upsert({ where: { type }, update: data, create: { type, ...data } });
  await logActivity(req, { action: "email.template.update", entityType: "EmailTemplate", entityId: row.id, metadata: { name: definitionOf(type).name } });
  return ok(res, { type, subject: row.subject, bodyHtml: row.bodyHtml, isCustom: true, updatedAt: row.updatedAt });
}

// DELETE /api/v1/superadmin/emails/:type   (back to the built-in default)
export async function resetTemplate(req: Request, res: Response) {
  const type = typeParam(req);
  if (!type) return fail(res, 404, "NOT_FOUND", "Unknown email template");
  await prisma.emailTemplate.deleteMany({ where: { type } });
  await logActivity(req, { action: "email.template.reset", metadata: { name: definitionOf(type).name } });
  const d = definitionOf(type);
  return ok(res, { type, subject: d.subject, bodyHtml: d.bodyHtml, isCustom: false, updatedAt: null });
}

// POST /api/v1/superadmin/emails/:type/preview   { subject, bodyHtml }  → filled with sample values (unsaved edits too)
export async function previewTemplate(req: Request, res: Response) {
  const type = typeParam(req);
  if (!type) return fail(res, 404, "NOT_FOUND", "Unknown email template");
  const parsed = templateSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  return ok(res, await renderEmail(type, sampleVars(type), parsed.data));
}

// POST /api/v1/superadmin/emails/:type/test   { subject, bodyHtml }  → sends the preview to the superadmin's own email
export async function sendTestTemplate(req: Request, res: Response) {
  const type = typeParam(req);
  if (!type) return fail(res, 404, "NOT_FOUND", "Unknown email template");
  const parsed = templateSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const { subject, html } = await renderEmail(type, sampleVars(type), parsed.data);
  try {
    await sendMail(req.user!.email, `[Test] ${subject}`, html);
  } catch (err) {
    return fail(res, 502, "SEND_FAILED", `The email server refused it: ${err instanceof Error ? err.message : "unknown error"}`);
  }
  await logActivity(req, { action: "email.template.test", metadata: { name: definitionOf(type).name } });
  const status = await mailStatus();
  return ok(res, { sentTo: req.user!.email, mode: status.mode });
}

// ─────────────────────────── SMTP ───────────────────────────

// GET /api/v1/superadmin/smtp   (the password is never sent back)
export async function getSmtp(_req: Request, res: Response) {
  const s = await getSetting<Partial<SmtpSettings> | null>("smtp", null);
  return ok(res, {
    host: s?.host ?? "",
    port: s?.port ?? 587,
    user: s?.user ?? "",
    from: s?.from ?? "",
    hasPassword: Boolean(s?.pass),
    status: await mailStatus(),
  });
}

const smtpSchema = z.object({
  host: z.string().trim().min(3, "Enter the SMTP server, e.g. smtp.gmail.com").max(200),
  port: z.coerce.number({ error: "Enter the port" }).int().min(1, "Enter a valid port").max(65535, "Enter a valid port"),
  user: z.string().trim().min(1, "Enter the username").max(200),
  pass: z.string().max(200).optional(), // empty / missing = keep the saved one
  from: z.string().trim().max(200).optional(),
});

// PUT /api/v1/superadmin/smtp   { host, port, user, pass?, from? }
export async function saveSmtp(req: Request, res: Response) {
  const parsed = smtpSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const current = await getSetting<Partial<SmtpSettings> | null>("smtp", null);
  // A new password is encrypted before saving; an empty field keeps the one already saved (already encrypted).
  const pass = parsed.data.pass ? encryptSecret(parsed.data.pass) : current?.pass || "";
  if (!pass) return fail(res, 400, "VALIDATION_ERROR", "Enter the password", { fieldErrors: { pass: "Enter the password (an app password for Gmail)" } });
  await setSetting("smtp", { host: parsed.data.host, port: parsed.data.port, user: parsed.data.user, pass, from: parsed.data.from ?? "" });
  await logActivity(req, { action: "email.smtp.update", metadata: { host: parsed.data.host, user: parsed.data.user } });
  return ok(res, { saved: true, status: await mailStatus() });
}

// DELETE /api/v1/superadmin/smtp   (forget the saved server → back to backend/.env)
export async function clearSmtp(req: Request, res: Response) {
  await setSetting("smtp", {});
  await logActivity(req, { action: "email.smtp.clear" });
  return ok(res, { saved: true, status: await mailStatus() });
}

// POST /api/v1/superadmin/smtp/verify   (logs in to the server; sends nothing)
export async function verifySmtp(_req: Request, res: Response) {
  return ok(res, await verifyMailTransport());
}
