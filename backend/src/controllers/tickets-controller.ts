import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { ZipArchive } from "archiver";
import { ok, fail, validationFail, pagination, q } from "../utils/http";
import { logActivity } from "../utils/activity";
import { autoIssueForAttended } from "../services/certificates";
import { TICKET_INCLUDE, emailTicket, parseScanned, ticketFileName, ticketPdf } from "../services/tickets";

const ZIP_MAX = 2000;
const BULK_MAX = 1000;

function buildWhere(query: Record<string, unknown>): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};
  const eventId = q(query.eventId);
  const used = q(query.used);
  const search = q(query.search);
  if (eventId) where.eventId = eventId;
  if (used === "yes") where.isUsed = true;
  if (used === "no") where.isUsed = false;
  if (search) {
    where.OR = [
      { ticketNo: { contains: search.toUpperCase() } },
      { registration: { name: { contains: search } } },
      { registration: { email: { contains: search } } },
    ];
  }
  // Cancelled registrations keep their ticket row but it's not valid — hide them unless asked for.
  if (q(query.includeCancelled) !== "1") where.registration = { status: { not: "CANCELLED" } };
  return where;
}

// GET /api/v1/tickets?eventId=&search=&used=yes|no&page=&limit=
export async function listTickets(req: Request, res: Response) {
  const db = req.db!;
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const where = buildWhere(query);
  const [items, total] = await Promise.all([
    db.ticket.findMany({ where, include: TICKET_INCLUDE, orderBy: [{ isUsed: "asc" }, { createdAt: "desc" }], skip, take: limit }),
    db.ticket.count({ where }),
  ]);
  return ok(res, items, 200, { total, page, limit });
}

// GET /api/v1/tickets/stats?eventId=
export async function ticketStats(req: Request, res: Response) {
  const db = req.db!;
  const eventId = q(req.query.eventId);
  const scope: Prisma.TicketWhereInput = { ...(eventId ? { eventId } : {}), registration: { status: { not: "CANCELLED" } } };
  const [total, used, emailed] = await Promise.all([
    db.ticket.count({ where: scope }),
    db.ticket.count({ where: { ...scope, isUsed: true } }),
    db.ticket.count({ where: { ...scope, emailedAt: { not: null } } }),
  ]);
  return ok(res, { total, used, unused: total - used, emailed, rate: total ? Math.round((used / total) * 100) : 0 });
}

async function loadTicket(req: Request) {
  return req.db!.ticket.findUnique({ where: { id: String(req.params.id) }, include: TICKET_INCLUDE });
}

// GET /api/v1/tickets/:id/pdf?inline=1
export async function downloadTicket(req: Request, res: Response) {
  const t = await loadTicket(req);
  if (!t) return fail(res, 404, "NOT_FOUND", "Ticket not found");
  const pdf = await ticketPdf(req.org!, t);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${q(req.query.inline) === "1" ? "inline" : "attachment"}; filename="${ticketFileName(t)}"`);
  return res.send(pdf);
}

// POST /api/v1/tickets/:id/email
export async function emailOneTicket(req: Request, res: Response) {
  const t = await loadTicket(req);
  if (!t) return fail(res, 404, "NOT_FOUND", "Ticket not found");
  if (t.registration.status === "CANCELLED") return fail(res, 400, "REGISTRATION_CANCELLED", "This registration is cancelled");
  await emailTicket(req.db!, req.org!, t);
  await logActivity(req, { action: "ticket.email", entityType: "Ticket", entityId: t.id, metadata: { name: t.registration.name } });
  return ok(res, { id: t.id, emailedAt: new Date() });
}

const emailManySchema = z.union([
  z.object({ ids: z.array(z.string().min(1)).min(1, "Select at least one ticket").max(BULK_MAX) }),
  z.object({ eventId: z.string().min(1), onlyUnsent: z.boolean().default(true) }),
]);

// POST /api/v1/tickets/email   { ids } or { eventId, onlyUnsent? }   (sends in the background)
export async function emailManyTickets(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const parsed = emailManySchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const body = parsed.data;

  const where: Prisma.TicketWhereInput = { registration: { status: { not: "CANCELLED" } } };
  if ("ids" in body) where.id = { in: body.ids };
  else {
    where.eventId = body.eventId;
    if (body.onlyUnsent) where.emailedAt = null;
  }
  const tickets = await db.ticket.findMany({ where, include: TICKET_INCLUDE, take: BULK_MAX });

  void (async () => {
    for (const t of tickets) await emailTicket(db, org, t).catch((err) => console.error(`Emailing ticket ${t.id} failed:`, err));
  })();
  await logActivity(req, { action: "ticket.email.bulk", metadata: { count: tickets.length } });
  return ok(res, { sending: tickets.length });
}

// GET /api/v1/tickets/zip?eventId=  or  ?ids=a,b,c   → one PDF per ticket in a ZIP
export async function downloadTicketsZip(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const ids = q(req.query.ids)?.split(",").filter(Boolean);
  const eventId = q(req.query.eventId);
  if (!ids?.length && !eventId) return fail(res, 400, "VALIDATION_ERROR", "Choose an event or some tickets");

  const tickets = await db.ticket.findMany({
    where: { ...(ids?.length ? { id: { in: ids } } : { eventId }), registration: { status: { not: "CANCELLED" } } },
    include: TICKET_INCLUDE,
    orderBy: { registration: { name: "asc" } },
    take: ZIP_MAX,
  });
  if (tickets.length === 0) return fail(res, 404, "NOT_FOUND", "No tickets to download");

  const slug = tickets[0]!.event.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "event";
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="tickets-${slug}.zip"`);

  // Stream the ZIP while rendering, so big events don't need everything in memory at once.
  const zip = new ZipArchive({ zlib: { level: 1 } }); // PDFs are already compressed
  zip.on("error", (err) => {
    console.error("Ticket ZIP failed:", err);
    res.destroy(err);
  });
  zip.pipe(res);
  const usedNames = new Set<string>();
  for (const t of tickets) {
    let name = ticketFileName(t);
    if (usedNames.has(name)) name = name.replace(/\.pdf$/, `-${t.id.slice(-4)}.pdf`);
    usedNames.add(name);
    zip.append(await ticketPdf(org, t), { name });
  }
  await zip.finalize();
  await logActivity(req, { action: "ticket.zip", metadata: { count: tickets.length } });
}

const checkInSchema = z.object({
  code: z.string().trim().min(1, "Scan a ticket or type its number"),
  eventId: z.string().min(1).optional(),
});

// POST /api/v1/tickets/check-in   { code, eventId? }
// code = the QR text (EVXT:…) or a typed ticket number (TKT-…). Marks the ticket used and the attendee ATTENDED.
export async function checkIn(req: Request, res: Response) {
  const db = req.db!;
  const parsed = checkInSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const lookup = parseScanned(parsed.data.code);
  if (!lookup) return fail(res, 404, "NOT_A_TICKET", "That isn't an EventoraX ticket code");

  const t = await db.ticket.findFirst({ where: lookup, include: TICKET_INCLUDE });
  if (!t) return fail(res, 404, "NOT_FOUND", "No ticket matches this code in your organization");

  const who = { name: t.registration.name, email: t.registration.email, ticketNo: t.ticketNo, type: t.type, event: t.event.title };
  if (parsed.data.eventId && t.eventId !== parsed.data.eventId) {
    return fail(res, 409, "WRONG_EVENT", `${who.name}'s ticket is for "${t.event.title}", not this event`);
  }
  if (t.registration.status === "CANCELLED") {
    return fail(res, 409, "REGISTRATION_CANCELLED", `${who.name}'s registration was cancelled`);
  }
  if (t.event.status === "ARCHIVED") return fail(res, 409, "EVENT_ARCHIVED", "This event is archived");
  if (t.isUsed) {
    const usedBy = t.usedById ? await db.user.findUnique({ where: { id: t.usedById }, select: { name: true } }) : null;
    return ok(res, { result: "ALREADY_USED", ticketId: t.id, ...who, usedAt: t.usedAt, usedBy: usedBy?.name ?? null });
  }

  const now = new Date();
  // Only the first scan wins, even if two doors scan the same ticket at the same moment.
  const claimed = await db.ticket.updateMany({ where: { id: t.id, isUsed: false }, data: { isUsed: true, usedAt: now, usedById: req.user!.userId } });
  if (claimed.count === 0) return ok(res, { result: "ALREADY_USED", ticketId: t.id, ...who, usedAt: now, usedBy: null });

  const becameAttended = t.registration.status !== "ATTENDED";
  if (becameAttended) await db.registration.update({ where: { id: t.registration.id }, data: { status: "ATTENDED" } });
  await logActivity(req, { action: "ticket.checkin", entityType: "Ticket", entityId: t.id, metadata: { name: who.name, ticketNo: t.ticketNo } });
  if (becameAttended) {
    void autoIssueForAttended(db, req.org!, t.eventId, [t.registration.id]).catch((err) => console.error("Auto-issue failed:", err));
  }
  return ok(res, { result: "CHECKED_IN", ticketId: t.id, ...who, usedAt: now, usedBy: req.user!.name });
}

// POST /api/v1/tickets/:id/undo-check-in   (a mistaken scan: ticket unused again, attendee back to Registered)
export async function undoCheckIn(req: Request, res: Response) {
  const db = req.db!;
  const t = await loadTicket(req);
  if (!t) return fail(res, 404, "NOT_FOUND", "Ticket not found");
  if (!t.isUsed) return ok(res, { id: t.id, isUsed: false });
  await db.ticket.update({ where: { id: t.id }, data: { isUsed: false, usedAt: null, usedById: null } });
  if (t.registration.status === "ATTENDED") await db.registration.update({ where: { id: t.registration.id }, data: { status: "REGISTERED" } });
  await logActivity(req, { action: "ticket.checkin.undo", entityType: "Ticket", entityId: t.id, metadata: { name: t.registration.name } });
  return ok(res, { id: t.id, isUsed: false });
}
