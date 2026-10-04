import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function frontendUrl(): string {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

function getTransporter(): Transporter | null {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  if (!transporter) {
    const port = Number(process.env.EMAIL_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return transporter;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, bodyHtml: string): string {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
    <div style="background:#7c3aed;padding:24px;text-align:center">
      <h1 style="color:#ffffff;margin:0">EventoraX</h1>
    </div>
    <div style="padding:24px;background:#faf8ff;color:#0f172a">
      <h2 style="margin-top:0">${title}</h2>
      ${bodyHtml}
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center">EventoraX by ORBIT-I</p>
  </div>`;
}

function button(href: string, label: string): string {
  return `<p style="text-align:center;margin:28px 0">
    <a href="${href}" style="background:#7c3aed;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none">${label}</a>
  </p>
  <p style="font-size:12px;color:#64748b;word-break:break-all">If the button doesn't work, open: ${href}</p>`;
}

/**
 * Sends an email. When SMTP isn't configured (local development), the email is
 * printed to the terminal instead, so verify / reset / invite links can still be tested.
 */
export async function sendMail(to: string, subject: string, html: string, devLink?: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(
      `\n──────── DEV EMAIL (SMTP not configured) ────────\nTo:      ${to}\nSubject: ${subject}\n` +
        (devLink ? `Link:    ${devLink}\n` : "") +
        `─────────────────────────────────────────────────\n`
    );
    return;
  }
  const from = process.env.EMAIL_FROM || `"EventoraX" <${process.env.EMAIL_USER}>`;
  await t.sendMail({ from, to, subject, html });
}

export function sendVerificationEmail(to: string, token: string) {
  const link = `${frontendUrl()}/verify-email?token=${token}`;
  return sendMail(
    to,
    "Verify your email — EventoraX",
    layout(
      "Verify your email",
      `<p>Thanks for signing up! Please confirm your email address.</p>${button(link, "Verify email")}<p>This link expires in 24 hours.</p>`
    ),
    link
  );
}

export function sendResetPasswordEmail(to: string, token: string) {
  const link = `${frontendUrl()}/reset-password?token=${token}`;
  return sendMail(
    to,
    "Reset your password — EventoraX",
    layout(
      "Reset your password",
      `<p>We received a request to reset your password.</p>${button(link, "Choose a new password")}<p>This link expires in 15 minutes. If you didn't ask for this, you can ignore this email.</p>`
    ),
    link
  );
}

export function sendInviteEmail(to: string, token: string, orgName: string, role: string) {
  const link = `${frontendUrl()}/accept-invite?token=${token}`;
  return sendMail(
    to,
    `You're invited to ${orgName} on EventoraX`,
    layout(
      "You've been invited",
      `<p>You've been invited to join <strong>${escapeHtml(orgName)}</strong> on EventoraX as <strong>${escapeHtml(role)}</strong>.</p>${button(link, "Accept invite")}<p>This invite expires in 7 days.</p>`
    ),
    link
  );
}

export function sendWelcomeEmail(to: string, name: string, orgName: string) {
  const link = `${frontendUrl()}/dashboard`;
  return sendMail(
    to,
    "Welcome to EventoraX",
    layout(
      `Welcome, ${escapeHtml(name)}!`,
      `<p><strong>${escapeHtml(orgName)}</strong> is ready on EventoraX. Your free trial has started.</p>${button(link, "Go to dashboard")}`
    ),
    link
  );
}