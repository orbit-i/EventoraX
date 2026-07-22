import { NextRequest, NextResponse } from "next/server";
import { EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

// POST /api/v1/events/:id/duplicate
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await getTenantId(req);
    const original = await prisma.event.findFirst({ where: { id: params.id, tenantId } });

    if (!original) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Event not found or access denied." } },
        { status: 404 }
      );
    }

    const copy = await prisma.event.create({
      data: {
        tenantId,
        title: `${original.title} (Copy)`,
        organizer: original.organizer,
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
        certTemplateId: original.certTemplateId,
        autoIssueCert: original.autoIssueCert,
        status: EventStatus.DRAFT,
      },
    });

    return NextResponse.json({ data: copy, error: null }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/events/:id/duplicate failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not duplicate event." } },
      { status: 500 }
    );
  }
}