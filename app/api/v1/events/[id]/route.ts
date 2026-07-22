import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventMode, EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

// GET /api/v1/events/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await getTenantId(req);
    const event = await prisma.event.findFirst({
      where: { id: params.id, tenantId },
      include: {
        _count: { select: { registrations: true, speakers: true, sponsors: true, sessions: true } },
      },
    });

    if (!event) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Event not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: event, error: null });
  } catch (err) {
    console.error("GET /api/v1/events/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch event." } },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/events/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const result = await prisma.event.updateMany({
      where: { id: params.id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Event not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id: params.id }, error: null });
  } catch (err) {
    console.error("PATCH /api/v1/events/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not update event." } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/events/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await getTenantId(req);
    const result = await prisma.event.deleteMany({ where: { id: params.id, tenantId } });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Event not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id: params.id }, error: null });
  } catch (err) {
    console.error("DELETE /api/v1/events/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not delete event. It may have related records." } },
      { status: 500 }
    );
  }
}