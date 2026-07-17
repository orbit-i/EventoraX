import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SponsorTier, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// TODO: replace with real auth/session lookup once wired up.
async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const sponsorSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  name: z.string().min(1, "Name is required").max(200),
  website: z.string().url().optional().nullable().or(z.literal("")),
  logo: z.string().optional().nullable(),
  tier: z.nativeEnum(SponsorTier).default(SponsorTier.BRONZE),
  displayPublic: z.boolean().default(false),
  displayOrder: z.coerce.number().int().default(0),
});

// GET /api/v1/sponsors?eventId=&tier=&page=&limit=
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const { searchParams } = new URL(req.url);

    const eventId = searchParams.get("eventId") || undefined;
    const tier = (searchParams.get("tier") as SponsorTier) || undefined;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    if (!eventId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "eventId query param is required." } },
        { status: 400 }
      );
    }

    const where: Prisma.SponsorWhereInput = {
      tenantId,
      eventId,
      ...(tier ? { tier } : {}),
    };

    const [sponsors, total] = await Promise.all([
      prisma.sponsor.findMany({
        where,
        orderBy: { displayOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sponsor.count({ where }),
    ]);

    return NextResponse.json({
      data: sponsors,
      error: null,
      meta: { total, page, limit },
    });
  } catch (err) {
    console.error("GET /api/v1/sponsors failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch sponsors." } },
      { status: 500 }
    );
  }
}

// POST /api/v1/sponsors
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = sponsorSchema.safeParse(body);

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

    // Confirm the event exists and belongs to this tenant, so sponsors can't attach to someone else's event
    const event = await prisma.event.findFirst({
      where: { id: parsed.data.eventId, tenantId },
    });
    if (!event) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Event not found or access denied." } },
        { status: 404 }
      );
    }

    const sponsor = await prisma.sponsor.create({
      data: { ...parsed.data, tenantId },
    });

    return NextResponse.json({ data: sponsor, error: null }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/sponsors failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not create sponsor." } },
      { status: 500 }
    );
  }
}