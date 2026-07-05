"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { EventMode, EventStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// TODO: replace with your real auth/session lookup once wired up.
// Every query in this file is tenant-scoped through this function.
async function getTenantId(): Promise<string> {
  return "tenant_alpha_univ";
}

// ------------------------------
// VALIDATION SCHEMAS
// ------------------------------

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  mode: z.nativeEnum(EventMode),
  startDateTime: z.coerce.date(),
  endDateTime: z.coerce.date(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
  maxAttendees: z.coerce.number().int().positive().optional().nullable(),
  ticketPrice: z.coerce.number().min(0).optional().nullable(),
  registrationOpen: z.boolean().default(true),
  meetingLink: z.string().url().optional().nullable().or(z.literal("")),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
}).refine((data) => data.endDateTime > data.startDateTime, {
  message: "End date/time must be after start date/time",
  path: ["endDateTime"],
});

export type EventFormInput = z.infer<typeof eventSchema>;

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ------------------------------
// CREATE
// ------------------------------

export async function createEvent(input: EventFormInput): Promise<ActionResult<{ id: string }>> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const tenantId = await getTenantId();
    const event = await prisma.event.create({
      data: { ...parsed.data, tenantId },
    });
    revalidatePath("/dashboard/events");
    return { success: true, data: { id: event.id } };
  } catch (err) {
    console.error("createEvent failed:", err);
    return { success: false, error: "Could not create event. Please try again." };
  }
}

// ------------------------------
// UPDATE
// ------------------------------

export async function updateEvent(
  id: string,
  input: EventFormInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const tenantId = await getTenantId();
    const result = await prisma.event.updateMany({
      where: { id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return { success: false, error: "Event not found or access denied." };
    }

    revalidatePath("/dashboard/events");
    revalidatePath(`/dashboard/events/${id}`);
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateEvent failed:", err);
    return { success: false, error: "Could not update event. Please try again." };
  }
}

// ------------------------------
// DELETE
// ------------------------------

export async function deleteEvent(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const tenantId = await getTenantId();
    const result = await prisma.event.deleteMany({ where: { id, tenantId } });

    if (result.count === 0) {
      return { success: false, error: "Event not found or access denied." };
    }

    revalidatePath("/dashboard/events");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("deleteEvent failed:", err);
    return { success: false, error: "Could not delete event. It may have related records." };
  }
}

// ------------------------------
// DUPLICATE
// ------------------------------

export async function duplicateEvent(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const tenantId = await getTenantId();
    const original = await prisma.event.findFirst({ where: { id, tenantId } });

    if (!original) {
      return { success: false, error: "Event not found or access denied." };
    }

    const copy = await prisma.event.create({
      data: {
        tenantId,
        title: `${original.title} (Copy)`,
        mode: original.mode,
        startDateTime: original.startDateTime,
        endDateTime: original.endDateTime,
        location: original.location,
        description: original.description,
        topic: original.topic,
        maxAttendees: original.maxAttendees,
        ticketPrice: original.ticketPrice,
        registrationOpen: original.registrationOpen,
        meetingLink: original.meetingLink,
        status: EventStatus.DRAFT,
      },
    });

    revalidatePath("/dashboard/events");
    return { success: true, data: { id: copy.id } };
  } catch (err) {
    console.error("duplicateEvent failed:", err);
    return { success: false, error: "Could not duplicate event. Please try again." };
  }
}

// ------------------------------
// GET (list with search + filters)
// ------------------------------

export type GetEventsParams = {
  search?: string;
  status?: EventStatus;
  mode?: EventMode;
  page?: number;
  pageSize?: number;
};

export async function getEvents(params: GetEventsParams = {}) {
  const { search, status, mode, page = 1, pageSize = 20 } = params;
  const tenantId = await getTenantId();

  const where: Prisma.EventWhereInput = {
    tenantId,
    ...(status ? { status } : {}),
    ...(mode ? { mode } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { topic: { contains: search } },
            { location: { contains: search } },
          ],
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startDateTime: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { registrations: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total, page, pageSize };
}
