import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const categorySchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  label: z.string().min(1, "Label is required").max(100),
});

// GET /api/v1/categories?eventId=
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || undefined;

    if (!eventId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "eventId query param is required." } },
        { status: 400 }
      );
    }

    const categories = await prisma.eventCategory.findMany({
      where: { tenantId, eventId },
      orderBy: { label: "asc" },
    });

    return NextResponse.json({ data: categories, error: null });
  } catch (err) {
    console.error("GET /api/v1/categories failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch categories." } },
      { status: 500 }
    );
  }
}

// POST /api/v1/categories
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

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

    const category = await prisma.eventCategory.create({
      data: { ...parsed.data, tenantId },
    });

    return NextResponse.json({ data: category, error: null }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { data: null, error: { code: "DUPLICATE", message: "A category with this label already exists for this event." } },
        { status: 400 }
      );
    }
    console.error("POST /api/v1/categories failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not create category." } },
      { status: 500 }
    );
  }
}