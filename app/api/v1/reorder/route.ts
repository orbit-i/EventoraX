import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const reorderSchema = z.object({
  type: z.enum(["speakers", "sessions"]),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        displayOrder: z.coerce.number().int(),
      })
    )
    .min(1, "At least one item is required"),
});

// POST /api/v1/reorder
// Body example:
// { "type": "speakers", "items": [{ "id": "abc", "displayOrder": 0 }, { "id": "def", "displayOrder": 1 }] }
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);

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

    const { type, items } = parsed.data;

    // Run all updates in a single transaction so reordering is all-or-nothing
    if (type === "speakers") {
      await prisma.$transaction(
        items.map((item) =>
          prisma.speaker.updateMany({
            where: { id: item.id, tenantId },
            data: { displayOrder: item.displayOrder },
          })
        )
      );
    } else {
      await prisma.$transaction(
        items.map((item) =>
          prisma.session.updateMany({
            where: { id: item.id, tenantId },
            data: { displayOrder: item.displayOrder },
          })
        )
      );
    }

    return NextResponse.json({ data: { updated: items.length }, error: null });
  } catch (err) {
    console.error("POST /api/v1/reorder failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not reorder items." } },
      { status: 500 }
    );
  }
}