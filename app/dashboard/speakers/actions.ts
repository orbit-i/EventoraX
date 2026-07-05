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

const speakerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  title: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  sessionTopic: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  photo: z.string().url().optional().nullable().or(z.literal("")),
  linkedin: z.string().url().optional().nullable().or(z.literal("")),
});

export type SpeakerFormInput = z.infer<typeof speakerSchema>;

// ------------------------------
// Create
// ------------------------------

export async function createSpeaker(
  eventId: string,
  input: SpeakerFormInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = speakerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const tenantId = await getTenantId();
    const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } });
    if (!event) {
      return { success: false, error: "Event not found or access denied." };
    }

    const currentMax = await prisma.speaker.aggregate({
      where: { eventId },
      _max: { displayOrder: true },
    });

    const speaker = await prisma.speaker.create({
      data: {
        ...parsed.data,
        tenantId,
        eventId,
        displayOrder: (currentMax._max.displayOrder ?? -1) + 1,
      },
    });

    revalidatePath("/dashboard/speakers");
    return { success: true, data: { id: speaker.id } };
  } catch (err) {
    console.error("createSpeaker failed:", err);
    return { success: false, error: "Could not add speaker." };
  }
}

// ------------------------------
// Update
// ------------------------------

export async function updateSpeaker(
  id: string,
  input: SpeakerFormInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = speakerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const tenantId = await getTenantId();
    const result = await prisma.speaker.updateMany({
      where: { id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return { success: false, error: "Speaker not found or access denied." };
    }

    revalidatePath("/dashboard/speakers");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateSpeaker failed:", err);
    return { success: false, error: "Could not update speaker." };
  }
}

// ------------------------------
// Delete
// ------------------------------

export async function deleteSpeaker(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const tenantId = await getTenantId();
    const result = await prisma.speaker.deleteMany({ where: { id, tenantId } });

    if (result.count === 0) {
      return { success: false, error: "Speaker not found or access denied." };
    }

    revalidatePath("/dashboard/speakers");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("deleteSpeaker failed:", err);
    return { success: false, error: "Could not delete speaker." };
  }
}

// ------------------------------
// Get list (ordered)
// ------------------------------

export async function getSpeakers(eventId: string) {
  const tenantId = await getTenantId();
  return prisma.speaker.findMany({
    where: { eventId, tenantId },
    orderBy: { displayOrder: "asc" },
  });
}

// ------------------------------
// Reorder (up/down buttons — pass the full ordered list of IDs after the move)
// ------------------------------

export async function reorderSpeakers(
  eventId: string,
  orderedIds: string[]
): Promise<ActionResult<{ count: number }>> {
  try {
    const tenantId = await getTenantId();

    const updates = orderedIds.map((id, index) =>
      prisma.speaker.updateMany({
        where: { id, eventId, tenantId },
        data: { displayOrder: index },
      })
    );

    const results = await prisma.$transaction(updates);
    const count = results.reduce((sum, r) => sum + r.count, 0);

    revalidatePath("/dashboard/speakers");
    return { success: true, data: { count } };
  } catch (err) {
    console.error("reorderSpeakers failed:", err);
    return { success: false, error: "Could not reorder speakers." };
  }
}
