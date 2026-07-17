import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const bulkSchema = z.object({
  action: z.enum(["mark_attended", "mark_absent"]),
  ids: z.array(z.string().min(1)).min(1, "At least one id is required"),
});

// POST /api/v1/registrations/bulk   body: { "action": "mark_attended", "ids": ["id1","id2"] }
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const status = parsed.data.action === "mark_attended" ? RegistrationStatus.ATTENDED : RegistrationStatus.ABSENT;

    const result = await prisma.registration.updateMany({
      where: { id: { in: parsed.data.ids }, tenantId },
      data: { status },
    });

    return NextResponse.json({ data: { updated: result.count }, error: null });
  } catch (err) {
    console.error("POST /api/v1/registrations/bulk failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not perform bulk action." } },
      { status: 500 }
    );
  }
}