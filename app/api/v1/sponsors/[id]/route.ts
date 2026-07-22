import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SponsorTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const sponsorUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  website: z.string().url().optional().nullable().or(z.literal("")),
  logo: z.string().optional().nullable(),
  tier: z.nativeEnum(SponsorTier).default(SponsorTier.BRONZE),
  displayPublic: z.boolean().default(false),
  displayOrder: z.coerce.number().int().default(0),
});

// GET /api/v1/sponsors/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const sponsor = await prisma.sponsor.findFirst({
      where: { id, tenantId },
    });

    if (!sponsor) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Sponsor not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: sponsor, error: null });
  } catch (err) {
    console.error("GET /api/v1/sponsors/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch sponsor." } },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/sponsors/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = sponsorUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            fieldErrors: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const result = await prisma.sponsor.updateMany({
      where: { id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Sponsor not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    console.error("PATCH /api/v1/sponsors/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not update sponsor." } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/sponsors/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const result = await prisma.sponsor.deleteMany({ where: { id, tenantId } });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Sponsor not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    console.error("DELETE /api/v1/sponsors/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not delete sponsor." } },
      { status: 500 }
    );
  }
}