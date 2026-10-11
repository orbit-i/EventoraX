import { Request, Response } from "express";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import prisma from "../prisma/client";
import { getScopedPrisma } from "../prisma/scopedClient";
import { ok, fail, validationFail } from "../utils/http";
import { optionalText, isUniqueViolation } from "../utils/schemas";
import { EMAIL_REGEX } from "../utils/password";
import { newRefNo } from "../utils/codes";
import { logActivity } from "../utils/activity";
import { sendRegistrationConfirmEmail } from "../utils/mail";
import { seatsLeft, ticketFor } from "./registrations-controller";
import { TICKET_INCLUDE, ticketFileName, ticketPdf } from "../services/tickets";
import { notifyNewRegistration } from "../services/orgNotifications";

// Public pages: an organization's event list (/o/:slug) and an event page with self-registration (/e/:id).
// Only Upcoming / Active / Completed events are public; drafts and archived events don't exist here.

const PUBLIC_STATUSES = ["PUBLISHED", "ONGOING", "COMPLETED"] as const;

const ORG_PUBLIC = { id: true, name: true, slug: true, whiteLabelName: true, logoUrl: true, primaryColor: true, accentColor: true, status: true, subscriptionEndsAt: true } as const;

type PublicOrg = { id: string; name: string; slug: string; whiteLabelName: string | null; logoUrl: string | null; primaryColor: string | null; accentColor: string | null; status: string; subscriptionEndsAt: Date };

function orgView(o: PublicOrg) {
  return { name: o.whiteLabelName || o.name, slug: o.slug, logoUrl: o.logoUrl, primaryColor: o.primaryColor, accentColor: o.accentColor };
}

/** Can this organization take registrations right now? (suspended / expired orgs are paused) */
function orgActive(o: PublicOrg) {
  return (o.status === "trial" || o.status === "active") && o.subscriptionEndsAt > new Date();
}

const EVENT_CARD = { id: true, title: true, topic: true, mode: true, startDateTime: true, endDateTime: true, location: true, status: true, registrationOpen: true, maxAttendees: true } as const;

// GET /api/v1/public/orgs/:slug   (organization page: upcoming + past events)
export async function publicOrg(req: Request, res: Response) {
  const org = await prisma.organization.findUnique({ where: { slug: String(req.params.slug) }, select: ORG_PUBLIC });
  if (!org || org.status === "suspended") return fail(res, 404, "NOT_FOUND", "This organization page doesn't exist");
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({ where: { organizationId: org.id, status: { in: ["PUBLISHED", "ONGOING"] }, endDateTime: { gte: now } }, orderBy: { startDateTime: "asc" }, take: 50, select: EVENT_CARD }),
    prisma.event.findMany({
      where: { organizationId: org.id, status: { in: [...PUBLIC_STATUSES] }, endDateTime: { lt: now } },
      orderBy: { startDateTime: "desc" },
      take: 12,
      select: EVENT_CARD,
    }),
  ]);
  return ok(res, { organization: orgView(org), upcoming, past });
}

type Availability = { open: boolean; reason: "OPEN" | "FULL" | "CLOSED" | "ENDED" | "UNAVAILABLE"; seatsLeft: number | null };

async function availability(event: { id: string; organizationId: string; status: string; registrationOpen: boolean; endDateTime: Date; maxAttendees: number | null }, org: PublicOrg): Promise<Availability> {
  const left = await seatsLeft(getScopedPrisma(org.id), event.id, event.maxAttendees);
  const seats = Number.isFinite(left) ? left : null;
  if (event.status === "COMPLETED" || event.endDateTime < new Date()) return { open: false, reason: "ENDED", seatsLeft: seats };
  if (!orgActive(org)) return { open: false, reason: "UNAVAILABLE", seatsLeft: seats };
  if (!event.registrationOpen) return { open: false, reason: "CLOSED", seatsLeft: seats };
  if (seats !== null && seats <= 0) return { open: false, reason: "FULL", seatsLeft: 0 };
  return { open: true, reason: "OPEN", seatsLeft: seats };
}

async function findPublicEvent(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organization: { select: ORG_PUBLIC },
      categories: { select: { id: true, label: true }, orderBy: { label: "asc" } },
    },
  });
  if (!event || !(PUBLIC_STATUSES as readonly string[]).includes(event.status) || event.organization.status === "suspended") return null;
  return event;
}

// GET /api/v1/public/events/:id   (everything the public event page shows)
export async function publicEvent(req: Request, res: Response) {
  const event = await findPublicEvent(String(req.params.id));
  if (!event) return fail(res, 404, "NOT_FOUND", "This event doesn't exist or isn't public");
  const [speakers, sponsors, sessions, avail] = await Promise.all([
    prisma.speaker.findMany({
      where: { eventId: event.id, displayPublic: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, firstName: true, lastName: true, title: true, company: true, sessionTopic: true, bio: true, photo: true, linkedin: true },
    }),
    prisma.sponsor.findMany({
      where: { eventId: event.id, displayPublic: true },
      orderBy: [{ tier: "asc" }, { displayOrder: "asc" }],
      select: { id: true, name: true, website: true, logo: true, tier: true },
    }),
    prisma.session.findMany({
      where: { eventId: event.id, displayPublic: true },
      orderBy: [{ startTime: "asc" }, { displayOrder: "asc" }],
      select: { id: true, title: true, startTime: true, endTime: true, location: true, speaker: { select: { firstName: true, lastName: true } } },
    }),
    availability(event, event.organization),
  ]);
  return ok(res, {
    id: event.id,
    title: event.title,
    organizer: event.organizer,
    topic: event.topic,
    description: event.description,
    mode: event.mode,
    status: event.status,
    startDateTime: event.startDateTime,
    endDateTime: event.endDateTime,
    // The venue is public; the meeting link is only sent to registered people (on the ticket).
    location: event.mode === "ONLINE" ? null : event.location,
    ticketPrice: event.ticketPrice ? String(event.ticketPrice) : null,
    categories: event.categories,
    organization: orgView(event.organization),
    registration: avail,
    speakers,
    sponsors,
    sessions,
  });
}

const registerSchema = z.object({
  name: z.string({ error: "Enter your full name" }).trim().min(2, "Enter your full name").max(200),
  email: z
    .string({ error: "Enter your email address" })
    .trim()
    .toLowerCase()
    .max(191)
    .refine((v) => EMAIL_REGEX.test(v), "Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .refine((v) => !v || isValidPhoneNumber(v, "PK"), "Enter a valid phone number, e.g. +92 300 1234567"),
  department: optionalText(100),
  rollNo: optionalText(50),
  categoryId: z.string().min(1).nullish(),
  // Hidden field real people never fill in: bots that do are silently ignored.
  website: z.string().optional(),
});

const TZ = "Asia/Karachi";

// POST /api/v1/public/events/:id/register   { name, email, phone?, department?, rollNo?, categoryId? }
export async function publicRegister(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const d = parsed.data;

  const event = await findPublicEvent(String(req.params.id));
  if (!event) return fail(res, 404, "NOT_FOUND", "This event doesn't exist or isn't public");
  const org = event.organization;

  if (d.website) {
    // Honeypot filled → pretend it worked, store nothing.
    return ok(res, { registered: true, refNo: "REG-XXXXXX", ticketNo: "", qrCode: "", name: d.name, email: d.email, eventTitle: event.title }, 201);
  }

  const avail = await availability(event, org);
  if (!avail.open) {
    const message = {
      FULL: "Sorry, this event is full.",
      CLOSED: "Registration for this event is closed.",
      ENDED: "This event has already taken place.",
      UNAVAILABLE: "Registration is temporarily unavailable. Please contact the organizer.",
      OPEN: "",
    }[avail.reason];
    return fail(res, 409, `REGISTRATION_${avail.reason}`, message);
  }

  let category: { id: string; label: string } | null = null;
  if (d.categoryId) {
    category = event.categories.find((c) => c.id === d.categoryId) ?? null;
    if (!category) return fail(res, 400, "VALIDATION_ERROR", "Choose a category from the list", { fieldErrors: { categoryId: "Choose a category from the list" } });
  }

  const db = getScopedPrisma(org.id);
  let registration;
  try {
    registration = await db.registration.create({
      data: {
        organizationId: org.id,
        eventId: event.id,
        categoryId: category?.id ?? null,
        name: d.name,
        email: d.email,
        phone: d.phone || null,
        department: d.department,
        rollNo: d.rollNo,
        registeredVia: "WEB",
        status: "REGISTERED",
        refNo: newRefNo(),
        ticket: ticketFor(org.id, event.id, category?.label ?? "General"),
      },
      include: { ticket: { include: TICKET_INCLUDE } },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return fail(res, 409, "ALREADY_REGISTERED", "This email is already registered for this event — check your inbox for your ticket.", {
        fieldErrors: { email: "Already registered for this event" },
      });
    }
    throw err;
  }

  await logActivity(req, {
    action: "registration.self",
    organizationId: org.id,
    userId: null,
    entityType: "Registration",
    entityId: registration.id,
    metadata: { name: registration.name, email: registration.email, event: event.title },
  });

  // Confirmation + QR ticket, and the organization's "new registration" alert, in the background.
  const ticket = registration.ticket!;
  void (async () => {
    try {
      const fullOrg = await prisma.organization.findUniqueOrThrow({ where: { id: org.id } });
      const pdf = await ticketPdf(fullOrg, ticket);
      await sendRegistrationConfirmEmail(
        registration.email,
        {
          name: registration.name,
          eventTitle: event.title,
          when: event.startDateTime.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: TZ }),
          orgName: org.whiteLabelName || org.name,
          refNo: registration.refNo,
          eventPath: `/e/${event.id}`,
        },
        { filename: ticketFileName(ticket), content: pdf, contentType: "application/pdf" }
      );
      await db.ticket.update({ where: { id: ticket.id }, data: { emailedAt: new Date() } });
    } catch (err) {
      console.error("Registration confirmation failed:", err);
    }
    await notifyNewRegistration(org.id, { name: registration.name, email: registration.email, eventTitle: event.title, eventId: event.id }).catch((err) =>
      console.error("New-registration alert failed:", err)
    );
  })();

  return ok(
    res,
    {
      registered: true,
      refNo: registration.refNo,
      ticketNo: ticket.ticketNo,
      qrCode: ticket.qrCode,
      name: registration.name,
      email: registration.email,
      eventTitle: event.title,
    },
    201
  );
}
