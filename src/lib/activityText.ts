import type { ActivityItem } from "@/types/dashboard"

/**
 * Turns an activity log row into a readable sentence (without the person's name),
 * e.g. { action: "event.create", metadata: { title: "Tech Symposium" } } → 'created the event "Tech Symposium"'.
 */
export function describeActivity(item: ActivityItem): string {
  const m = (item.metadata ?? {}) as Record<string, unknown>
  const s = (key: string) => (typeof m[key] === "string" || typeof m[key] === "number" ? String(m[key]) : "")
  const n = (key: string) => (typeof m[key] === "number" ? (m[key] as number) : 0)

  switch (item.action) {
    case "auth.register":
      return "created the organization"
    case "auth.login":
      return "logged in"
    case "auth.email.verify":
      return "verified their email"
    case "auth.password.change":
      return "changed their password"
    case "auth.password.reset":
      return "reset their password"
    case "auth.logout.all":
      return "logged out of all devices"
    case "auth.profile.update":
      return "updated their profile"
    case "event.create":
      return `created the event "${s("title")}"`
    case "event.update":
      return "updated an event"
    case "event.duplicate":
      return "duplicated an event"
    case "event.archive":
      return "archived an event"
    case "event.restore":
      return "restored an event"
    case "event.delete":
      return `deleted the event "${s("title")}"`
    case "registration.create":
      return `added ${s("email") || "an attendee"}`
    case "registration.delete":
      return "deleted a registration"
    case "registration.status":
      return `marked an attendee as ${s("to").toLowerCase() || "updated"}`
    case "registration.attendance":
      return `marked an attendee as ${s("status").toLowerCase()}`
    case "registration.csv_import":
      return `imported ${n("inserted")} attendee${n("inserted") === 1 ? "" : "s"} from a CSV`
    case "registration.export":
      return `exported ${n("count")} registrations (${s("format").toUpperCase()})`
    case "registration.email":
      return `emailed ${n("sent")} attendee${n("sent") === 1 ? "" : "s"}`
    case "speaker.create":
      return "added a speaker"
    case "speaker.delete":
      return "removed a speaker"
    case "sponsor.create":
      return "added a sponsor"
    case "sponsor.delete":
      return "removed a sponsor"
    case "session.create":
      return "added a session to the schedule"
    case "session.delete":
      return "removed a session from the schedule"
    case "team.invite":
      return `invited ${s("email")} as ${s("role")}`
    case "team.invite.cancel":
      return s("email") ? `cancelled the invite for ${s("email")}` : "cancelled an invite"
    case "team.invite.resend":
      return `resent the invite to ${s("email")}`
    case "team.invite.accept":
      return "joined the team"
    case "team.role.update":
      return `changed ${s("name") || "a member"}'s role to ${s("to")}`
    case "team.remove":
      return `removed ${s("name") || s("email") || "a member"} from the team`
    case "org.settings.update":
      return "updated the organization settings"
    case "org.logo.upload":
      return "updated the logo"
    case "org.signature.upload":
      return "updated the certificate signature"
    case "org.data.delete":
      return "deleted all event data"
    case "billing.payment.submit":
      return `submitted a payment for the ${s("plan")} plan`
    case "billing.payment.cancel":
      return "cancelled a pending payment"
    case "support.request":
      return "contacted support"
    case "certificate.issue":
      return `issued a certificate to ${s("name")}`
    case "certificate.bulk":
      return `issued ${n("issued")} certificate${n("issued") === 1 ? "" : "s"} for "${s("title")}"`
    case "certificate.email":
      return `emailed ${s("name")}'s certificate`
    case "certificate.email.bulk":
      return `emailed ${n("count")} certificate${n("count") === 1 ? "" : "s"}`
    case "certificate.revoke":
      return `revoked ${s("name")}'s certificate`
    case "certificate.restore":
      return `restored ${s("name")}'s certificate`
    case "ticket.checkin":
      return `checked in ${s("name")}`
    case "ticket.checkin.undo":
      return `undid ${s("name")}'s check-in`
    case "ticket.email":
      return `emailed ${s("name")}'s ticket`
    case "ticket.email.bulk":
      return `emailed ${n("count")} ticket${n("count") === 1 ? "" : "s"}`
    case "ticket.zip":
      return `downloaded ${n("count")} ticket${n("count") === 1 ? "" : "s"} as a ZIP`
    case "idcard.generate":
      return n("count") === 1 ? `printed ${s("name")}'s ID card` : `printed ${n("count")} ID cards for "${s("event")}"`
    case "analytics.report":
      return "downloaded the analytics PDF report"
    // Superadmin (platform) actions
    case "tenant.create":
      return `added the organization "${s("name")}"`
    case "tenant.update":
      return `edited "${s("name")}"`
    case "tenant.plan":
      return `moved "${s("name")}" to the ${s("to")} plan`
    case "tenant.extend":
      return `extended "${s("name")}" until ${s("to").slice(0, 10)}`
    case "tenant.suspend":
      return `suspended "${s("name")}"`
    case "tenant.unsuspend":
      return `reactivated "${s("name")}"`
    case "tenant.impersonate":
      return `logged in as ${s("as")} at "${s("name")}"`
    case "tenant.delete":
      return `deleted the organization "${s("name")}"`
    case "tenant.export":
      return `exported ${n("count")} organizations as CSV`
    case "payment.confirm":
      return `confirmed a PKR ${Number(s("amount")).toLocaleString()} payment from "${s("name")}"`
    case "payment.reject":
      return `rejected a payment from "${s("name")}"`
    case "payment.export":
      return `exported ${n("count")} transactions as CSV`
    case "plan.create":
      return `created the ${s("name")} plan`
    case "plan.update":
      return `edited the ${s("name")} plan`
    case "plan.show":
      return `showed the ${s("name")} plan on the pricing page`
    case "plan.hide":
      return `hid the ${s("name")} plan from the pricing page`
    case "plan.delete":
      return `deleted the ${s("name")} plan`
    case "user.disable":
      return `disabled ${s("name")}'s account`
    case "user.enable":
      return `re-enabled ${s("name")}'s account`
    case "user.logout":
      return `logged ${s("name")} out of all devices`
    case "user.password.link":
      return `sent ${s("name")} a password reset link`
    case "user.password.temporary":
      return `set a temporary password for ${s("name")}`
    case "user.export":
      return `exported ${n("count")} users as CSV`
    case "platform.certificate.revoke":
      return `revoked ${s("name")}'s certificate (${s("code")})`
    case "platform.certificate.restore":
      return `restored ${s("name")}'s certificate (${s("code")})`
    case "platform.certificate.bulkRevoke":
      return `revoked ${n("count")} certificates of ${s("scope") === "event" ? "the event" : "the organization"} "${s("label")}"`
    case "platform.analytics.report":
      return "downloaded the platform PDF report"
    case "platform.analytics.csv":
      return `exported platform ${s("dataset")} data as CSV`
    case "upload.image":
      return "uploaded an image"
    default:
      if (item.action.startsWith("registration.bulk.")) {
        const affected = n("affected")
        const verb = item.action.replace("registration.bulk.", "").replace("mark_", "marked as ").replace("_", " ")
        return `${verb} ${affected} registration${affected === 1 ? "" : "s"}`
      }
      return item.action.replace(/\./g, " ")
  }
}