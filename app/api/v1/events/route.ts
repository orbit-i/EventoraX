import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventMode, EventStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// TODO: replace with real auth/session lookup once wired up.
async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  organizer: z.string().optional().nullable(),
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
  certTemplateId: z.string().optional().nullable(),
  autoIssueCert: z.boolean().default(false),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
}).refine((data) => data.endDateTime > data.startDateTime, {
  message: "End date/time must be after start date/time",
  path: ["endDateTime"],
});

// GET /api/v1/events?status=&mode=&search=&page=&limit=
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as EventStatus) || undefined;
    const mode = (searchParams.get("mode") as EventMode) || undefined;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

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
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { registrations: true } } },
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      data: events,
      error: null,
      meta: { total, page, limit },
    });
  } catch (err) {
    console.error("GET /api/v1/events failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch events." } },
      { status: 500 }
    );
  }
}

// POST /api/v1/events
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);

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

    const event = await prisma.event.create({
      data: { ...parsed.data, tenantId },
    });

    return NextResponse.json({ data: event, error: null }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/events failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not create event." } },
      { status: 500 }
    );
  }
}