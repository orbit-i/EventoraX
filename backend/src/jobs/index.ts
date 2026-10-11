import prisma from "../prisma/client";
import { registerJob, startScheduler } from "./scheduler";
import { expireOverdueOrgs, DAY_MS } from "../utils/orgStatus";
import { orgAdminEmails } from "../utils/orgContacts";
import { sendExpiryWarningEmail } from "../utils/mail";
import { sendDueAnnouncements } from "../services/announcements";

const REMINDER_DAYS = 3;

registerJob({
  name: "expire-orgs",
  label: "Expire finished plans",
  description: "Marks trials and paid plans whose end date has passed as expired.",
  intervalMs: 10 * 60 * 1000,
  run: async () => {
    const n = await expireOverdueOrgs();
    return n ? `${n} organization${n === 1 ? "" : "s"} expired` : "Nothing to expire";
  },
});

registerJob({
  name: "expiry-reminders",
  label: "Plan-ending reminders",
  description: `Emails an organization's admins ${REMINDER_DAYS} days before its trial or plan ends (once per end date).`,
  intervalMs: 6 * 60 * 60 * 1000,
  run: async () => {
    const now = new Date();
    const soon = new Date(now.getTime() + REMINDER_DAYS * DAY_MS);
    const orgs = await prisma.organization.findMany({
      where: { status: { in: ["trial", "active"] }, subscriptionEndsAt: { gt: now, lte: soon } },
      select: { id: true, name: true, status: true, subscriptionEndsAt: true },
    });
    let sent = 0;
    for (const org of orgs) {
      const endsAt = org.subscriptionEndsAt.toISOString();
      // Already reminded for this end date? (the reminder is logged in the org's activity)
      const already = await prisma.activityLog.findFirst({ where: { organizationId: org.id, action: "billing.expiry.reminder", entityId: endsAt } });
      if (already) continue;
      const endsOn = org.subscriptionEndsAt.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" });
      for (const email of await orgAdminEmails(org.id)) {
        await sendExpiryWarningEmail(email, { orgName: org.name, endsOn, kind: org.status === "trial" ? "trial" : "plan" }).catch((err) => console.error("Reminder email failed:", err));
      }
      await prisma.activityLog.create({ data: { organizationId: org.id, action: "billing.expiry.reminder", entityType: "Organization", entityId: endsAt, metadata: { endsOn } } });
      sent += 1;
    }
    return sent ? `Reminded ${sent} organization${sent === 1 ? "" : "s"}` : "No plans ending soon";
  },
});

registerJob({
  name: "announcements",
  label: "Scheduled announcements",
  description: "Sends announcements whose scheduled time has come.",
  intervalMs: 60 * 1000,
  run: async () => {
    const n = await sendDueAnnouncements();
    return n ? `Sent ${n} announcement${n === 1 ? "" : "s"}` : "Nothing due";
  },
});

export { startScheduler };
