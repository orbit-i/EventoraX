import prisma from "../prisma/client";
import { escapeHtml, sendNotice } from "../utils/mail";

// Alerts to an organization's admins, controlled by Settings → Notifications (notificationPrefs).
// Every alert also lands in the admins' notification bell.

export type OrgPref = "newRegistration" | "attendance" | "certificate";

/** Prefs default to ON (same as the Settings page shows). */
async function wants(orgId: string, pref: OrgPref) {
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { notificationPrefs: true, status: true } });
  if (!org || org.status === "suspended") return false;
  const prefs = (org.notificationPrefs ?? {}) as Partial<Record<OrgPref, boolean>>;
  return prefs[pref] !== false;
}

async function admins(orgId: string) {
  return prisma.user.findMany({ where: { organizationId: orgId, role: "admin", isActive: true }, select: { id: true, email: true } });
}

/** Bell notification for every active admin of the organization. */
async function bell(orgId: string, userIds: string[], title: string, body: string, link: string) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({ data: userIds.map((userId) => ({ organizationId: orgId, userId, title, body, link })) });
}

/** Someone registered themselves on the public event page. */
export async function notifyNewRegistration(orgId: string, r: { name: string; email: string; eventTitle: string; eventId: string }) {
  if (!(await wants(orgId, "newRegistration"))) return;
  const people = await admins(orgId);
  const link = `/dashboard/registrations?eventId=${r.eventId}`;
  await bell(orgId, people.map((p) => p.id), `New registration: ${r.name}`, `${r.name} (${r.email}) registered for ${r.eventTitle} on the public event page.`, link);
  for (const p of people) {
    await sendNotice(
      p.email,
      `New registration — ${r.eventTitle}`,
      "Someone just registered",
      `<p><strong>${escapeHtml(r.name)}</strong> (${escapeHtml(r.email)}) registered for <strong>${escapeHtml(r.eventTitle)}</strong> on your public event page. Their QR ticket was emailed to them.</p><p style="color:#64748b;font-size:13px">You can turn these emails off in Settings → Notifications.</p>`,
      { path: link, label: "See registrations" }
    ).catch((err) => console.error("New-registration email failed:", err));
  }
}

/** A batch of certificate emails has finished sending. */
export async function notifyCertificatesSent(orgId: string, r: { sent: number; failed: number; eventTitle: string; eventId: string | null }) {
  if (r.sent + r.failed === 0 || !(await wants(orgId, "certificate"))) return;
  const people = await admins(orgId);
  const link = r.eventId ? `/dashboard/certificates?eventId=${r.eventId}` : "/dashboard/certificates";
  const failedText = r.failed ? ` ${r.failed} could not be sent — open Certificates to retry.` : "";
  await bell(orgId, people.map((p) => p.id), `${r.sent} certificate${r.sent === 1 ? "" : "s"} emailed`, `Certificates for ${r.eventTitle} were emailed to ${r.sent} ${r.sent === 1 ? "person" : "people"}.${failedText}`, link);
  for (const p of people) {
    await sendNotice(
      p.email,
      `Certificates sent — ${r.eventTitle}`,
      "Certificates sent",
      `<p>Certificates for <strong>${escapeHtml(r.eventTitle)}</strong> were emailed to <strong>${r.sent}</strong> ${r.sent === 1 ? "person" : "people"}.${escapeHtml(failedText)}</p><p style="color:#64748b;font-size:13px">You can turn these emails off in Settings → Notifications.</p>`,
      { path: link, label: "Open certificates" }
    ).catch((err) => console.error("Certificate alert email failed:", err));
  }
}

/** Summary of an event that has just ended (sent once per event by the attendance-summaries job). */
export async function notifyAttendanceSummary(
  orgId: string,
  e: { eventId: string; title: string; registered: number; attended: number; absent: number; notMarked: number }
) {
  if (!(await wants(orgId, "attendance"))) return false;
  const people = await admins(orgId);
  const rate = e.registered ? Math.round((e.attended / e.registered) * 100) : 0;
  const link = `/dashboard/events/${e.eventId}`;
  const body = `${e.attended} of ${e.registered} attended (${rate}%). ${e.absent} absent, ${e.notMarked} not marked yet.`;
  await bell(orgId, people.map((p) => p.id), `Attendance: ${e.title}`, body, link);
  const row = (label: string, value: string | number) => `<tr><td style="padding:6px 12px;color:#64748b">${label}</td><td style="padding:6px 12px;font-weight:bold">${value}</td></tr>`;
  for (const p of people) {
    await sendNotice(
      p.email,
      `Attendance summary — ${e.title}`,
      `${escapeHtml(e.title)} has ended`,
      `<p>Here's how attendance went:</p><table style="border-collapse:collapse;background:#ffffff;border:1px solid #e9e4ff;border-radius:8px">${row("Registered", e.registered)}${row("Attended", `${e.attended} (${rate}%)`)}${row("Absent", e.absent)}${row("Not marked yet", e.notMarked)}</table>${
        e.notMarked ? "<p>Mark the remaining people as attended or absent so your analytics and certificates are complete.</p>" : ""
      }<p style="color:#64748b;font-size:13px">You can turn these emails off in Settings → Notifications.</p>`,
      { path: link, label: "Open the event" }
    ).catch((err) => console.error("Attendance summary email failed:", err));
  }
  return true;
}
