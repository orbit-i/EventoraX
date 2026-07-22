import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const sessionUpdateSchema = z.object({
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

// GET /api/v1/sessions/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const session = await prisma.session.findFirst({
      where: { id, tenantId },
      include: { speaker: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!session) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Session not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: session, error: null });
  } catch (err) {
    console.error("GET /api/v1/sessions/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch session." } },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/sessions/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = sessionUpdateSchema.safeParse(body);

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

    const result = await prisma.session.updateMany({
      where: { id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Session not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    console.error("PATCH /api/v1/sessions/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not update session." } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/sessions/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const result = await prisma.session.deleteMany({ where: { id, tenantId } });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Session not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    console.error("DELETE /api/v1/sessions/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not delete session." } },
      { status: 500 }
    );
  }
}