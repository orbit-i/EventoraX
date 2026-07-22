import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { RegisteredVia } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const rowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  rollNo: z.string().optional().nullable(),
  categoryLabel: z.string().optional().nullable(),
});

const confirmSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  rows: z.array(rowSchema).min(1, "At least one row is required"),
});

// POST /api/v1/registrations/csv-import/confirm
// body: { eventId, rows: [{ name, email, phone, department, rollNo, categoryLabel }] }
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = confirmSchema.safeParse(body);

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

    const { eventId, rows } = parsed.data;

    const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } });
    if (!event) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "Event not found or access denied." } },
        { status: 404 }
      );
    }

    // Preload categories for this event so we can resolve categoryLabel -> categoryId
    const categories = await prisma.eventCategory.findMany({ where: { tenantId, eventId } });
    const categoryMap = new Map(categories.map((c) => [c.label.toLowerCase(), c.id]));

    let inserted = 0;
    let skipped = 0;
    const errors: { row: number; email: string; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const categoryId = row.categoryLabel
          ? categoryMap.get(row.categoryLabel.toLowerCase()) ?? null
          : null;

        const refNo = `${eventId.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}-${i}`;

        await prisma.registration.create({
          data: {
            tenantId,
            eventId,
            categoryId,
            refNo,
            name: row.name,
            email: row.email,
            phone: row.phone || null,
            department: row.department || null,
            rollNo: row.rollNo || null,
            registeredVia: RegisteredVia.CSV_IMPORT,
          },
        });
        inserted++;
      } catch (err: any) {
        skipped++;
        errors.push({
          row: i + 1,
          email: row.email,
          reason: err.code === "P2002" ? "Already registered for this event" : "Insert failed",
        });
      }
    }

    return NextResponse.json({
      data: { inserted, skipped, total: rows.length, errors },
      error: null,
    });
  } catch (err) {
    console.error("POST /api/v1/registrations/csv-import/confirm failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not import registrations." } },
      { status: 500 }
    );
  }
}