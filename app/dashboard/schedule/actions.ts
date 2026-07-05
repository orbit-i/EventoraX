"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// TODO: replace with your real auth/session lookup once wired up
async function getTenantId(): Promise<string> {
  return "tenant_alpha_univ";
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

const sessionSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    location: z.string().optional().nullable(),
    speakerId: z.string().optional().nullable(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type SessionFormInput = z.infer<typeof sessionSchema>;

// ------------------------------
// Create
// ------------------------------

export async function createSession(
  eventId: string,
  input: SessionFormInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const tenantId = await getTenantId();
    const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } });
    if (!event) {
      return { success: false, error: "Event not found or access denied." };
    }

    // If a speaker is set, confirm it belongs to the same event/tenant
    if (parsed.data.speakerId) {
      const speaker = await prisma.speaker.findFirst({
        where: { id: parsed.data.speakerId, eventId, tenantId },
      });
      if (!speaker) {
        return { success: false, error: "Selected speaker does not belong to this event." };
      }
    }

    const currentMax = await prisma.session.aggregate({
      where: { eventId },
      _max: { displayOrder: true },
    });

    const session = await prisma.session.create({
      data: {
        ...parsed.data,
        tenantId,
        eventId,
        displayOrder: (currentMax._max.displayOrder ?? -1) + 1,
      },
    });

    revalidatePath("/dashboard/schedule");
    return { success: true, data: { id: session.id } };
  } catch (err) {
    console.error("createSession failed:", err);
    return { success: false, error: "Could not add session." };
  }
}

// ------------------------------
// Update
// ------------------------------

export async function updateSession(
  id: string,
  input: SessionFormInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const tenantId = await getTenantId();
    const result = await prisma.session.updateMany({
      where: { id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return { success: false, error: "Session not found or access denied." };
    }

    revalidatePath("/dashboard/schedule");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateSession failed:", err);
    return { success: false, error: "Could not update session." };
  }
}

// ------------------------------
// Delete
// ------------------------------

export async function deleteSession(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const tenantId = await getTenantId();
    const result = await prisma.session.deleteMany({ where: { id, tenantId } });

    if (result.count === 0) {
      return { success: false, error: "Session not found or access denied." };
    }

    revalidatePath("/dashboard/schedule");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("deleteSession failed:", err);
    return { success: false, error: "Could not delete session." };
  }
}

// ------------------------------
// Get list (ordered, with speaker name joined in for the table)
// ------------------------------

export async function getSessions(eventId: string) {
  const tenantId = await getTenantId();
  return prisma.session.findMany({
    where: { eventId, tenantId },
    orderBy: { displayOrder: "asc" },
    include: {
      speaker: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ------------------------------
// Reorder
// ------------------------------

export async function reorderSessions(
  eventId: string,
  orderedIds: string[]
): Promise<ActionResult<{ count: number }>> {
  try {
    const tenantId = await getTenantId();

    const updates = orderedIds.map((id, index) =>
      prisma.session.updateMany({
        where: { id, eventId, tenantId },
        data: { displayOrder: index },
      })
    );

    const results = await prisma.$transaction(updates);
    const count = results.reduce((sum, r) => sum + r.count, 0);

    revalidatePath("/dashboard/schedule");
    return { success: true, data: { count } };
  } catch (err) {
    console.error("reorderSessions failed:", err);
    return { success: false, error: "Could not reorder sessions." };
  }
}
