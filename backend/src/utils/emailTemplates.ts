import { EmailTemplateType } from "@prisma/client";
import prisma from "../prisma/client";

// ─────────────────────────── Editable email templates ───────────────────────────
// Syntax (shown in the editor):
//   {{name}}               a value, HTML-escaped
//   {{{message}}}          a value inserted as HTML (only for trusted values)
//   {{button "Label" link}} a big purple button pointing at the value of `link`
// The superadmin edits subject + body on /superadmin/emails; a missing DB row means "use the default below".

export interface TemplateVariable {
  key: string;
  description: string;
  sample: string;
}

export interface TemplateDefinition {
  type: EmailTemplateType;
  name: string;
  description: string;
  /** Where the platform sends it today */
  usedFor: string;
  variables: TemplateVariable[];
  subject: string;
  bodyHtml: string;
}

const v = (key: string, description: string, sample: string): TemplateVariable => ({ key, description, sample });

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    type: "WELCOME",
    name: "Welcome",
    description: "Sent right after an organization signs up for a trial.",
    usedFor: "Sign-up",
    variables: [v("name", "The person who signed up", "Ayesha Khan"), v("orgName", "Their organization", "FAST Computing Society"), v("link", "Dashboard link", "https://eventorax.com/dashboard")],
    subject: "Welcome to EventoraX",
    bodyHtml: `<h2 style="margin-top:0">Welcome, {{name}}!</h2>
<p><strong>{{orgName}}</strong> is ready on EventoraX. Your free trial has started.</p>
{{button "Go to dashboard" link}}`,
  },
  {
    type: "EMAIL_VERIFICATION",
    name: "Verify email",
    description: "Asks a new user to confirm their email address.",
    usedFor: "Sign-up, resend verification",
    variables: [v("link", "Verification link (valid 24 hours)", "https://eventorax.com/verify-email?token=…")],
    subject: "Verify your EventoraX email",
    bodyHtml: `<h2 style="margin-top:0">Verify your email</h2>
<p>Thanks for signing up! Please confirm your email address.</p>
{{button "Verify email" link}}
<p>This link expires in 24 hours.</p>`,
  },
  {
    type: "PASSWORD_RESET",
    name: "Password reset",
    description: "Link to choose a new password.",
    usedFor: "Forgot password, superadmin “Email reset link”",
    variables: [v("link", "Reset link (valid 15 minutes)", "https://eventorax.com/reset-password?token=…")],
    subject: "Reset your EventoraX password",
    bodyHtml: `<h2 style="margin-top:0">Reset your password</h2>
<p>We received a request to reset your password.</p>
{{button "Choose a new password" link}}
<p>This link expires in 15 minutes. If you didn't ask for this, you can ignore this email.</p>`,
  },
  {
    type: "TEAM_INVITE",
    name: "Team invite",
    description: "Invites someone to join an organization's team.",
    usedFor: "Team → Invite, resend invite",
    variables: [v("orgName", "Organization", "FAST Computing Society"), v("role", "Role they're invited as", "manager"), v("link", "Accept link (valid 7 days)", "https://eventorax.com/accept-invite?token=…")],
    subject: "You're invited to {{orgName}} on EventoraX",
    bodyHtml: `<h2 style="margin-top:0">You've been invited</h2>
<p>You've been invited to join <strong>{{orgName}}</strong> on EventoraX as <strong>{{role}}</strong>.</p>
{{button "Accept invite" link}}
<p>This invite expires in 7 days.</p>`,
  },
  {
    type: "REGISTRATION_CONFIRM",
    name: "Registration confirmation",
    description: "Confirms an attendee's registration for an event.",
    usedFor: "Public event page → Register (QR ticket PDF attached)",
    variables: [v("name", "Attendee", "Bilal Ahmed"), v("eventTitle", "Event", "Tech Summit 2026"), v("when", "Date and time", "19 Sept 2026, 10:00 am"), v("orgName", "Organizer", "FAST Computing Society"), v("refNo", "Registration number", "REG-7F3K2A"), v("link", "Public event page", "https://eventorax.com/e/abc123")],
    subject: "You're registered for {{eventTitle}}",
    bodyHtml: `<h2 style="margin-top:0">You're registered!</h2>
<p>Hi {{name}},</p>
<p>Your place at <strong>{{eventTitle}}</strong> ({{when}}) is confirmed. Your registration number is <strong>{{refNo}}</strong>.</p>
<p>Your QR ticket is attached as a PDF. Show it at the entrance, on your phone or printed.</p>
{{button "View event page" link}}
<p style="color:#64748b">{{orgName}}</p>`,
  },
  {
    type: "TICKET",
    name: "Event ticket",
    description: "Sends an attendee their QR ticket (PDF attached).",
    usedFor: "Tickets → Email",
    variables: [v("name", "Attendee", "Bilal Ahmed"), v("eventTitle", "Event", "Tech Summit 2026"), v("when", "Date and time", "19 Sept 2026, 10:00 am"), v("orgName", "Organizer", "FAST Computing Society")],
    subject: "Your ticket for {{eventTitle}}",
    bodyHtml: `<h2 style="margin-top:0">Your ticket</h2>
<p>Hi {{name}},</p>
<p>Here's your ticket for <strong>{{eventTitle}}</strong> ({{when}}), from {{orgName}}.</p>
<p>Show the QR code on the attached PDF at the entrance, on your phone or printed.</p>`,
  },
  {
    type: "CERTIFICATE",
    name: "Certificate",
    description: "Sends a certificate (PDF attached) with its verify link.",
    usedFor: "Certificates → Email, auto-issue",
    variables: [v("name", "Recipient", "Hira Siddiqui"), v("eventTitle", "Event", "Tech Summit 2026"), v("orgName", "Organizer", "FAST Computing Society"), v("verifyLink", "Public verify link", "https://eventorax.com/verify/EVX-AB12-CD34")],
    subject: "Your certificate for {{eventTitle}}",
    bodyHtml: `<h2 style="margin-top:0">Your certificate is ready</h2>
<p>Hi {{name}},</p>
<p>Thank you for being part of <strong>{{eventTitle}}</strong>. Your certificate from {{orgName}} is attached as a PDF.</p>
{{button "View &amp; verify online" verifyLink}}
<p style="color:#64748b">Anyone can confirm it's genuine with the link above or by scanning the QR code on the certificate.</p>`,
  },
  {
    type: "RENEWAL",
    name: "Payment confirmed / renewal",
    description: "Tells an organization its payment was confirmed and until when it's active.",
    usedFor: "Revenue → Confirm payment",
    variables: [v("orgName", "Organization", "FAST Computing Society"), v("plan", "Plan", "Pro"), v("amount", "Amount paid", "PKR 20,000"), v("until", "Active until", "11 October 2027"), v("note", "Your note (may be empty)", ""), v("link", "Billing page", "https://eventorax.com/dashboard/billing")],
    subject: "Your EventoraX payment is confirmed",
    bodyHtml: `<h2 style="margin-top:0">Your payment is confirmed 🎉</h2>
<p>We received your payment of <strong>{{amount}}</strong> for the <strong>{{plan}}</strong> plan.</p>
<p>{{orgName}} is active until <strong>{{until}}</strong>.</p>
<p>{{note}}</p>
{{button "Open billing" link}}`,
  },
  {
    type: "EXPIRY_WARNING",
    name: "Plan expiring soon",
    description: "Reminds an organization a few days before its trial or plan ends.",
    usedFor: "Daily reminder job (3 days before the end)",
    variables: [v("orgName", "Organization", "FAST Computing Society"), v("endsOn", "End date", "14 October 2026"), v("kind", "“trial” or “plan”", "trial"), v("link", "Billing page", "https://eventorax.com/dashboard/billing")],
    subject: "Your EventoraX {{kind}} ends on {{endsOn}}",
    bodyHtml: `<h2 style="margin-top:0">Your {{kind}} ends soon</h2>
<p>{{orgName}}'s {{kind}} ends on <strong>{{endsOn}}</strong>. Renew now to keep creating events and issuing certificates. Your data stays safe either way.</p>
{{button "Renew now" link}}
<p style="color:#64748b">Pay by JazzCash, Easypaisa or bank transfer from your Billing page.</p>`,
  },
  {
    type: "ANNOUNCEMENT",
    name: "Announcement",
    description: "Wraps announcements sent from the Announcements page.",
    usedFor: "Announcements → Send by email",
    variables: [v("title", "Announcement title", "New: ID cards"), v("message", "Announcement text (HTML, use {{{message}}})", "<p>You can now print ID cards.</p>"), v("orgName", "Receiving organization", "FAST Computing Society"), v("link", "Dashboard link", "https://eventorax.com/dashboard")],
    subject: "{{title}}",
    bodyHtml: `<h2 style="margin-top:0">{{title}}</h2>
{{{message}}}
{{button "Open EventoraX" link}}`,
  },
];

export const TEMPLATE_TYPES = TEMPLATE_DEFINITIONS.map((d) => d.type);

export function definitionOf(type: EmailTemplateType): TemplateDefinition {
  return TEMPLATE_DEFINITIONS.find((d) => d.type === type)!;
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function buttonHtml(href: string, label: string): string {
  return `<p style="text-align:center;margin:28px 0">
    <a href="${href}" style="background:#7c3aed;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none">${label}</a>
  </p>
  <p style="font-size:12px;color:#64748b;word-break:break-all">If the button doesn't work, open: ${href}</p>`;
}

/** Fills a template. Unknown variables become empty text (never "{{x}}" in a real email). */
export function fill(text: string, vars: Record<string, string>, html: boolean): string {
  let out = text;
  if (html) {
    out = out.replace(/\{\{\s*button\s+"([^"]*)"\s+(\w+)\s*\}\}/g, (_m, label: string, key: string) => (vars[key] ? buttonHtml(escapeHtml(vars[key]!), label) : ""));
    out = out.replace(/\{\{\{\s*(\w+)\s*\}\}\}/g, (_m, key: string) => vars[key] ?? "");
  }
  return out.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => (html ? escapeHtml(vars[key] ?? "") : vars[key] ?? ""));
}

/** The template to use: the superadmin's edited version, or the built-in default. */
export async function loadTemplate(type: EmailTemplateType): Promise<{ subject: string; bodyHtml: string }> {
  const row = await prisma.emailTemplate.findUnique({ where: { type } }).catch(() => null);
  const def = definitionOf(type);
  return row ? { subject: row.subject, bodyHtml: row.bodyHtml } : { subject: def.subject, bodyHtml: def.bodyHtml };
}

/** Sample values for previews and test emails. */
export function sampleVars(type: EmailTemplateType): Record<string, string> {
  return Object.fromEntries(definitionOf(type).variables.map((x) => [x.key, x.sample]));
}
