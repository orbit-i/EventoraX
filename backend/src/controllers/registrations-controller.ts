import { Request, Response } from "express";
import { z } from "zod";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { Prisma } from "@prisma/client";
import type { ScopedPrisma } from "../prisma/scopedClient";
import { ok, fail, validationFail, pagination, q } from "../utils/http";
import { optionalText, isOneOf, isUniqueViolation } from "../utils/schemas";
import { EMAIL_REGEX } from "../utils/password";
import { newRefNo, newTicketNo, newQrCode } from "../utils/codes";
import { sendAttendeeMessage } from "../utils/mail";
import { logActivity } from "../utils/activity";

export const REG_STATUSES = ["REGISTERED", "ATTENDED", "ABSENT", "CANCELLED"] as const;
const MAX_IMPORT_ROWS = 5000;

const REG_INCLUDE = {
  category: { select: { id: true, label: true } },
  ticket: { select: { id: true, ticketNo: true, isUsed: true, usedAt: true } },
} as const;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(191)
  .refine((v) => EMAIL_REGEX.test(v), "Enter a valid email address");

const registrationFields = z.object({
  eventId: z.string().min(1, "eventId is required"),
  categoryId: z
    .string()
    .min(1)
    .nullish()
    .transform((v) => v ?? null),
  name: z.string().trim().min(1, "Name is required").max(200),
  email: emailField,
  phone: optionalText(30),
  department: optionalText(100),
  rollNo: optionalText(50),
  status: z.enum(REG_STATUSES).optional(),
});
const updateRegistrationSchema = registrationFields.omit({ eventId: true }).partial();

// ─────────────────────────── helpers ───────────────────────────

/** Nested create for the QR ticket that every registration gets. */
function ticketFor(organizationId: string, eventId: string, type: string) {
  return {
    create: { organizationId, eventId, ticketNo: newTicketNo(), qrCode: newQrCode(), type },
  };
}

/** Seats left (Infinity when the event has no limit). Cancelled registrations don't take a seat. */
async function seatsLeft(db: ScopedPrisma, eventId: string, maxAttendees: number | null): Promise<number> {
  if (maxAttendees === null) return Infinity;
  const active = await db.registration.count({ where: { eventId, status: { not: "CANCELLED" } } });
  return Math.max(0, maxAttendees - active);
}

/** Returns the category if it belongs to this event, otherwise null. */
async function categoryOfEvent(db: ScopedPrisma, categoryId: string, eventId: string) {
  const category = await db.eventCategory.findUnique({ where: { id: categoryId } });
  return category && category.eventId === eventId ? category : null;
}

function badCategory(res: Response) {
  return fail(res, 400, "VALIDATION_ERROR", "Category must belong to this event", {
    fieldErrors: { categoryId: "Pick a category from this event" },
  });
}

// ─────────────────────────── LIST / GET ───────────────────────────

// GET /api/v1/registrations?eventId=&status=&categoryId=&search=&page=&limit=
export async function listRegistrations(req: Request, res: Response) {
  const db = req.db!;
  const query = req.query as Record<string, unknown>;
  const eventId = q(query.eventId);
  if (!eventId) return fail(res, 400, "VALIDATION_ERROR", "eventId is required");

  const { page, limit, skip } = pagination(query);
  const status = q(query.status);
  const categoryId = q(query.categoryId);
  const search = q(query.search);

  const where: Prisma.RegistrationWhereInput = { eventId };
  if (isOneOf(REG_STATUSES, status)) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [{ name: { contains: search } }, { email: { contains: search } }, { refNo: { contains: search } }];
  }

  const [registrations, total] = await Promise.all([
    db.registration.findMany({ where, orderBy: { registrationDate: "desc" }, skip, take: limit, include: REG_INCLUDE }),
    db.registration.count({ where }),
  ]);

  return ok(res, registrations, 200, { total, page, limit });
}

// GET /api/v1/registrations/:id
export async function getRegistration(req: Request, res: Response) {
  const registration = await req.db!.registration.findUnique({
    where: { id: String(req.params.id) },
    include: REG_INCLUDE,
  });
  if (!registration) return fail(res, 404, "NOT_FOUND", "Registration not found");
  return ok(res, registration);
}

// ─────────────────────────── CREATE / UPDATE / DELETE ───────────────────────────

// POST /api/v1/registrations   (an organizer adding an attendee manually)
export async function createRegistration(req: Request, res: Response) {
  const db = req.db!;
  const organizationId = req.org!.id;
  const parsed = registrationFields.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const { eventId, categoryId, status, ...fields } = parsed.data;

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, maxAttendees: true, status: true },
  });
  if (!event) return fail(res, 404, "NOT_FOUND", "Event not found");
  if (event.status === "ARCHIVED") return fail(res, 409, "EVENT_ARCHIVED", "This event is archived");
  if ((await seatsLeft(db, eventId, event.maxAttendees)) <= 0) {
    return fail(res, 409, "EVENT_FULL", "This event has reached its maximum number of attendees");
  }

  const category = categoryId ? await categoryOfEvent(db, categoryId, eventId) : null;
  if (categoryId && !category) return badCategory(res);

  try {
    const registration = await db.registration.create({
      data: {
        ...fields,
        eventId,
        organizationId,
        categoryId: category?.id ?? null,
        status: status ?? "REGISTERED",
        registeredVia: "ADMIN",
        refNo: newRefNo(),
        ticket: ticketFor(organizationId, eventId, category?.label ?? "General"),
      },
      include: REG_INCLUDE,
    });

    await logActivity(req, {
      action: "registration.create",
      entityType: "Registration",
      entityId: registration.id,
      metadata: { email: registration.email },
    });
    return ok(res, registration, 201);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return fail(res, 409, "DUPLICATE", "This email is already registered for this event");
    }
    throw err;
  }
}

// PATCH /api/v1/registrations/:id
export async function updateRegistration(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const parsed = updateRegistrationSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const existing = await db.registration.findUnique({
    where: { id },
    include: { event: { select: { maxAttendees: true } } },
  });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Registration not found");

  const { categoryId, ...fields } = parsed.data;

  // Category change (undefined = not sent, null = remove category)
  let categoryLabel: string | undefined;
  if (categoryId !== undefined) {
    if (categoryId === null) {
      categoryLabel = "General";
    } else {
      const category = await categoryOfEvent(db, categoryId, existing.eventId);
      if (!category) return badCategory(res);
      categoryLabel = category.label;
    }
  }

  // Restoring a cancelled registration needs a free seat.
  if (existing.status === "CANCELLED" && fields.status && fields.status !== "CANCELLED") {
    if ((await seatsLeft(db, existing.eventId, existing.event.maxAttendees)) <= 0) {
      return fail(res, 409, "EVENT_FULL", "This event has reached its maximum number of attendees");
    }
  }

  try {
    const updated = await db.registration.update({
      where: { id },
      data: { ...fields, ...(categoryId !== undefined && { categoryId }) },
      include: REG_INCLUDE,
    });
    if (categoryLabel) {
      await db.ticket.updateMany({ where: { registrationId: id }, data: { type: categoryLabel } });
    }
    return ok(res, updated);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return fail(res, 409, "DUPLICATE", "This email is already registered for this event");
    }
    throw err;
  }
}

// DELETE /api/v1/registrations/:id   (its ticket is deleted with it)
export async function deleteRegistration(req: Request, res: Response) {
  const id = String(req.params.id);
  const result = await req.db!.registration.deleteMany({ where: { id } });
  if (result.count === 0) return fail(res, 404, "NOT_FOUND", "Registration not found");
  await logActivity(req, { action: "registration.delete", entityType: "Registration", entityId: id });
  return ok(res, { id, deleted: true });
}

// ─────────────────────────── ATTENDANCE & BULK ───────────────────────────

const attendanceSchema = z.object({ status: z.enum(["ATTENDED", "ABSENT", "REGISTERED"]) });

// PATCH /api/v1/registrations/:id/attendance  { status }
export async function markAttendance(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const parsed = attendanceSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return fail(res, 400, "VALIDATION_ERROR", "status must be ATTENDED, ABSENT or REGISTERED");
  }

  const result = await db.registration.updateMany({ where: { id }, data: { status: parsed.data.status } });
  if (result.count === 0) return fail(res, 404, "NOT_FOUND", "Registration not found");

  // Phase 9: auto-issue a certificate here when the event has autoIssueCert = true.
  await logActivity(req, {
    action: "registration.attendance",
    entityType: "Registration",
    entityId: id,
    metadata: { status: parsed.data.status },
  });

  const updated = await db.registration.findUnique({ where: { id }, include: REG_INCLUDE });
  return ok(res, updated);
}

const bulkSchema = z.object({
  action: z.enum(["mark_attended", "mark_absent", "cancel", "delete"]),
  ids: z.array(z.string().min(1)).min(1, "Select at least one attendee").max(1000),
});

// POST /api/v1/registrations/bulk  { action, ids }
export async function bulkAction(req: Request, res: Response) {
  const db = req.db!;
  const parsed = bulkSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const { action, ids } = parsed.data;
  const where = { id: { in: ids } };

  let affected: number;
  if (action === "delete") {
    affected = (await db.registration.deleteMany({ where })).count;
  } else {
    const status = action === "mark_attended" ? "ATTENDED" : action === "mark_absent" ? "ABSENT" : "CANCELLED";
    affected = (await db.registration.updateMany({ where, data: { status } })).count;
  }

  await logActivity(req, {
    action: `registration.bulk.${action}`,
    entityType: "Registration",
    metadata: { requested: ids.length, affected },
  });
  return ok(res, { action, requested: ids.length, affected });
}

// ─────────────────────────── CSV IMPORT ───────────────────────────

// POST /api/v1/registrations/csv-import/parse   (multipart, field name: file)
// Returns the headers + rows so the frontend can show the column-mapping screen.
export async function parseCsvImport(req: Request, res: Response) {
  if (!req.file) return fail(res, 400, "NO_FILE", "No file uploaded (form field name must be: file)");

  const text = req.file.buffer.toString("utf8").replace(/^\uFEFF/, ""); // strip Excel's BOM
  const result = Papa.parse<string[]>(text, { skipEmptyLines: "greedy" });
  const rows = result.data.filter((row) => row.some((cell) => String(cell).trim() !== ""));

  const [headerRow, ...dataRows] = rows;
  if (!headerRow || dataRows.length === 0) {
    return fail(res, 400, "EMPTY_CSV", "The CSV file needs a header row and at least one data row");
  }
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return fail(res, 400, "TOO_MANY_ROWS", `A single import can have at most ${MAX_IMPORT_ROWS} rows`);
  }

  return ok(res, {
    headers: headerRow.map((h) => String(h).trim()),
    preview: dataRows.slice(0, 10),
    totalRows: dataRows.length,
    rows: dataRows,
  });
}

const importRowSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: emailField,
  phone: optionalText(30),
  department: optionalText(100),
  rollNo: optionalText(50),
  categoryLabel: optionalText(50),
});

const confirmImportSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  rows: z.array(z.unknown()).min(1, "At least one row is required").max(MAX_IMPORT_ROWS),
  createMissingCategories: z.boolean().optional(),
});

interface ImportIssue {
  row: number;
  email: string;
  reason: string;
}

function emailOf(raw: unknown): string {
  if (raw && typeof raw === "object" && "email" in raw) {
    const email = (raw as { email: unknown }).email;
    if (typeof email === "string") return email;
  }
  return "";
}

// POST /api/v1/registrations/csv-import/confirm
// body: { eventId, createMissingCategories?, rows: [{ name, email, phone?, department?, rollNo?, categoryLabel? }] }
export async function confirmCsvImport(req: Request, res: Response) {
  const db = req.db!;
  const organizationId = req.org!.id;
  const parsed = confirmImportSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const { eventId, rows, createMissingCategories } = parsed.data;

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, maxAttendees: true, status: true },
  });
  if (!event) return fail(res, 404, "NOT_FOUND", "Event not found");
  if (event.status === "ARCHIVED") return fail(res, 409, "EVENT_ARCHIVED", "This event is archived");

  // 1. Validate every row and catch duplicates inside the file itself.
  const errors: ImportIssue[] = [];
  const valid: { row: number; data: z.infer<typeof importRowSchema> }[] = [];
  const seenEmails = new Set<string>();

  rows.forEach((raw, index) => {
    const row = index + 1;
    const result = importRowSchema.safeParse(raw);
    if (!result.success) {
      errors.push({ row, email: emailOf(raw), reason: result.error.issues[0]?.message ?? "Invalid row" });
      return;
    }
    if (seenEmails.has(result.data.email)) {
      errors.push({ row, email: result.data.email, reason: "Duplicate email in this file" });
      return;
    }
    seenEmails.add(result.data.email);
    valid.push({ row, data: result.data });
  });

  // 2. Who is already registered for this event?
  const existing = await db.registration.findMany({
    where: { eventId, email: { in: valid.map((v) => v.data.email) } },
    select: { email: true },
  });
  const alreadyRegistered = new Set(existing.map((e) => e.email.toLowerCase()));

  // 3. Categories: match labels (ignoring case), optionally create missing ones.
  const categories = await db.eventCategory.findMany({ where: { eventId } });
  const categoryByLabel = new Map(categories.map((c) => [c.label.toLowerCase(), c]));

  if (createMissingCategories) {
    const missing = new Map<string, string>();
    for (const { data } of valid) {
      const label = data.categoryLabel;
      if (label && !categoryByLabel.has(label.toLowerCase())) missing.set(label.toLowerCase(), label);
    }
    for (const label of missing.values()) {
      const created = await db.eventCategory.create({ data: { eventId, label, organizationId } });
      categoryByLabel.set(label.toLowerCase(), created);
    }
  }

  // 4. Insert, respecting capacity. Each registration gets its QR ticket.
  let remaining = await seatsLeft(db, eventId, event.maxAttendees);
  let inserted = 0;
  const categoryWarnings: { row: number; email: string; categoryLabel: string }[] = [];

  for (const { row, data } of valid) {
    if (alreadyRegistered.has(data.email)) {
      errors.push({ row, email: data.email, reason: "Already registered for this event" });
      continue;
    }
    if (remaining <= 0) {
      errors.push({ row, email: data.email, reason: "Event is full" });
      continue;
    }

    let category: { id: string; label: string } | null = null;
    if (data.categoryLabel) {
      category = categoryByLabel.get(data.categoryLabel.toLowerCase()) ?? null;
      if (!category) categoryWarnings.push({ row, email: data.email, categoryLabel: data.categoryLabel });
    }

    try {
      await db.registration.create({
        data: {
          eventId,
          organizationId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          department: data.department,
          rollNo: data.rollNo,
          categoryId: category?.id ?? null,
          registeredVia: "CSV_IMPORT",
          refNo: newRefNo(),
          ticket: ticketFor(organizationId, eventId, category?.label ?? "General"),
        },
      });
      inserted++;
      remaining--;
    } catch (err) {
      errors.push({
        row,
        email: data.email,
        reason: isUniqueViolation(err) ? "Already registered for this event" : "Could not be saved",
      });
    }
  }

  errors.sort((a, b) => a.row - b.row);

  await logActivity(req, {
    action: "registration.csv_import",
    entityType: "Event",
    entityId: eventId,
    metadata: { total: rows.length, inserted, skipped: rows.length - inserted },
  });

  return ok(res, { total: rows.length, inserted, skipped: rows.length - inserted, errors, categoryWarnings });
}

// ─────────────────────────── EXPORT ───────────────────────────

const EXPORT_COLUMNS = [
  { header: "Ref No", key: "refNo", width: 18 },
  { header: "Name", key: "name", width: 28 },
  { header: "Email", key: "email", width: 32 },
  { header: "Phone", key: "phone", width: 18 },
  { header: "Department", key: "department", width: 20 },
  { header: "Roll No", key: "rollNo", width: 14 },
  { header: "Category", key: "category", width: 14 },
  { header: "Status", key: "status", width: 12 },
  { header: "Registered Via", key: "registeredVia", width: 14 },
  { header: "Ticket No", key: "ticketNo", width: 18 },
  { header: "Checked In", key: "checkedIn", width: 11 },
  { header: "Registered At", key: "registeredAt", width: 22 },
] as const;

type ExportKey = (typeof EXPORT_COLUMNS)[number]["key"];

/** Quotes a CSV cell and neutralises spreadsheet formulas (=, +, -, @). */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function fileSafe(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "event";
}

// GET /api/v1/registrations/export?eventId=&format=csv|xlsx&status=&ids=id1,id2
export async function exportRegistrations(req: Request, res: Response) {
  const db = req.db!;
  const query = req.query as Record<string, unknown>;
  const eventId = q(query.eventId);
  if (!eventId) return fail(res, 400, "VALIDATION_ERROR", "eventId is required");

  const format = q(query.format) === "xlsx" ? "xlsx" : "csv";
  const status = q(query.status);
  const ids = q(query.ids)
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const event = await db.event.findUnique({ where: { id: eventId }, select: { title: true } });
  if (!event) return fail(res, 404, "NOT_FOUND", "Event not found");

  const where: Prisma.RegistrationWhereInput = { eventId };
  if (isOneOf(REG_STATUSES, status)) where.status = status;
  if (ids && ids.length > 0) where.id = { in: ids };

  const registrations = await db.registration.findMany({
    where,
    orderBy: { registrationDate: "asc" },
    include: REG_INCLUDE,
  });

  const rows: Record<ExportKey, string>[] = registrations.map((r) => ({
    refNo: r.refNo,
    name: r.name,
    email: r.email,
    phone: r.phone ?? "",
    department: r.department ?? "",
    rollNo: r.rollNo ?? "",
    category: r.category?.label ?? "",
    status: r.status,
    registeredVia: r.registeredVia,
    ticketNo: r.ticket?.ticketNo ?? "",
    checkedIn: r.ticket?.isUsed ? "Yes" : "No",
    registeredAt: r.registrationDate.toISOString(),
  }));

  const baseName = `registrations-${fileSafe(event.title)}-${new Date().toISOString().slice(0, 10)}`;

  await logActivity(req, {
    action: "registration.export",
    entityType: "Event",
    entityId: eventId,
    metadata: { format, count: rows.length },
  });

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Registrations");
    sheet.columns = EXPORT_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${baseName}.xlsx"`);
    return res.send(Buffer.from(buffer as ArrayBuffer));
  }

  const lines = [
    EXPORT_COLUMNS.map((c) => csvCell(c.header)).join(","),
    ...rows.map((row) => EXPORT_COLUMNS.map((c) => csvCell(row[c.key])).join(",")),
  ];
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${baseName}.csv"`);
  return res.send("\uFEFF" + lines.join("\r\n")); // BOM so Excel reads Urdu/Arabic names correctly
}

// ─────────────────────────── EMAIL ATTENDEES ───────────────────────────

const emailSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Select at least one attendee").max(500),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

// POST /api/v1/registrations/email  { ids, subject, message }
export async function emailRegistrations(req: Request, res: Response) {
  const db = req.db!;
  const parsed = emailSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const { ids, subject, message } = parsed.data;
  const recipients = await db.registration.findMany({
    where: { id: { in: ids }, status: { not: "CANCELLED" } },
    select: { email: true, name: true },
  });
  if (recipients.length === 0) return fail(res, 404, "NOT_FOUND", "No matching attendees found");

  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    try {
      await sendAttendeeMessage(r.email, r.name, req.org!.name, subject, message);
      sent++;
    } catch (err) {
      failed++;
      console.error(`Email to ${r.email} failed:`, err);
    }
  }

  await logActivity(req, {
    action: "registration.email",
    entityType: "Registration",
    metadata: { subject, requested: ids.length, sent, failed },
  });
  return ok(res, { requested: ids.length, sent, failed });
}