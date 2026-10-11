import { Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { escapeHtml, sendAnnouncementEmail } from "../utils/mail";
import { orgAdminEmails } from "../utils/orgContacts";

/** Organizations an announcement reaches: everyone except suspended ones, optionally only one plan. */
export function audienceWhere(targetPlanId: string | null): Prisma.OrganizationWhereInput {
  return { status: { in: ["trial", "active", "expired"] }, ...(targetPlanId ? { planId: targetPlanId } : {}) };
}

/** Plain text (with line breaks) → safe HTML paragraphs for the email. */
function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Sends an announcement once: in-app notifications for every active member of every target organization,
 * and (if chosen) an email to each organization's admins. Safe to call twice — only the first call sends.
 */
export async function deliverAnnouncement(id: string): Promise<{ sent: boolean; orgCount: number; emailCount: number }> {
  // Claim it first, so a scheduled run and a "Send now" click can't both send it.
  const claimed = await prisma.announcement.updateMany({ where: { id, status: { in: ["DRAFT", "SCHEDULED"] } }, data: { status: "SENT", sentAt: new Date() } });
  if (claimed.count === 0) return { sent: false, orgCount: 0, emailCount: 0 };
  const a = await prisma.announcement.findUniqueOrThrow({ where: { id } });

  const orgs = await prisma.organization.findMany({ where: audienceWhere(a.targetPlanId), select: { id: true, name: true } });

  if (a.sendInApp && orgs.length) {
    const users = await prisma.user.findMany({ where: { organizationId: { in: orgs.map((o) => o.id) }, isActive: true }, select: { id: true, organizationId: true } });
    if (users.length) {
      await prisma.notification.createMany({
        data: users.map((u) => ({ organizationId: u.organizationId!, userId: u.id, announcementId: a.id, title: a.title, body: a.body, link: null })),
      });
    }
  }
  await prisma.announcement.update({ where: { id }, data: { orgCount: orgs.length } });

  let emailCount = 0;
  if (a.sendEmail && orgs.length) {
    // Emails go out in the background; the count is updated as they're sent.
    void (async () => {
      const messageHtml = textToHtml(a.body);
      for (const org of orgs) {
        for (const email of await orgAdminEmails(org.id)) {
          try {
            await sendAnnouncementEmail(email, { title: a.title, messageHtml, orgName: org.name });
            emailCount += 1;
          } catch (err) {
            console.error(`Announcement email to ${email} failed:`, err);
          }
        }
      }
      await prisma.announcement.update({ where: { id }, data: { emailCount } }).catch(() => undefined);
    })();
  }
  return { sent: true, orgCount: orgs.length, emailCount };
}

/** Sends every scheduled announcement whose time has come (run by the scheduler every minute). */
export async function sendDueAnnouncements(): Promise<number> {
  const due = await prisma.announcement.findMany({ where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } }, select: { id: true } });
  let n = 0;
  for (const a of due) if ((await deliverAnnouncement(a.id)).sent) n += 1;
  return n;
}
