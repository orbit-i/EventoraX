import type { OrgWithPlan } from "../middleware/checkOrgStatus";
import type { ScopedPrisma } from "../prisma/scopedClient";
import { renderTicket, TICKET_QR_PREFIX, type TicketData } from "../pdf/ticket";
import { sendTicketEmail } from "../utils/mail";

type OrgBranding = Pick<OrgWithPlan, "name" | "whiteLabelName" | "logoUrl" | "primaryColor">;

export const TICKET_INCLUDE = {
  registration: { select: { id: true, name: true, email: true, refNo: true, status: true } },
  event: { select: { id: true, title: true, startDateTime: true, endDateTime: true, mode: true, location: true, meetingLink: true, status: true } },
} as const;

interface TicketWithRelations {
  id: string;
  ticketNo: string;
  qrCode: string;
  type: string | null;
  registration: { name: string; email: string; refNo: string };
  event: { title: string; startDateTime: Date; endDateTime: Date; mode: string; location: string | null; meetingLink: string | null };
}

function ticketData(org: OrgBranding, t: TicketWithRelations): TicketData {
  return {
    ticketNo: t.ticketNo,
    qrCode: t.qrCode,
    type: t.type,
    attendeeName: t.registration.name,
    attendeeEmail: t.registration.email,
    refNo: t.registration.refNo,
    eventTitle: t.event.title,
    start: t.event.startDateTime,
    end: t.event.endDateTime,
    mode: t.event.mode,
    location: t.event.location,
    meetingLink: t.event.meetingLink,
    orgName: org.whiteLabelName || org.name,
    logoUrl: org.logoUrl,
    primaryColor: org.primaryColor,
  };
}

/** Tickets are rendered on demand (they change when the event's time or venue changes). */
export function ticketPdf(org: OrgBranding, t: TicketWithRelations) {
  return renderTicket(ticketData(org, t));
}

export const ticketFileName = (t: Pick<TicketWithRelations, "ticketNo" | "registration">) =>
  `${t.registration.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "ticket"}-${t.ticketNo}.pdf`;

export async function emailTicket(db: ScopedPrisma, org: OrgBranding, t: TicketWithRelations & { id: string }) {
  const pdf = await ticketPdf(org, t);
  const when = t.event.startDateTime.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" });
  await sendTicketEmail(t.registration.email, t.registration.name, org.whiteLabelName || org.name, t.event.title, when, {
    filename: ticketFileName(t),
    content: pdf,
    contentType: "application/pdf",
  });
  await db.ticket.update({ where: { id: t.id }, data: { emailedAt: new Date() } });
}

/** Whatever the scanner read (QR text) or a person typed (ticket number) → a lookup. */
export function parseScanned(input: string): { qrCode: string } | { ticketNo: string } | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.startsWith(TICKET_QR_PREFIX)) return { qrCode: raw.slice(TICKET_QR_PREFIX.length) };
  if (/^[a-f0-9]{32}$/i.test(raw)) return { qrCode: raw.toLowerCase() };
  const no = raw.toUpperCase().replace(/\s+/g, "");
  if (/^TKT-?[A-F0-9]{10}$/.test(no)) return { ticketNo: no.startsWith("TKT-") ? no : `TKT-${no.slice(3)}` };
  return null;
}
