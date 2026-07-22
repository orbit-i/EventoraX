import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const categoryUpdateSchema = z.object({
  label: z.string().min(1, "Label is required").max(100),
});

// PATCH /api/v1/categories/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = categoryUpdateSchema.safeParse(body);

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

    const result = await prisma.eventCategory.updateMany({
      where: { id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Category not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { data: null, error: { code: "DUPLICATE", message: "A category with this label already exists for this event." } },
        { status: 400 }
      );
    }
    console.error("PATCH /api/v1/categories/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not update category." } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/categories/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);

    const result = await prisma.eventCategory.deleteMany({ where: { id, tenantId } });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Category not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    console.error("DELETE /api/v1/categories/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not delete category." } },
      { status: 500 }
    );
  }
}