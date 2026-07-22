import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RegistrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const registrationUpdateSchema = z.object({
  categoryId: z.string().optional().nullable(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  rollNo: z.string().optional().nullable(),
  status: z.nativeEnum(RegistrationStatus),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const registration = await prisma.registration.findFirst({
      where: { id, tenantId },
      include: { category: { select: { id: true, label: true } } },
    });

    if (!registration) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Registration not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: registration, error: null });
  } catch (err) {
    console.error("GET /api/v1/registrations/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch registration." } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = registrationUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const result = await prisma.registration.updateMany({
      where: { id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Registration not found or access denied." } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    console.error("PATCH /api/v1/registrations/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not update registration." } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantId(req);
    const result = await prisma.registration.deleteMany({ where: { id, tenantId } });

    if (result.count === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Registration not found or access denied." } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: { id  }, error: null });
  } catch (err) {
    console.error("DELETE /api/v1/registrations/:id failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not delete registration." } },
      { status: 500 }
    );
  }
}