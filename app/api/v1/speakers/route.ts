import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// TODO: replace with real auth/session lookup once wired up.
async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const speakerSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  title: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  sessionTopic: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  linkedin: z.string().url().optional().nullable().or(z.literal("")),
  displayPublic: z.boolean().default(false),
  displayOrder: z.coerce.number().int().default(0),
});

// GET /api/v1/speakers?eventId=&page=&limit=
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const { searchParams } = new URL(req.url);

    const eventId = searchParams.get("eventId") || undefined;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    if (!eventId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "eventId query param is required." } },
        { status: 400 }
      );
    }

    const where: Prisma.SpeakerWhereInput = { tenantId, eventId };

    const [speakers, total] = await Promise.all([
      prisma.speaker.findMany({
        where,
        orderBy: { displayOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.speaker.count({ where }),
    ]);

    return NextResponse.json({
      data: speakers,
      error: null,
      meta: { total, page, limit },
    });
  } catch (err) {
    console.error("GET /api/v1/speakers failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch speakers." } },
      { status: 500 }
    );
  }
}

// POST /api/v1/speakers
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = speakerSchema.safeParse(body);

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

    const event = await prisma.event.findFirst({
      where: { id: parsed.data.eventId, tenantId },
    });
    if (!event) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Event not found or access denied." } },
        { status: 404 }
      );
    }

    const speaker = await prisma.speaker.create({
      data: { ...parsed.data, tenantId },
    });

    return NextResponse.json({ data: speaker, error: null }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/speakers failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not create speaker." } },
      { status: 500 }
    );
  }
}