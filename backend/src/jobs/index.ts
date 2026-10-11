import prisma from "../prisma/client";
import { registerJob, startScheduler } from "./scheduler";
import { expireOverdueOrgs, DAY_MS } from "../utils/orgStatus";
import { orgAdminEmails } from "../utils/orgContacts";
import { sendExpiryWarningEmail } from "../utils/mail";
import { sendDueAnnouncements } from "../services/announcements";
import { notifyAttendanceSummary } from "../services/orgNotifications";

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

registerJob({
  name: "attendance-summaries",
  label: "Attendance summaries",
  description: "After an event ends, emails its organization's admins how attendance went (once per event).",
  intervalMs: 30 * 60 * 1000,
  run: async () => {
    const now = new Date();
    // Events that ended in the last 2 days (older ones were before this feature, or already handled).
    const events = await prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] }, endDateTime: { lte: now, gte: new Date(now.getTime() - 2 * DAY_MS) } },
      select: { id: true, title: true, organizationId: true },
    });
    let sent = 0;
    for (const e of events) {
      const done = await prisma.activityLog.findFirst({ where: { organizationId: e.organizationId, action: "event.attendance.summary", entityId: e.id } });
      if (done) continue;
      const groups = await prisma.registration.groupBy({ by: ["status"], where: { eventId: e.id, status: { not: "CANCELLED" } }, _count: { _all: true } });
      const count = (s: string) => groups.find((g) => g.status === s)?._count._all ?? 0;
      const registered = count("REGISTERED") + count("ATTENDED") + count("ABSENT");
      if (registered > 0) {
        const emailed = await notifyAttendanceSummary(e.organizationId, {
          eventId: e.id,
          title: e.title,
          registered,
          attended: count("ATTENDED"),
          absent: count("ABSENT"),
          notMarked: count("REGISTERED"),
        });
        if (emailed) sent += 1;
      }
      // Mark it handled either way, so switching the setting on later doesn't flood old events.
      await prisma.activityLog.create({ data: { organizationId: e.organizationId, action: "event.attendance.summary", entityType: "Event", entityId: e.id, metadata: { title: e.title, registered } } });
    }
    return sent ? `Sent ${sent} summar${sent === 1 ? "y" : "ies"}` : "No events just ended";
  },
});

export { startScheduler };
