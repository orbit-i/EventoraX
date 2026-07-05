"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { SponsorTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// TODO: replace with your real auth/session lookup once wired up
async function getTenantId(): Promise<string> {
  return "tenant_alpha_univ";
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

const sponsorSchema = z.object({
  name: z.string().min(1, "Sponsor name is required").max(150),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
  website: z.string().url().optional().nullable().or(z.literal("")),
  logo: z.string().url().optional().nullable().or(z.literal("")),
  tier: z.nativeEnum(SponsorTier).default(SponsorTier.BRONZE),
});

export type SponsorFormInput = z.infer<typeof sponsorSchema>;

// ------------------------------
// Create
// ------------------------------

export async function createSponsor(
  eventId: string,
  input: SponsorFormInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = sponsorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const tenantId = await getTenantId();
    const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } });
    if (!event) {
      return { success: false, error: "Event not found or access denied." };
    }

    const currentMax = await prisma.sponsor.aggregate({
      where: { eventId },
      _max: { displayOrder: true },
    });

    const sponsor = await prisma.sponsor.create({
      data: {
        ...parsed.data,
        tenantId,
        eventId,
        displayOrder: (currentMax._max.displayOrder ?? -1) + 1,
      },
    });

    revalidatePath("/dashboard/sponsors");
    return { success: true, data: { id: sponsor.id } };
  } catch (err) {
    console.error("createSponsor failed:", err);
    return { success: false, error: "Could not add sponsor." };
  }
}

// ------------------------------
// Update
// ------------------------------

export async function updateSponsor(
  id: string,
  input: SponsorFormInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = sponsorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const tenantId = await getTenantId();
    const result = await prisma.sponsor.updateMany({
      where: { id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return { success: false, error: "Sponsor not found or access denied." };
    }

    revalidatePath("/dashboard/sponsors");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateSponsor failed:", err);
    return { success: false, error: "Could not update sponsor." };
  }
}

// ------------------------------
// Delete
// ------------------------------

export async function deleteSponsor(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const tenantId = await getTenantId();
    const result = await prisma.sponsor.deleteMany({ where: { id, tenantId } });

    if (result.count === 0) {
      return { success: false, error: "Sponsor not found or access denied." };
    }

    revalidatePath("/dashboard/sponsors");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("deleteSponsor failed:", err);
    return { success: false, error: "Could not delete sponsor." };
  }
}

// ------------------------------
// Get list (ordered, tier included for badge display)
// ------------------------------

export async function getSponsors(eventId: string) {
  const tenantId = await getTenantId();
  return prisma.sponsor.findMany({
    where: { eventId, tenantId },
    orderBy: { displayOrder: "asc" },
  });
}

// ------------------------------
// Reorder (bonus — not on your checklist, but displayOrder already exists
// on the Sponsor model, so this is free/consistent with Speakers/Schedule)
// ------------------------------

export async function reorderSponsors(
  eventId: string,
  orderedIds: string[]
): Promise<ActionResult<{ count: number }>> {
  try {
    const tenantId = await getTenantId();

    const updates = orderedIds.map((id, index) =>
      prisma.sponsor.updateMany({
        where: { id, eventId, tenantId },
        data: { displayOrder: index },
      })
    );

    const results = await prisma.$transaction(updates);
    const count = results.reduce((sum, r) => sum + r.count, 0);

    revalidatePath("/dashboard/sponsors");
    return { success: true, data: { count } };
  } catch (err) {
    console.error("reorderSponsors failed:", err);
    return { success: false, error: "Could not reorder sponsors." };
  }
}
