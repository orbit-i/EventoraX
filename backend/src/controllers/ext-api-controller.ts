import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { isValidPhoneNumber } from "libphonenumber-js";
import { ok, fail, validationFail, pagination, q } from "../utils/http";
import { optionalText, isUniqueViolation, isOneOf } from "../utils/schemas";
import { EMAIL_REGEX } from "../utils/password";
import { newRefNo } from "../utils/codes";
import { logActivity } from "../utils/activity";
import { seatsLeft, ticketFor } from "./registrations-controller";
import { TICKET_INCLUDE, emailTicket, parseScanned } from "../services/tickets";
import { autoIssueForAttended, normaliseVerifyCode, verifyUrl } from "../services/certificates";

// The public REST API (Enterprise): /api/v1/ext/*, authenticated with an API token (middleware/apiToken.ts).
// Responses have a fixed, documented shape (see /developers) — keep it backwards compatible.

const STATUS_PUBLIC = { DRAFT: "draft", PUBLISHED: "upcoming", ONGOING: "active", COMPLETED: "completed", ARCHIVED: "archived" } as const;
const STATUS_FROM_PUBLIC: Record<string, keyof typeof STATUS_PUBLIC> = { draft: "DRAFT", upcoming: "PUBLISHED", active: "ONGOING", completed: "COMPLETED", archived: "ARCHIVED" };
const REG_STATUSES = ["REGISTERED", "ATTENDED", "ABSENT", "CANCELLED"] as const;

/** Every write made through the API is logged as "via API (<token name>)". */
function log(req: Request, action: string, entityType: string, entityId: string, metadata: Record<string, unknown>) {
  return logActivity(req, { action, organizationId: req.org!.id, userId: null, entityType, entityId, metadata: { ...metadata, via: "api", token: req.apiToken!.name } as Prisma.InputJsonValue });
}

type EventRow = { id: string; title: string; topic: string | null; mode: string; status: string; startDateTime: Date; endDateTime: Date; location: string | null; maxAttendees: number | null; registrationOpen: boolean };
const EVENT_SELECT = { id: true, title: true, topic: true, mode: true, status: true, startDateTime: true, endDateTime: true, location: true, maxAttendees: true, registrationOpen: true } as const;

function eventOut(e: EventRow) {
  return {
    id: e.id,
    title: e.title,
    topic: e.topic,
    mode: e.mode.toLowerCase(),
    status: STATUS_PUBLIC[e.status as keyof typeof STATUS_PUBLIC],
    startsAt: e.startDateTime,
    endsAt: e.endDateTime,
    location: e.location,
    capacity: e.maxAttendees,
    registrationOpen: e.registrationOpen,
    publicUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/e/${e.id}`,
  };
}

const REG_INCLUDE = { category: { select: { label: true } }, ticket: { select: { ticketNo: true, qrCode: true, isUsed: true, usedAt: true } } } as const;
type RegRow = Prisma.RegistrationGetPayload<{ include: typeof REG_INCLUDE }>;

function registrationOut(r: RegRow) {
  return {
    id: r.id,
    eventId: r.eventId,
    refNo: r.refNo,
    name: r.name,
    email: r.email,
    phone: r.phone,
    department: r.department,
    rollNo: r.rollNo,
    category: r.category?.label ?? "General",
    status: r.status.toLowerCase(),
    source: r.registeredVia.toLowerCase(),
    registeredAt: r.registrationDate,
    ticket: r.ticket ? { number: r.ticket.ticketNo, qrValue: `EVXT:${r.ticket.qrCode}`, checkedIn: r.ticket.isUsed, checkedInAt: r.ticket.usedAt } : null,
  };
}

async function findEvent(req: Request) {
  return req.db!.event.findUnique({ where: { id: String(req.params.id) }, select: EVENT_SELECT });
}

// GET /api/v1/ext/events?status=upcoming|active|completed|draft|archived&page=&limit=
export async function extListEvents(req: Request, res: Response) {
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const status = STATUS_FROM_PUBLIC[q(query.status) ?? ""];
  const where: Prisma.EventWhereInput = status ? { status } : { status: { not: "ARCHIVED" } };
  const [rows, total] = await Promise.all([
    req.db!.event.findMany({ where, select: EVENT_SELECT, orderBy: { startDateTime: "desc" }, skip, take: limit }),
    req.db!.event.count({ where }),
  ]);
  return ok(res, rows.map(eventOut), 200, { total, page, limit });
}

// GET /api/v1/ext/events/:id
export async function extGetEvent(req: Request, res: Response) {
  const e = await findEvent(req);
  if (!e) return fail(res, 404, "NOT_FOUND", "Event not found");
  const groups = await req.db!.registration.groupBy({ by: ["status"], where: { eventId: e.id }, _count: { _all: true } });
  const count = (s: string) => groups.find((g) => g.status === s)?._count._all ?? 0;
  const categories = await req.db!.eventCategory.findMany({ where: { eventId: e.id }, select: { label: true }, orderBy: { label: "asc" } });
  return ok(res, {
    ...eventOut(e),
    categories: categories.map((c) => c.label),
    counts: { registered: count("REGISTERED") + count("ATTENDED") + count("ABSENT"), attended: count("ATTENDED"), absent: count("ABSENT"), cancelled: count("CANCELLED") },
  });
}

// GET /api/v1/ext/events/:id/registrations?status=&search=&page=&limit=
export async function extListRegistrations(req: Request, res: Response) {
  const e = await findEvent(req);
  if (!e) return fail(res, 404, "NOT_FOUND", "Event not found");
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const status = q(query.status)?.toUpperCase();
  const search = q(query.search);
  const where: Prisma.RegistrationWhereInput = { eventId: e.id };
  if (isOneOf(REG_STATUSES, status)) where.status = status;
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }, { refNo: { contains: search } }];
  const [rows, total] = await Promise.all([
    req.db!.registration.findMany({ where, include: REG_INCLUDE, orderBy: { registrationDate: "desc" }, skip, take: limit }),
    req.db!.registration.count({ where }),
  ]);
  return ok(res, rows.map(registrationOut), 200, { total, page, limit });
}

const createSchema = z.object({
  name: z.string({ error: "name is required" }).trim().min(1, "name is required").max(200),
  email: z
    .string({ error: "email is required" })
    .trim()
    .toLowerCase()
    .max(191)
    .refine((v) => EMAIL_REGEX.test(v), "email is not a valid email address"),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .refine((v) => !v || isValidPhoneNumber(v, "PK"), "phone is not a valid phone number"),
  department: optionalText(100),
  rollNo: optionalText(50),
  category: z.string().trim().max(100).optional(),
  sendTicket: z.boolean().default(false),
});

// POST /api/v1/ext/events/:id/registrations   { name, email, phone?, department?, rollNo?, category?, sendTicket? }
export async function extCreateRegistration(req: Request, res: Response) {
  const db = req.db!;
  const parsed = createSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const d = parsed.data;
  const e = await findEvent(req);
  if (!e) return fail(res, 404, "NOT_FOUND", "Event not found");
  if (e.status === "ARCHIVED") return fail(res, 409, "EVENT_ARCHIVED", "This event is archived");
  if ((await seatsLeft(db, e.id, e.maxAttendees)) <= 0) return fail(res, 409, "EVENT_FULL", "This event has reached its maximum number of attendees");

  let category: { id: string; label: string } | null = null;
  if (d.category && d.category.toLowerCase() !== "general") {
    const categories = await db.eventCategory.findMany({ where: { eventId: e.id }, select: { id: true, label: true } });
    category = categories.find((c) => c.label.toLowerCase() === d.category!.toLowerCase()) ?? null;
    if (!category) {
      return fail(res, 400, "VALIDATION_ERROR", `Unknown category. Use one of: General${categories.length ? ", " + categories.map((c) => c.label).join(", ") : ""}`, {
        fieldErrors: { category: "Unknown category" },
      });
    }
  }

  let reg: RegRow;
  try {
    reg = await db.registration.create({
      data: {
        organizationId: req.org!.id,
        eventId: e.id,
        categoryId: category?.id ?? null,
        name: d.name,
        email: d.email,
        phone: d.phone || null,
        department: d.department,
        rollNo: d.rollNo,
        registeredVia: "API",
        status: "REGISTERED",
        refNo: newRefNo(),
        ticket: ticketFor(req.org!.id, e.id, category?.label ?? "General"),
      },
      include: REG_INCLUDE,
    });
  } catch (err) {
    if (isUniqueViolation(err)) return fail(res, 409, "DUPLICATE", "This email is already registered for this event", { fieldErrors: { email: "Already registered" } });
    throw err;
  }
  await log(req, "registration.create", "Registration", reg.id, { email: reg.email });

  if (d.sendTicket) {
    const t = await db.ticket.findUnique({ where: { registrationId: reg.id }, include: TICKET_INCLUDE });
    if (t) void emailTicket(db, req.org!, t).catch((err) => console.error("API ticket email failed:", err));
  }
  return ok(res, registrationOut(reg), 201);
}

// GET /api/v1/ext/registrations/:id
export async function extGetRegistration(req: Request, res: Response) {
  const reg = await req.db!.registration.findUnique({ where: { id: String(req.params.id) }, include: REG_INCLUDE });
  if (!reg) return fail(res, 404, "NOT_FOUND", "Registration not found");
  return ok(res, registrationOut(reg));
}

// PATCH /api/v1/ext/registrations/:id   { status: "registered" | "attended" | "absent" | "cancelled" }
export async function extUpdateRegistrationStatus(req: Request, res: Response) {
  const db = req.db!;
  const parsed = z.object({ status: z.enum(["registered", "attended", "absent", "cancelled"], { error: "status must be registered, attended, absent or cancelled" }) }).safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const reg = await db.registration.findUnique({ where: { id: String(req.params.id) }, include: { event: { select: { maxAttendees: true, status: true } } } });
  if (!reg) return fail(res, 404, "NOT_FOUND", "Registration not found");
  if (reg.event.status === "ARCHIVED") return fail(res, 409, "EVENT_ARCHIVED", "This event is archived");
  const status = parsed.data.status.toUpperCase() as (typeof REG_STATUSES)[number];
  if (reg.status === "CANCELLED" && status !== "CANCELLED" && (await seatsLeft(db, reg.eventId, reg.event.maxAttendees)) <= 0) {
    return fail(res, 409, "EVENT_FULL", "No free seat to restore this registration");
  }
  const updated = await db.registration.update({ where: { id: reg.id }, data: { status }, include: REG_INCLUDE });
  await log(req, "registration.status", "Registration", reg.id, { email: reg.email, to: status });
  if (status === "ATTENDED" && reg.status !== "ATTENDED") {
    void autoIssueForAttended(db, req.org!, reg.eventId, [reg.id]).catch((err) => console.error("Auto-issue failed:", err));
  }
  return ok(res, registrationOut(updated));
}

// POST /api/v1/ext/check-in   { code, eventId? }   (QR text "EVXT:…" or ticket number "TKT-…")
export async function extCheckIn(req: Request, res: Response) {
  const db = req.db!;
  const parsed = z.object({ code: z.string({ error: "code is required" }).trim().min(1, "code is required"), eventId: z.string().min(1).optional() }).safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const lookup = parseScanned(parsed.data.code);
  if (!lookup) return fail(res, 404, "NOT_A_TICKET", "That isn't an EventoraX ticket code");
  const t = await db.ticket.findFirst({ where: lookup, include: TICKET_INCLUDE });
  if (!t) return fail(res, 404, "NOT_FOUND", "No ticket matches this code");
  if (parsed.data.eventId && t.eventId !== parsed.data.eventId) return fail(res, 409, "WRONG_EVENT", `This ticket is for "${t.event.title}"`);
  if (t.registration.status === "CANCELLED") return fail(res, 409, "REGISTRATION_CANCELLED", "This registration was cancelled");
  if (t.event.status === "ARCHIVED") return fail(res, 409, "EVENT_ARCHIVED", "This event is archived");
  const who = { registrationId: t.registration.id, name: t.registration.name, email: t.registration.email, ticketNumber: t.ticketNo, eventId: t.eventId };
  if (t.isUsed) return ok(res, { result: "already_checked_in", ...who, checkedInAt: t.usedAt });

  const now = new Date();
  const claimed = await db.ticket.updateMany({ where: { id: t.id, isUsed: false }, data: { isUsed: true, usedAt: now, usedById: null } });
  if (claimed.count === 0) return ok(res, { result: "already_checked_in", ...who, checkedInAt: now });
  if (t.registration.status !== "ATTENDED") {
    await db.registration.update({ where: { id: t.registration.id }, data: { status: "ATTENDED" } });
    void autoIssueForAttended(db, req.org!, t.eventId, [t.registration.id]).catch((err) => console.error("Auto-issue failed:", err));
  }
  await log(req, "ticket.checkin", "Ticket", t.id, { name: who.name, ticketNo: t.ticketNo });
  return ok(res, { result: "checked_in", ...who, checkedInAt: now });
}

const CERT_SELECT = { id: true, eventId: true, recipientName: true, recipientEmail: true, type: true, category: true, verifyCode: true, status: true, revokeReason: true, issuedAt: true } as const;
type CertRow = Prisma.CertificateGetPayload<{ select: typeof CERT_SELECT }>;

function certOut(c: CertRow) {
  return {
    id: c.id,
    eventId: c.eventId,
    name: c.recipientName,
    email: c.recipientEmail,
    type: c.type.toLowerCase(),
    category: c.category,
    verifyCode: c.verifyCode,
    verifyUrl: verifyUrl(c.verifyCode),
    status: c.status === "ISSUED" ? "valid" : "revoked",
    revokeReason: c.revokeReason,
    issuedAt: c.issuedAt,
  };
}

// GET /api/v1/ext/events/:id/certificates?page=&limit=
export async function extListCertificates(req: Request, res: Response) {
  const e = await findEvent(req);
  if (!e) return fail(res, 404, "NOT_FOUND", "Event not found");
  const { page, limit, skip } = pagination(req.query as Record<string, unknown>);
  const where = { eventId: e.id };
  const [rows, total] = await Promise.all([
    req.db!.certificate.findMany({ where, select: CERT_SELECT, orderBy: { issuedAt: "desc" }, skip, take: limit }),
    req.db!.certificate.count({ where }),
  ]);
  return ok(res, rows.map(certOut), 200, { total, page, limit });
}

// GET /api/v1/ext/certificates/:code   (one of your own certificates by verify code)
export async function extGetCertificate(req: Request, res: Response) {
  const c = await req.db!.certificate.findFirst({ where: { verifyCode: normaliseVerifyCode(String(req.params.code)) }, select: CERT_SELECT });
  if (!c) return fail(res, 404, "NOT_FOUND", "No certificate of yours has this code");
  return ok(res, certOut(c));
}
