import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { EmailTemplateType } from "@prisma/client";
import { getSetting, setSetting } from "./settings";
import { decryptSecret, encryptSecret, isEncrypted } from "./secrets";
import { escapeHtml, fill, loadTemplate } from "./emailTemplates";

export { escapeHtml };

// ─────────────────────────── Transport ───────────────────────────
// SMTP comes from System settings → Email (if filled in), otherwise from backend/.env (EMAIL_*).
// With neither, emails are printed to the terminal as "DEV EMAIL" so links can still be tested.

export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

let cached: { key: string; transporter: Transporter } | null = null;

async function smtpConfig(): Promise<(SmtpSettings & { source: "settings" | "env" }) | null> {
  const s = await getSetting<Partial<SmtpSettings> | null>("smtp", null);
  if (s?.host && s.user && s.pass) {
    // A password saved before encryption existed is encrypted the first time it's read.
    if (!isEncrypted(s.pass)) await setSetting("smtp", { ...s, pass: encryptSecret(s.pass) } as never);
    let pass: string;
    try {
      pass = decryptSecret(s.pass);
    } catch {
      console.error("The saved SMTP password can't be decrypted (was ENCRYPTION_KEY / JWT_SECRET changed?). Enter it again in Superadmin → Email templates → SMTP server.");
      pass = "";
    }
    if (pass) return { host: s.host, port: Number(s.port) || 587, user: s.user, pass, from: s.from || `"EventoraX" <${s.user}>`, source: "settings" };
  }
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 587),
    user,
    pass,
    from: process.env.EMAIL_FROM || `"EventoraX" <${user}>`,
    source: "env",
  };
}

async function getTransporter() {
  const cfg = await smtpConfig();
  if (!cfg) return null;
  const key = `${cfg.host}|${cfg.port}|${cfg.user}|${cfg.pass}`;
  if (!cached || cached.key !== key) {
    cached = {
      key,
      transporter: nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.port === 465, auth: { user: cfg.user, pass: cfg.pass } }),
    };
  }
  return { transporter: cached.transporter, from: cfg.from, source: cfg.source };
}

/** Where emails go right now (for the Email and Maintenance pages). */
export async function mailStatus(): Promise<{ mode: "settings" | "env" | "console"; host: string | null; user: string | null }> {
  const cfg = await smtpConfig();
  return cfg ? { mode: cfg.source, host: cfg.host, user: cfg.user } : { mode: "console", host: null, user: null };
}

/** Logs in to the SMTP server without sending anything. */
export async function verifyMailTransport(): Promise<{ ok: boolean; message: string }> {
  const t = await getTransporter();
  if (!t) return { ok: false, message: "No SMTP server configured. Emails are printed to the backend terminal." };
  try {
    await t.transporter.verify();
    return { ok: true, message: `Connected to the SMTP server (${t.source === "settings" ? "System settings" : ".env"}).` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Couldn't connect to the SMTP server." };
  }
}

function frontendUrl(): string {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

async function layout(bodyHtml: string): Promise<string> {
  const name = escapeHtml(await getSetting<string>("platform.name", "EventoraX"));
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
    <div style="background:#7c3aed;padding:24px;text-align:center">
      <h1 style="color:#ffffff;margin:0">${name}</h1>
    </div>
    <div style="padding:24px;background:#faf8ff;color:#0f172a">
      ${bodyHtml}
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center">${name} by ORBIT-I</p>
  </div>`;
}

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

/**
 * Sends an email. When SMTP isn't configured (local development), the email is
 * printed to the terminal instead, so verify / reset / invite links can still be tested.
 */
export async function sendMail(to: string, subject: string, html: string, devLink?: string, attachments: MailAttachment[] = []): Promise<void> {
  const t = await getTransporter();
  if (!t) {
    console.log(
      `\n──────── DEV EMAIL (SMTP not configured) ────────\nTo:      ${to}\nSubject: ${subject}\n` +
        (devLink ? `Link:    ${devLink}\n` : "") +
        (attachments.length ? `Attach:  ${attachments.map((a) => `${a.filename} (${Math.round(a.content.length / 1024)} KB)`).join(", ")}\n` : "") +
        `─────────────────────────────────────────────────\n`
    );
    return;
  }
  await t.transporter.sendMail({ from: t.from, to, subject, html, attachments });
}

/** A template filled in and wrapped in the standard layout. `override` lets the editor preview unsaved changes. */
export async function renderEmail(type: EmailTemplateType, vars: Record<string, string>, override?: { subject: string; bodyHtml: string }) {
  const tpl = override ?? (await loadTemplate(type));
  return { subject: fill(tpl.subject, vars, false), html: await layout(fill(tpl.bodyHtml, vars, true)) };
}

async function sendTemplate(to: string, type: EmailTemplateType, vars: Record<string, string>, devLink?: string, attachments: MailAttachment[] = []) {
  const { subject, html } = await renderEmail(type, vars);
  return sendMail(to, subject, html, devLink, attachments);
}

// ─────────────────────────── The emails ───────────────────────────

export function sendVerificationEmail(to: string, token: string) {
  const link = `${frontendUrl()}/verify-email?token=${token}`;
  return sendTemplate(to, "EMAIL_VERIFICATION", { link }, link);
}

export function sendResetPasswordEmail(to: string, token: string) {
  const link = `${frontendUrl()}/reset-password?token=${token}`;
  return sendTemplate(to, "PASSWORD_RESET", { link }, link);
}

export function sendInviteEmail(to: string, token: string, orgName: string, role: string) {
  const link = `${frontendUrl()}/accept-invite?token=${token}`;
  return sendTemplate(to, "TEAM_INVITE", { link, orgName, role }, link);
}

export function sendWelcomeEmail(to: string, name: string, orgName: string) {
  const link = `${frontendUrl()}/dashboard`;
  return sendTemplate(to, "WELCOME", { link, name, orgName }, link);
}

/** Free-text message from an organizer to an attendee (newlines kept, HTML escaped). Not a template: the organizer writes it. */
export async function sendAttendeeMessage(to: string, name: string, orgName: string, subject: string, message: string) {
  const body = escapeHtml(message).replace(/\r?\n/g, "<br>");
  return sendMail(
    to,
    subject,
    await layout(`<h2 style="margin-top:0">${escapeHtml(subject)}</h2><p>Hi ${escapeHtml(name)},</p><p>${body}</p><p style="color:#64748b">${escapeHtml(orgName)}</p>`)
  );
}

/** Certificate email: PDF attached, plus a link anyone can use to check it's genuine. */
export function sendCertificateEmail(to: string, name: string, orgName: string, eventTitle: string, verifyUrl: string, pdf: MailAttachment) {
  return sendTemplate(to, "CERTIFICATE", { name, orgName, eventTitle, verifyLink: verifyUrl }, verifyUrl, [pdf]);
}

/** Event ticket: PDF attached (the QR is scanned at the entrance). */
export function sendTicketEmail(to: string, name: string, orgName: string, eventTitle: string, whenText: string, pdf: MailAttachment) {
  return sendTemplate(to, "TICKET", { name, orgName, eventTitle, when: whenText }, undefined, [pdf]);
}

/** Someone registered themselves on a public event page: confirmation + QR ticket PDF. */
export function sendRegistrationConfirmEmail(
  to: string,
  vars: { name: string; eventTitle: string; when: string; orgName: string; refNo: string; eventPath: string },
  pdf: MailAttachment
) {
  const link = `${frontendUrl()}${vars.eventPath}`;
  return sendTemplate(to, "REGISTRATION_CONFIRM", { name: vars.name, eventTitle: vars.eventTitle, when: vars.when, orgName: vars.orgName, refNo: vars.refNo, link }, link, [pdf]);
}

/** Payment confirmed (the "Renewal" template). */
export function sendRenewalEmail(to: string, vars: { orgName: string; plan: string; amount: string; until: string; note: string }) {
  const link = `${frontendUrl()}/dashboard/billing`;
  return sendTemplate(to, "RENEWAL", { ...vars, link }, link);
}

/** A few days before a trial / plan ends. */
export function sendExpiryWarningEmail(to: string, vars: { orgName: string; endsOn: string; kind: string }) {
  const link = `${frontendUrl()}/dashboard/billing`;
  return sendTemplate(to, "EXPIRY_WARNING", { ...vars, link }, link);
}

/** An announcement from the superadmin. `messageHtml` is already safe HTML. */
export function sendAnnouncementEmail(to: string, vars: { title: string; messageHtml: string; orgName: string }) {
  const link = `${frontendUrl()}/dashboard`;
  return sendTemplate(to, "ANNOUNCEMENT", { title: vars.title, message: vars.messageHtml, orgName: vars.orgName, link }, link);
}

/** A plain notice in the standard layout (not editable: payment rejected, platform notifications). */
export async function sendNotice(to: string, subject: string, title: string, bodyHtml: string, cta?: { path: string; label: string }) {
  const link = cta ? `${frontendUrl()}${cta.path}` : undefined;
  const button = cta && link ? fill(`{{button "${cta.label}" link}}`, { link }, true) : "";
  return sendMail(to, subject, await layout(`<h2 style="margin-top:0">${title}</h2>${bodyHtml}${button}`), link);
}
