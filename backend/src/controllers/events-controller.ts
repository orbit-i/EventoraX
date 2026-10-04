import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { ok, fail, validationFail, pagination, q } from "../utils/http";
import { optionalText, optionalUrl, isOneOf, parseDate, isUniqueViolation } from "../utils/schemas";
import { logActivity } from "../utils/activity";

export const EVENT_MODES = ["ONLINE", "OFFLINE", "HYBRID"] as const;
export const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "ARCHIVED"] as const;

const eventFields = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  organizer: optionalText(200),
  mode: z.enum(EVENT_MODES),
  startDateTime: z.coerce.date(),
  endDateTime: z.coerce.date(),
  location: optionalText(255),
  description: optionalText(10000),
  topic: optionalText(200),
  maxAttendees: z.coerce.number().int().positive("Must be a positive number").nullish(),
  ticketPrice: z.coerce.number().min(0, "Cannot be negative").nullish(),
  registrationOpen: z.boolean().optional(),
  meetingLink: optionalUrl,
  certTemplateId: optionalText(50),
  autoIssueCert: z.boolean().optional(),
  status: z.enum(EVENT_STATUSES).optional(),
});

const createEventSchema = eventFields
  .extend({ categories: z.array(z.string().trim().min(1).max(50)).max(30).optional() })
  .refine((d) => d.endDateTime > d.startDateTime, {
    message: "End date/time must be after the start",
    path: ["endDateTime"],
  });

const updateEventSchema = eventFields.partial();

/** Removes duplicate labels, ignoring upper/lower case. */
function uniqueLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of labels) {
    const key = label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(label);
    }
  }
  return out;
}

// ─────────────────────────── EVENTS ───────────────────────────

// GET /api/v1/events?status=&mode=&search=&from=&to=&page=&limit=
export async function listEvents(req: Request, res: Response) {
  const db = req.db!;
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const status = q(query.status);
  const mode = q(query.mode);
  const search = q(query.search);
  const from = parseDate(q(query.from));
  const to = parseDate(q(query.to), true);

  const where: Prisma.EventWhereInput = {};
  if (isOneOf(EVENT_STATUSES, status)) {
    where.status = status;
  } else {
    where.status = { not: "ARCHIVED" }; // archived events are hidden unless asked for
  }
  if (isOneOf(EVENT_MODES, mode)) where.mode = mode;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { topic: { contains: search } },
      { location: { contains: search } },
      { organizer: { contains: search } },
    ];
  }
  if (from || to) {
    where.startDateTime = { ...(from && { gte: from }), ...(to && { lte: to }) };
  }

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startDateTime: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { registrations: true } },
        categories: { select: { id: true, label: true } },
      },
    }),
    db.event.count({ where }),
  ]);

  return ok(res, events, 200, { total, page, limit });
}

// GET /api/v1/events/:id   (includes attendance stats)
export async function getEvent(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);

  const event = await db.event.findUnique({
    where: { id },
    include: {
      categories: { orderBy: { label: "asc" } },
      _count: { select: { registrations: true, speakers: true, sponsors: true, sessions: true, certificates: true } },
    },
  });
  if (!event) return fail(res, 404, "NOT_FOUND", "Event not found");

  const grouped = await db.registration.groupBy({
    by: ["status"],
    where: { eventId: id },
    _count: { _all: true },
  });

  const byStatus: Record<string, number> = { REGISTERED: 0, ATTENDED: 0, ABSENT: 0, CANCELLED: 0 };
  for (const g of grouped) byStatus[g.status] = g._count._all;

  const activeRegistrations = event._count.registrations - (byStatus.CANCELLED ?? 0);
  const attendanceRate =
    activeRegistrations > 0 ? Math.round(((byStatus.ATTENDED ?? 0) / activeRegistrations) * 100) : 0;
  const seatsLeft = event.maxAttendees === null ? null : Math.max(0, event.maxAttendees - activeRegistrations);

  return ok(res, { ...event, stats: { byStatus, attendanceRate, seatsLeft } });
}

// POST /api/v1/events
export async function createEvent(req: Request, res: Response) {
  const db = req.db!;
  const parsed = createEventSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const { categories, ...fields } = parsed.data;
  const labels = uniqueLabels(categories ?? []);
  const organizationId = req.org!.id;

  const event = await db.event.create({
    data: {
      ...fields,
      registrationOpen: fields.registrationOpen ?? true,
      autoIssueCert: fields.autoIssueCert ?? false,
      status: fields.status ?? "DRAFT",
      organizationId,
      ...(labels.length > 0 && {
        categories: { create: labels.map((label) => ({ label, organizationId })) },
      }),
    },
    include: { categories: true },
  });

  await logActivity(req, {
    action: "event.create",
    entityType: "Event",
    entityId: event.id,
    metadata: { title: event.title },
  });
  return ok(res, event, 201);
}

// PATCH /api/v1/events/:id   (send only the fields you want to change)
export async function updateEvent(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const parsed = updateEventSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const existing = await db.event.findUnique({ where: { id } });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Event not found");

  const start = parsed.data.startDateTime ?? existing.startDateTime;
  const end = parsed.data.endDateTime ?? existing.endDateTime;
  if (end <= start) {
    return fail(res, 400, "VALIDATION_ERROR", "End date/time must be after the start", {
      fieldErrors: { endDateTime: "End date/time must be after the start" },
    });
  }

  const updated = await db.event.update({
    where: { id },
    data: parsed.data,
    include: { categories: true },
  });

  await logActivity(req, {
    action: "event.update",
    entityType: "Event",
    entityId: id,
    metadata: { fields: Object.keys(parsed.data) },
  });
  return ok(res, updated);
}

// DELETE /api/v1/events/:id
// Events with registrations are ARCHIVED (data kept). Empty events are deleted.
export async function deleteEvent(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);

  const existing = await db.event.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Event not found");

  if (existing._count.registrations > 0) {
    await db.event.update({ where: { id }, data: { status: "ARCHIVED", registrationOpen: false } });
    await logActivity(req, { action: "event.archive", entityType: "Event", entityId: id });
    return ok(res, {
      id,
      archived: true,
      message: "This event has registrations, so it was archived instead of deleted.",
    });
  }

  await db.event.delete({ where: { id } });
  await logActivity(req, {
    action: "event.delete",
    entityType: "Event",
    entityId: id,
    metadata: { title: existing.title },
  });
  return ok(res, { id, deleted: true });
}

// POST /api/v1/events/:id/duplicate   (copies the event + its categories, as a DRAFT)
export async function duplicateEvent(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);

  const original = await db.event.findUnique({ where: { id }, include: { categories: true } });
  if (!original) return fail(res, 404, "NOT_FOUND", "Event not found");

  const { id: _oldId, createdAt: _c, updatedAt: _u, categories, ...rest } = original;

  const copy = await db.event.create({
    data: {
      ...rest,
      title: `${original.title} (Copy)`.slice(0, 200),
      status: "DRAFT",
      categories: {
        create: categories.map((c) => ({ label: c.label, organizationId: c.organizationId })),
      },
    },
    include: { categories: true },
  });

  await logActivity(req, {
    action: "event.duplicate",
    entityType: "Event",
    entityId: copy.id,
    metadata: { from: id },
  });
  return ok(res, copy, 201);
}

// ─────────────────────────── CATEGORIES ───────────────────────────

const createCategorySchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  label: z.string().trim().min(1, "Label is required").max(50),
});
const updateCategorySchema = createCategorySchema.pick({ label: true });

// GET /api/v1/categories?eventId=
export async function listCategories(req: Request, res: Response) {
  const eventId = q((req.query as Record<string, unknown>).eventId);
  if (!eventId) return fail(res, 400, "VALIDATION_ERROR", "eventId is required");

  const categories = await req.db!.eventCategory.findMany({
    where: { eventId },
    orderBy: { label: "asc" },
    include: { _count: { select: { registrations: true } } },
  });
  return ok(res, categories);
}

// POST /api/v1/categories  { eventId, label }
export async function createCategory(req: Request, res: Response) {
  const db = req.db!;
  const parsed = createCategorySchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const event = await db.event.findUnique({ where: { id: parsed.data.eventId }, select: { id: true } });
  if (!event) return fail(res, 404, "NOT_FOUND", "Event not found");

  try {
    const category = await db.eventCategory.create({
      data: { ...parsed.data, organizationId: req.org!.id },
    });
    return ok(res, category, 201);
  } catch (err) {
    if (isUniqueViolation(err)) return fail(res, 409, "DUPLICATE", "This category already exists for the event");
    throw err;
  }
}

// PATCH /api/v1/categories/:id  { label }
export async function updateCategory(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const parsed = updateCategorySchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const existing = await db.eventCategory.findUnique({ where: { id } });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Category not found");

  try {
    const updated = await db.eventCategory.update({ where: { id }, data: { label: parsed.data.label } });
    return ok(res, updated);
  } catch (err) {
    if (isUniqueViolation(err)) return fail(res, 409, "DUPLICATE", "This category already exists for the event");
    throw err;
  }
}

// DELETE /api/v1/categories/:id   (registrations in it simply lose their category)
export async function deleteCategory(req: Request, res: Response) {
  const result = await req.db!.eventCategory.deleteMany({ where: { id: String(req.params.id) } });
  if (result.count === 0) return fail(res, 404, "NOT_FOUND", "Category not found");
  return ok(res, { id: req.params.id, deleted: true });
}