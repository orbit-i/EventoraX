import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ok, fail, pagination, q } from "../utils/http";
import { isOneOf } from "../utils/schemas";
import { logActivity } from "../utils/activity";
import {
  DEFAULT_IDCARD_FIELDS,
  DEFAULT_IDCARD_TEMPLATE,
  IDCARD_FIELDS,
  IDCARD_TEMPLATES,
  SAMPLE_PEOPLE,
  renderIdCards,
  type IdCardEvent,
  type IdCardField,
  type IdCardOptions,
  type IdCardPerson,
} from "../pdf/idcard";

const PDF_MAX = 2000;
const TEMPLATE_KEYS = IDCARD_TEMPLATES.map((t) => t.key);
const FIELD_KEYS = IDCARD_FIELDS.map((f) => f.key);

const ID_INCLUDE = {
  category: { select: { id: true, label: true } },
  ticket: { select: { qrCode: true, ticketNo: true } },
  idCards: { select: { createdAt: true, templateKey: true }, orderBy: { createdAt: "desc" }, take: 1 },
} as const;

/** ?template=&fields=a,b&logo=0|1&layout=sheet|single → card options with safe defaults. */
function parseOptions(query: Record<string, unknown>): IdCardOptions {
  const template = q(query.template);
  const rawFields = typeof query.fields === "string" ? query.fields : undefined;
  const fields =
    rawFields === undefined ? DEFAULT_IDCARD_FIELDS : rawFields.split(",").filter((f): f is IdCardField => isOneOf(FIELD_KEYS, f));
  return {
    template: isOneOf(TEMPLATE_KEYS, template) ? template : DEFAULT_IDCARD_TEMPLATE,
    fields,
    showLogo: q(query.logo) !== "0",
    layout: q(query.layout) === "single" ? "single" : "sheet",
  };
}

function eventBranding(org: NonNullable<Request["org"]>, event: { title: string; startDateTime: Date } | null): IdCardEvent {
  return {
    eventTitle: event?.title ?? "Your Event Title",
    eventDate: event?.startDateTime ?? new Date(),
    orgName: org.whiteLabelName || org.name,
    logoUrl: org.logoUrl,
    primaryColor: org.primaryColor,
    accentColor: org.accentColor,
  };
}

function sendPdf(res: Response, pdf: Buffer, fileName: string, inline: boolean) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${fileName}"`);
  res.setHeader("Cache-Control", "private, no-store");
  return res.send(pdf);
}

function buildWhere(query: Record<string, unknown>, eventId: string): Prisma.RegistrationWhereInput {
  // Cancelled registrations don't get a card.
  const where: Prisma.RegistrationWhereInput = { eventId, status: { not: "CANCELLED" } };
  const search = q(query.search);
  const categoryId = q(query.categoryId);
  const printed = q(query.printed);
  if (categoryId) where.categoryId = categoryId;
  if (printed === "yes") where.idCards = { some: {} };
  if (printed === "no") where.idCards = { none: {} };
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }, { rollNo: { contains: search } }, { department: { contains: search } }];
  return where;
}

// GET /api/v1/idcards/options
export function getIdCardOptions(_req: Request, res: Response) {
  return ok(res, { templates: IDCARD_TEMPLATES, fields: IDCARD_FIELDS, defaults: { template: DEFAULT_IDCARD_TEMPLATE, fields: DEFAULT_IDCARD_FIELDS } });
}

// GET /api/v1/idcards?eventId=&search=&categoryId=&printed=yes|no&page=&limit=
export async function listIdCardPeople(req: Request, res: Response) {
  const db = req.db!;
  const query = req.query as Record<string, unknown>;
  const eventId = q(query.eventId);
  if (!eventId) return fail(res, 400, "VALIDATION_ERROR", "eventId is required");
  const { page, limit, skip } = pagination(query);
  const where = buildWhere(query, eventId);
  const [rows, total] = await Promise.all([
    db.registration.findMany({ where, include: ID_INCLUDE, orderBy: { name: "asc" }, skip, take: limit }),
    db.registration.count({ where }),
  ]);
  const items = rows.map(({ idCards, ticket, ...r }) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    department: r.department,
    rollNo: r.rollNo,
    status: r.status,
    category: r.category,
    ticketNo: ticket?.ticketNo ?? null,
    lastPrintedAt: idCards[0]?.createdAt ?? null,
    lastTemplate: idCards[0]?.templateKey ?? null,
  }));
  return ok(res, items, 200, { total, page, limit });
}

// GET /api/v1/idcards/stats?eventId=
export async function idCardStats(req: Request, res: Response) {
  const db = req.db!;
  const eventId = q(req.query.eventId);
  if (!eventId) return fail(res, 400, "VALIDATION_ERROR", "eventId is required");
  const scope: Prisma.RegistrationWhereInput = { eventId, status: { not: "CANCELLED" } };
  const [total, printed, withDetails] = await Promise.all([
    db.registration.count({ where: scope }),
    db.registration.count({ where: { ...scope, idCards: { some: {} } } }),
    db.registration.count({ where: { ...scope, OR: [{ department: { not: null } }, { rollNo: { not: null } }] } }),
  ]);
  return ok(res, { total, printed, notPrinted: total - printed, withDetails });
}

// GET /api/v1/idcards/preview?eventId=&template=&fields=&logo=&layout=   (sample people, shown inline)
export async function previewIdCards(req: Request, res: Response) {
  const db = req.db!;
  const eventId = q(req.query.eventId);
  const options = parseOptions(req.query as Record<string, unknown>);
  const event = eventId ? await db.event.findUnique({ where: { id: eventId }, select: { title: true, startDateTime: true } }) : null;
  const people = options.layout === "single" ? SAMPLE_PEOPLE.slice(0, 1) : SAMPLE_PEOPLE;
  const pdf = await renderIdCards(people, eventBranding(req.org!, event), options, { sample: true });
  return sendPdf(res, pdf, "id-card-preview.pdf", true);
}

// GET /api/v1/idcards/pdf?eventId=&ids=a,b&template=&fields=&logo=&layout=&inline=1
// One PDF for one person, the selected people (ids = registration ids) or the whole event.
export async function downloadIdCards(req: Request, res: Response) {
  const db = req.db!;
  const query = req.query as Record<string, unknown>;
  const eventId = q(query.eventId);
  if (!eventId) return fail(res, 400, "VALIDATION_ERROR", "eventId is required");
  const ids = q(query.ids)?.split(",").filter(Boolean);
  const options = parseOptions(query);

  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, title: true, startDateTime: true } });
  if (!event) return fail(res, 404, "NOT_FOUND", "Event not found");

  const where: Prisma.RegistrationWhereInput = ids?.length ? { eventId, status: { not: "CANCELLED" }, id: { in: ids } } : buildWhere(query, eventId);
  const regs = await db.registration.findMany({ where, include: ID_INCLUDE, orderBy: { name: "asc" }, take: PDF_MAX });
  if (regs.length === 0) return fail(res, 404, "NOT_FOUND", "No attendees to print");

  const people: IdCardPerson[] = regs.map((r) => ({
    name: r.name,
    email: r.email,
    category: r.category?.label ?? null,
    department: r.department,
    rollNo: r.rollNo,
    qrCode: r.ticket?.qrCode ?? null,
  }));
  const pdf = await renderIdCards(people, eventBranding(req.org!, event), options);
  const inline = q(query.inline) === "1";
  const slug = (regs.length === 1 ? regs[0]!.name : event.title).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "id-cards";
  if (inline) return sendPdf(res, pdf, `id-cards-${slug}.pdf`, true); // just looking — not counted as printed

  // Remember who got a card (and with which design) so the list can show "Printed".
  const regIds = regs.map((r) => r.id);
  await db.idCard.deleteMany({ where: { registrationId: { in: regIds } } });
  await db.idCard.createMany({
    data: regIds.map((registrationId) => ({
      organizationId: req.org!.id,
      eventId,
      registrationId,
      templateKey: options.template,
      fields: { fields: options.fields, logo: options.showLogo, layout: options.layout },
    })),
  });
  await logActivity(req, {
    action: "idcard.generate",
    entityType: "Event",
    entityId: eventId,
    metadata: { count: regs.length, event: event.title, template: options.template, ...(regs.length === 1 ? { name: regs[0]!.name } : {}) },
  });

  return sendPdf(res, pdf, `id-cards-${slug}.pdf`, false);
}
