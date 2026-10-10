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
      return "cancelled an invite"
    case "team.invite.accept":
      return "joined the team"
    case "team.role.update":
      return `changed a member's role to ${s("to")}`
    case "team.remove":
      return `removed ${s("email") || "a member"} from the team`
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