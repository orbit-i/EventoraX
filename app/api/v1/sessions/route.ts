import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const sessionSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  speakerId: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required").max(200),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().optional().nullable(),
  displayPublic: z.boolean().default(false),
  displayOrder: z.coerce.number().int().default(0),
}).refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

// GET /api/v1/sessions?eventId=&page=&limit=
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

    const where: Prisma.SessionWhereInput = { tenantId, eventId };

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        orderBy: { displayOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { speaker: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.session.count({ where }),
    ]);

    return NextResponse.json({
      data: sessions,
      error: null,
      meta: { total, page, limit },
    });
  } catch (err) {
    console.error("GET /api/v1/sessions failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch sessions." } },
      { status: 500 }
    );
  }
}

// POST /api/v1/sessions
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = sessionSchema.safeParse(body);

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

    // If a speakerId was given, confirm it belongs to the same tenant + event
    if (parsed.data.speakerId) {
      const speaker = await prisma.speaker.findFirst({
        where: { id: parsed.data.speakerId, tenantId, eventId: parsed.data.eventId },
      });
      if (!speaker) {
        return NextResponse.json(
          { data: null, error: { code: "NOT_FOUND", message: "Speaker not found for this event." } },
          { status: 404 }
        );
      }
    }

    const session = await prisma.session.create({
      data: { ...parsed.data, tenantId },
    });

    return NextResponse.json({ data: session, error: null }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/sessions failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not create session." } },
      { status: 500 }
    );
  }
}