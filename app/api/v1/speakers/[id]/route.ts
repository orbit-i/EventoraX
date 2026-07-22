import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const speakerUpdateSchema = z.object({
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

// GET /api/v1/speakers/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const speaker = await prisma.speaker.findFirst({
      where: { id, tenantId },
    });

    if (!speaker) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Speaker not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: speaker, error: null });
  } catch (err) {
    console.error("GET /api/v1/speakers/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch speaker." } },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/speakers/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = speakerUpdateSchema.safeParse(body);

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

    const result = await prisma.speaker.updateMany({
      where: { id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Speaker not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    console.error("PATCH /api/v1/speakers/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not update speaker." } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/speakers/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const result = await prisma.speaker.deleteMany({ where: { id, tenantId } });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Speaker not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    console.error("DELETE /api/v1/speakers/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not delete speaker." } },
      { status: 500 }
    );
  }
}