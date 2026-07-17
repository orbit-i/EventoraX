import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RegistrationStatus, RegisteredVia, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const registrationSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  categoryId: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  rollNo: z.string().optional().nullable(),
  registeredVia: z.nativeEnum(RegisteredVia).default(RegisteredVia.WEB),
  status: z.nativeEnum(RegistrationStatus).default(RegistrationStatus.REGISTERED),
});

// GET /api/v1/registrations?eventId=&status=&categoryId=&search=&page=&limit=
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const { searchParams } = new URL(req.url);

    const eventId = searchParams.get("eventId") || undefined;
    const status = (searchParams.get("status") as RegistrationStatus) || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    if (!eventId) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "eventId query param is required." } },
        { status: 400 }
      );
    }

    const where: Prisma.RegistrationWhereInput = {
      tenantId,
      eventId,
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { refNo: { contains: search } },
            ],
          }
        : {}),
    };

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: { registrationDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { id: true, label: true } } },
      }),
      prisma.registration.count({ where }),
    ]);

    return NextResponse.json({
      data: registrations,
      error: null,
      meta: { total, page, limit },
    });
  } catch (err) {
    console.error("GET /api/v1/registrations failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not fetch registrations." } },
      { status: 500 }
    );
  }
}

// POST /api/v1/registrations  (Add attendee — also the trigger point Isha's QR Tickets hooks into)
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = registrationSchema.safeParse(body);

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

    const event = await prisma.event.findFirst({ where: { id: parsed.data.eventId, tenantId } });
    if (!event) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Event not found or access denied." } },
        { status: 404 }
      );
    }

    // Auto-generate a unique reference number
    const refNo = `${parsed.data.eventId.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const registration = await prisma.registration.create({
      data: { ...parsed.data, tenantId, refNo },
    });

    // TODO (Isha's QR Tickets hook): trigger QR ticket generation here once contract is confirmed
    // e.g. await triggerQrTicketCreation(registration.id);

    return NextResponse.json({ data: registration, error: null }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { data: null, error: { code: "DUPLICATE", message: "This email is already registered for this event." } },
        { status: 400 }
      );
    }
    console.error("POST /api/v1/registrations failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not create registration." } },
      { status: 500 }
    );
  }
}