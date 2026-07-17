import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const attendanceSchema = z.object({
  status: z.enum([RegistrationStatus.ATTENDED, RegistrationStatus.ABSENT]),
});

// PATCH /api/v1/registrations/:id/attendance   body: { "status": "ATTENDED" | "ABSENT" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = attendanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "status must be ATTENDED or ABSENT." } },
        { status: 400 }
      );
    }

    const result = await prisma.registration.updateMany({
      where: { id: params.id, tenantId },
      data: { status: parsed.data.status },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Registration not found or access denied." } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: { id: params.id, status: parsed.data.status }, error: null });
  } catch (err) {
    console.error("PATCH /api/v1/registrations/:id/attendance failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not mark attendance." } },
      { status: 500 }
    );
  }
}