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
