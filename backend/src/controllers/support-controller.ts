import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../prisma/client";
import { ok, validationFail } from "../utils/http";
import { EMAIL_REGEX } from "../utils/password";
import { optionalText } from "../utils/schemas";
import { getSetting } from "../utils/settings";
import { logActivity } from "../utils/activity";
import { sendMail, escapeHtml } from "../utils/mail";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => EMAIL_REGEX.test(v), "Enter a valid email address");
const messageField = z.string().trim().min(10, "Please write at least a sentence (10+ characters)").max(5000);

/** Emails the platform team, if a contact email is configured. Never throws. */
async function notifyTeam(subject: string, lines: string[]) {
  const to = await getSetting<string>("contact.email", "");
  if (!to) return;
  const html = lines.map((l) => `<p>${escapeHtml(l).replace(/\n/g, "<br>")}</p>`).join("");
  await sendMail(to, subject, html).catch((err) => console.error("Contact notification failed:", err));
}

// GET /api/v1/contact/info   (public — shown on both contact pages; empty values are simply hidden)
export async function contactInfo(_req: Request, res: Response) {
  const [email, whatsapp, hours] = await Promise.all([
    getSetting<string>("contact.email", ""),
    getSetting<string>("contact.whatsapp", ""),
    getSetting<string>("contact.hours", ""),
  ]);
  return ok(res, { email, whatsapp, hours });
}

const publicSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(150),
  email: emailField,
  organization: optionalText(150),
  message: messageField,
});

// POST /api/v1/contact   (public website form — rate-limited in the route)
export async function publicContact(req: Request, res: Response) {
  const parsed = publicSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const { name, email, organization, message } = parsed.data;

  await prisma.contactMessage.create({
    data: { name, email, orgName: organization, message, source: "PUBLIC" },
  });
  await notifyTeam(`New website message from ${name}`, [
    `From: ${name} <${email}>`,
    organization ? `Organization: ${organization}` : "",
    message,
  ]);

  return ok(res, { message: "Thanks! We'll get back to you within one working day." }, 201);
}

const supportSchema = z.object({
  subject: z.string().trim().min(3, "Add a short subject").max(150),
  message: messageField,
});

// POST /api/v1/support   (dashboard "Contact us" — sender details come from the login)
export async function dashboardSupport(req: Request, res: Response) {
  const parsed = supportSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const { subject, message } = parsed.data;
  const user = req.user!;
  const org = req.org!;

  const saved = await prisma.contactMessage.create({
    data: {
      organizationId: org.id,
      name: user.name,
      email: user.email,
      orgName: org.name,
      message: `Subject: ${subject}\n\n${message}`,
      source: "DASHBOARD",
    },
  });

  await notifyTeam(`Support request: ${subject}`, [
    `From: ${user.name} <${user.email}> — ${org.name} (${org.plan?.name ?? "no plan"}, ${org.status})`,
    message,
  ]);
  await logActivity(req, { action: "support.request", entityType: "ContactMessage", entityId: saved.id });

  return ok(res, { message: "Your message was sent. We usually reply within one working day." }, 201);
}