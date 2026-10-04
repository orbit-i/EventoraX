import { Request, Response } from "express";
import { z } from "zod";
import { ok, fail, validationFail, q } from "../utils/http";
import { optionalText, optionalUrl, optionalImage } from "../utils/schemas";
import { saveUpload, deleteUpload } from "../utils/storage";
import { logActivity } from "../utils/activity";

const SPONSOR_TIERS = ["PLATINUM", "GOLD", "SILVER", "BRONZE"] as const;

async function eventExists(req: Request, eventId: string): Promise<boolean> {
  const event = await req.db!.event.findUnique({ where: { id: eventId }, select: { id: true } });
  return event !== null;
}

function requiredEventId(req: Request): string | undefined {
  return q((req.query as Record<string, unknown>).eventId);
}

/** A session's speaker must belong to the same event. */
async function speakerBelongsToEvent(req: Request, speakerId: string | null | undefined, eventId: string) {
  if (!speakerId) return true;
  const speaker = await req.db!.speaker.findUnique({ where: { id: speakerId }, select: { eventId: true } });
  return speaker !== null && speaker.eventId === eventId;
}

function noFile(res: Response) {
  return fail(res, 400, "NO_FILE", "No file uploaded (form field name must be: file)");
}

// ─────────────────────────── SPEAKERS ───────────────────────────

const speakerFields = z.object({
  eventId: z.string().min(1, "eventId is required"),
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  title: optionalText(150),
  company: optionalText(150),
  sessionTopic: optionalText(200),
  bio: optionalText(5000),
  photo: optionalImage,
  linkedin: optionalUrl,
  displayPublic: z.boolean().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
});
const speakerUpdate = speakerFields.omit({ eventId: true }).partial();

// GET /api/v1/speakers?eventId=&displayPublic=true
export async function listSpeakers(req: Request, res: Response) {
  const eventId = requiredEventId(req);
  if (!eventId) return fail(res, 400, "VALIDATION_ERROR", "eventId is required");
  const displayPublic = q((req.query as Record<string, unknown>).displayPublic);

  const speakers = await req.db!.speaker.findMany({
    where: { eventId, ...(displayPublic !== undefined && { displayPublic: displayPublic === "true" }) },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  return ok(res, speakers);
}

// GET /api/v1/speakers/:id
export async function getSpeaker(req: Request, res: Response) {
  const speaker = await req.db!.speaker.findUnique({ where: { id: String(req.params.id) } });
  if (!speaker) return fail(res, 404, "NOT_FOUND", "Speaker not found");
  return ok(res, speaker);
}

// POST /api/v1/speakers
export async function createSpeaker(req: Request, res: Response) {
  const db = req.db!;
  const parsed = speakerFields.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const { eventId, displayOrder, ...rest } = parsed.data;
  if (!(await eventExists(req, eventId))) return fail(res, 404, "NOT_FOUND", "Event not found");

  const max = await db.speaker.aggregate({ where: { eventId }, _max: { displayOrder: true } });
  const speaker = await db.speaker.create({
    data: {
      ...rest,
      eventId,
      organizationId: req.org!.id,
      displayPublic: rest.displayPublic ?? false,
      displayOrder: displayOrder ?? (max._max.displayOrder ?? -1) + 1,
    },
  });

  await logActivity(req, { action: "speaker.create", entityType: "Speaker", entityId: speaker.id });
  return ok(res, speaker, 201);
}

// PATCH /api/v1/speakers/:id
export async function updateSpeaker(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const parsed = speakerUpdate.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const existing = await db.speaker.findUnique({ where: { id } });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Speaker not found");

  const updated = await db.speaker.update({ where: { id }, data: parsed.data });
  return ok(res, updated);
}

// DELETE /api/v1/speakers/:id   (their sessions keep existing, without a speaker)
export async function deleteSpeaker(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const existing = await db.speaker.findUnique({ where: { id } });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Speaker not found");

  await db.speaker.delete({ where: { id } });
  await deleteUpload(existing.photo);
  await logActivity(req, { action: "speaker.delete", entityType: "Speaker", entityId: id });
  return ok(res, { id, deleted: true });
}

// POST /api/v1/speakers/:id/photo   (multipart, field name: file)
export async function uploadSpeakerPhoto(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  if (!req.file) return noFile(res);

  const speaker = await db.speaker.findUnique({ where: { id } });
  if (!speaker) return fail(res, 404, "NOT_FOUND", "Speaker not found");

  const url = await saveUpload(`orgs/${req.org!.id}/speakers`, req.file.buffer, req.file.mimetype);
  await deleteUpload(speaker.photo);
  const updated = await db.speaker.update({ where: { id }, data: { photo: url } });
  return ok(res, updated);
}

// ─────────────────────────── SPONSORS ───────────────────────────

const sponsorFields = z.object({
  eventId: z.string().min(1, "eventId is required"),
  name: z.string().trim().min(1, "Name is required").max(150),
  website: optionalUrl,
  logo: optionalImage,
  tier: z.enum(SPONSOR_TIERS).optional(),
  displayPublic: z.boolean().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
});
const sponsorUpdate = sponsorFields.omit({ eventId: true }).partial();

// GET /api/v1/sponsors?eventId=&displayPublic=true
export async function listSponsors(req: Request, res: Response) {
  const eventId = requiredEventId(req);
  if (!eventId) return fail(res, 400, "VALIDATION_ERROR", "eventId is required");
  const displayPublic = q((req.query as Record<string, unknown>).displayPublic);

  const sponsors = await req.db!.sponsor.findMany({
    where: { eventId, ...(displayPublic !== undefined && { displayPublic: displayPublic === "true" }) },
    orderBy: [{ tier: "asc" }, { displayOrder: "asc" }], // PLATINUM first
  });
  return ok(res, sponsors);
}

// GET /api/v1/sponsors/:id
export async function getSponsor(req: Request, res: Response) {
  const sponsor = await req.db!.sponsor.findUnique({ where: { id: String(req.params.id) } });
  if (!sponsor) return fail(res, 404, "NOT_FOUND", "Sponsor not found");
  return ok(res, sponsor);
}

// POST /api/v1/sponsors
export async function createSponsor(req: Request, res: Response) {
  const db = req.db!;
  const parsed = sponsorFields.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const { eventId, displayOrder, ...rest } = parsed.data;
  if (!(await eventExists(req, eventId))) return fail(res, 404, "NOT_FOUND", "Event not found");

  const max = await db.sponsor.aggregate({ where: { eventId }, _max: { displayOrder: true } });
  const sponsor = await db.sponsor.create({
    data: {
      ...rest,
      eventId,
      organizationId: req.org!.id,
      tier: rest.tier ?? "BRONZE",
      displayPublic: rest.displayPublic ?? false,
      displayOrder: displayOrder ?? (max._max.displayOrder ?? -1) + 1,
    },
  });

  await logActivity(req, { action: "sponsor.create", entityType: "Sponsor", entityId: sponsor.id });
  return ok(res, sponsor, 201);
}

// PATCH /api/v1/sponsors/:id
export async function updateSponsor(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const parsed = sponsorUpdate.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const existing = await db.sponsor.findUnique({ where: { id } });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Sponsor not found");

  const updated = await db.sponsor.update({ where: { id }, data: parsed.data });
  return ok(res, updated);
}

// DELETE /api/v1/sponsors/:id
export async function deleteSponsor(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const existing = await db.sponsor.findUnique({ where: { id } });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Sponsor not found");

  await db.sponsor.delete({ where: { id } });
  await deleteUpload(existing.logo);
  await logActivity(req, { action: "sponsor.delete", entityType: "Sponsor", entityId: id });
  return ok(res, { id, deleted: true });
}

// POST /api/v1/sponsors/:id/logo   (multipart, field name: file)
export async function uploadSponsorLogo(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  if (!req.file) return noFile(res);

  const sponsor = await db.sponsor.findUnique({ where: { id } });
  if (!sponsor) return fail(res, 404, "NOT_FOUND", "Sponsor not found");

  const url = await saveUpload(`orgs/${req.org!.id}/sponsors`, req.file.buffer, req.file.mimetype);
  await deleteUpload(sponsor.logo);
  const updated = await db.sponsor.update({ where: { id }, data: { logo: url } });
  return ok(res, updated);
}

// ─────────────────────────── SESSIONS (SCHEDULE) ───────────────────────────

const sessionFields = z.object({
  eventId: z.string().min(1, "eventId is required"),
  speakerId: z
    .string()
    .min(1)
    .nullish()
    .transform((v) => v ?? null),
  title: z.string().trim().min(1, "Title is required").max(200),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: optionalText(200),
  displayPublic: z.boolean().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
});
const createSessionSchema = sessionFields.refine((d) => d.endTime > d.startTime, {
  message: "End time must be after the start time",
  path: ["endTime"],
});
const sessionUpdate = sessionFields.omit({ eventId: true }).partial();

const SPEAKER_SUMMARY = { select: { id: true, firstName: true, lastName: true, photo: true } } as const;

// GET /api/v1/sessions?eventId=&displayPublic=true
export async function listSessions(req: Request, res: Response) {
  const eventId = requiredEventId(req);
  if (!eventId) return fail(res, 400, "VALIDATION_ERROR", "eventId is required");
  const displayPublic = q((req.query as Record<string, unknown>).displayPublic);

  const sessions = await req.db!.session.findMany({
    where: { eventId, ...(displayPublic !== undefined && { displayPublic: displayPublic === "true" }) },
    orderBy: [{ displayOrder: "asc" }, { startTime: "asc" }],
    include: { speaker: SPEAKER_SUMMARY },
  });
  return ok(res, sessions);
}

// GET /api/v1/sessions/:id
export async function getSession(req: Request, res: Response) {
  const session = await req.db!.session.findUnique({
    where: { id: String(req.params.id) },
    include: { speaker: SPEAKER_SUMMARY },
  });
  if (!session) return fail(res, 404, "NOT_FOUND", "Session not found");
  return ok(res, session);
}

// POST /api/v1/sessions
export async function createSession(req: Request, res: Response) {
  const db = req.db!;
  const parsed = createSessionSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const { eventId, displayOrder, ...rest } = parsed.data;
  if (!(await eventExists(req, eventId))) return fail(res, 404, "NOT_FOUND", "Event not found");
  if (!(await speakerBelongsToEvent(req, rest.speakerId, eventId))) {
    return fail(res, 400, "VALIDATION_ERROR", "Speaker must belong to this event", {
      fieldErrors: { speakerId: "Pick a speaker from this event" },
    });
  }

  const max = await db.session.aggregate({ where: { eventId }, _max: { displayOrder: true } });
  const session = await db.session.create({
    data: {
      ...rest,
      eventId,
      organizationId: req.org!.id,
      displayPublic: rest.displayPublic ?? false,
      displayOrder: displayOrder ?? (max._max.displayOrder ?? -1) + 1,
    },
    include: { speaker: SPEAKER_SUMMARY },
  });

  await logActivity(req, { action: "session.create", entityType: "Session", entityId: session.id });
  return ok(res, session, 201);
}

// PATCH /api/v1/sessions/:id
export async function updateSession(req: Request, res: Response) {
  const db = req.db!;
  const id = String(req.params.id);
  const parsed = sessionUpdate.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const existing = await db.session.findUnique({ where: { id } });
  if (!existing) return fail(res, 404, "NOT_FOUND", "Session not found");

  const start = parsed.data.startTime ?? existing.startTime;
  const end = parsed.data.endTime ?? existing.endTime;
  if (end <= start) {
    return fail(res, 400, "VALIDATION_ERROR", "End time must be after the start time", {
      fieldErrors: { endTime: "End time must be after the start time" },
    });
  }
  if (!(await speakerBelongsToEvent(req, parsed.data.speakerId, existing.eventId))) {
    return fail(res, 400, "VALIDATION_ERROR", "Speaker must belong to this event", {
      fieldErrors: { speakerId: "Pick a speaker from this event" },
    });
  }

  const updated = await db.session.update({
    where: { id },
    data: parsed.data,
    include: { speaker: SPEAKER_SUMMARY },
  });
  return ok(res, updated);
}

// DELETE /api/v1/sessions/:id
export async function deleteSession(req: Request, res: Response) {
  const result = await req.db!.session.deleteMany({ where: { id: String(req.params.id) } });
  if (result.count === 0) return fail(res, 404, "NOT_FOUND", "Session not found");
  await logActivity(req, { action: "session.delete", entityType: "Session", entityId: String(req.params.id) });
  return ok(res, { id: req.params.id, deleted: true });
}

// ─────────────────────────── REORDER ───────────────────────────

const reorderSchema = z.object({
  type: z.enum(["speakers", "sessions", "sponsors"]),
  items: z
    .array(z.object({ id: z.string().min(1), displayOrder: z.coerce.number().int().min(0) }))
    .min(1, "At least one item is required")
    .max(500),
});

// POST /api/v1/reorder  { type, items: [{ id, displayOrder }] }   (all-or-nothing)
export async function reorder(req: Request, res: Response) {
  const db = req.db!;
  const parsed = reorderSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const { type, items } = parsed.data;
  if (type === "speakers") {
    await db.$transaction(
      items.map((i) => db.speaker.updateMany({ where: { id: i.id }, data: { displayOrder: i.displayOrder } }))
    );
  } else if (type === "sessions") {
    await db.$transaction(
      items.map((i) => db.session.updateMany({ where: { id: i.id }, data: { displayOrder: i.displayOrder } }))
    );
  } else {
    await db.$transaction(
      items.map((i) => db.sponsor.updateMany({ where: { id: i.id }, data: { displayOrder: i.displayOrder } }))
    );
  }

  return ok(res, { updated: items.length });
}