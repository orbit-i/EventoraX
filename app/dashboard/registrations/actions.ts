"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  RegistrationStatus,
  RegisteredVia,
  RegistrationCategory,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

// TODO: replace with your real auth/session lookup once wired up (same stub as events/actions.ts)
async function getTenantId(): Promise<string> {
  return "tenant_alpha_univ";
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

function generateRefNo(eventId: string) {
  const random = crypto.randomUUID().split("-")[0].toUpperCase();
  return `${eventId.slice(-4).toUpperCase()}-${random}`;
}

// ------------------------------
// VALIDATION SCHEMAS
// ------------------------------

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  rollNo: z.string().optional().nullable(),
  category: z.nativeEnum(RegistrationCategory).default(RegistrationCategory.GUEST),
  registeredVia: z.nativeEnum(RegisteredVia).default(RegisteredVia.ADMIN),
  ticketId: z.string().optional().nullable(),
});

export type RegistrationFormInput = z.infer<typeof registrationSchema>;

const csvRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  rollNo: z.string().optional().nullable(),
  category: z.nativeEnum(RegistrationCategory).optional(),
});

// ------------------------------
// Add attendee (create)
// ------------------------------

export async function createRegistration(
  eventId: string,
  input: RegistrationFormInput
): Promise<ActionResult<{ id: string; refNo: string }>> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const tenantId = await getTenantId();

    const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } });
    if (!event) {
      return { success: false, error: "Event not found or access denied." };
    }

    const registration = await prisma.registration.create({
      data: {
        ...parsed.data,
        tenantId,
        eventId,
        refNo: generateRefNo(eventId),
        status: RegistrationStatus.PENDING,
      },
    });

    revalidatePath(`/dashboard/registrations`);
    revalidatePath(`/dashboard/events/${eventId}`);
    return { success: true, data: { id: registration.id, refNo: registration.refNo } };
  } catch (err) {
    console.error("createRegistration failed:", err);
    return { success: false, error: "Could not add attendee. Please try again." };
  }
}

// ------------------------------
// Update
// ------------------------------

export async function updateRegistration(
  id: string,
  input: Partial<RegistrationFormInput>
): Promise<ActionResult<{ id: string }>> {
  const parsed = registrationSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const tenantId = await getTenantId();
    const result = await prisma.registration.updateMany({
      where: { id, tenantId },
      data: parsed.data,
    });

    if (result.count === 0) {
      return { success: false, error: "Registration not found or access denied." };
    }

    revalidatePath("/dashboard/registrations");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateRegistration failed:", err);
    return { success: false, error: "Could not update registration." };
  }
}

// ------------------------------
// Delete
// ------------------------------

export async function deleteRegistration(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const tenantId = await getTenantId();
    const result = await prisma.registration.deleteMany({ where: { id, tenantId } });

    if (result.count === 0) {
      return { success: false, error: "Registration not found or access denied." };
    }

    revalidatePath("/dashboard/registrations");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("deleteRegistration failed:", err);
    return { success: false, error: "Could not delete registration." };
  }
}

// ------------------------------
// Mark attendance (single)
// ------------------------------

export async function markAttendance(
  id: string,
  attended: boolean = true
): Promise<ActionResult<{ id: string }>> {
  // Your RegistrationStatus enum has no "ABSENT" value — attended=false
  // resets the row to CONFIRMED rather than marking a separate absent state.
  // If you want a true "Absent" status, add it to the enum in schema.prisma
  // and swap the line below to use it.
  const status = attended ? RegistrationStatus.ATTENDED : RegistrationStatus.CONFIRMED;
  try {
    const tenantId = await getTenantId();
    const result = await prisma.registration.updateMany({
      where: { id, tenantId },
      data: { status },
    });

    if (result.count === 0) {
      return { success: false, error: "Registration not found or access denied." };
    }

    revalidatePath("/dashboard/registrations");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("markAttendance failed:", err);
    return { success: false, error: "Could not update attendance." };
  }
}

// ------------------------------
// Get list (filter by event, search, status)
// ------------------------------

export type GetRegistrationsParams = {
  eventId?: string;
  search?: string;
  status?: RegistrationStatus;
  category?: RegistrationCategory;
  page?: number;
  pageSize?: number;
};

export async function getRegistrations(params: GetRegistrationsParams = {}) {
  const { eventId, search, status, category, page = 1, pageSize = 25 } = params;
  const tenantId = await getTenantId();

  const where: Prisma.RegistrationWhereInput = {
    tenantId,
    ...(eventId ? { eventId } : {}),
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.registration.count({ where }),
  ]);

  return { registrations, total, page, pageSize };
}

// ------------------------------
// Bulk actions: mark attended / delete for selected rows
// ------------------------------

export async function bulkMarkAttended(ids: string[]): Promise<ActionResult<{ count: number }>> {
  if (ids.length === 0) return { success: false, error: "No rows selected." };

  try {
    const tenantId = await getTenantId();
    const result = await prisma.registration.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { status: RegistrationStatus.ATTENDED },
    });

    revalidatePath("/dashboard/registrations");
    return { success: true, data: { count: result.count } };
  } catch (err) {
    console.error("bulkMarkAttended failed:", err);
    return { success: false, error: "Could not update selected registrations." };
  }
}

export async function bulkDeleteRegistrations(ids: string[]): Promise<ActionResult<{ count: number }>> {
  if (ids.length === 0) return { success: false, error: "No rows selected." };

  try {
    const tenantId = await getTenantId();
    const result = await prisma.registration.deleteMany({
      where: { id: { in: ids }, tenantId },
    });

    revalidatePath("/dashboard/registrations");
    return { success: true, data: { count: result.count } };
  } catch (err) {
    console.error("bulkDeleteRegistrations failed:", err);
    return { success: false, error: "Could not delete selected registrations." };
  }
}

// ------------------------------
// CSV import (bulk insert from parsed rows)
// ------------------------------

export type CsvImportRow = z.infer<typeof csvRowSchema>;

export type CsvImportResult = {
  insertedCount: number;
  skippedCount: number;
  errors: { row: number; message: string }[];
};

export async function bulkImportRegistrations(
  eventId: string,
  rows: CsvImportRow[]
): Promise<ActionResult<CsvImportResult>> {
  try {
    const tenantId = await getTenantId();
    const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } });
    if (!event) {
      return { success: false, error: "Event not found or access denied." };
    }

    let insertedCount = 0;
    let skippedCount = 0;
    const errors: { row: number; message: string }[] = [];

    // Inserted one at a time (not createMany) so we can report per-row errors
    // back to the CSV preview UI — dataset sizes here are attendee lists, not
    // bulk data warehouse volume, so this is fine performance-wise.
    for (let i = 0; i < rows.length; i++) {
      const parsed = csvRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        skippedCount++;
        errors.push({ row: i + 1, message: parsed.error.issues[0]?.message ?? "Invalid row" });
        continue;
      }

      try {
        await prisma.registration.create({
          data: {
            ...parsed.data,
            category: parsed.data.category ?? RegistrationCategory.GUEST,
            tenantId,
            eventId,
            refNo: generateRefNo(eventId),
            registeredVia: RegisteredVia.CSV_IMPORT,
            status: RegistrationStatus.PENDING,
          },
        });
        insertedCount++;
      } catch (rowErr) {
        skippedCount++;
        errors.push({ row: i + 1, message: "Could not insert this row." });
      }
    }

    revalidatePath("/dashboard/registrations");
    return { success: true, data: { insertedCount, skippedCount, errors } };
  } catch (err) {
    console.error("bulkImportRegistrations failed:", err);
    return { success: false, error: "Import failed. Please try again." };
  }
}

// ------------------------------
// Export (backend data shaping — file generation happens client-side
// with papaparse/xlsx once the export button is wired up, Day 15/16)
// ------------------------------

export async function getRegistrationsForExport(params: GetRegistrationsParams & { ids?: string[] } = {}) {
  const { eventId, search, status, category, ids } = params;
  const tenantId = await getTenantId();

  const where: Prisma.RegistrationWhereInput = {
    tenantId,
    ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
    ...(eventId ? { eventId } : {}),
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
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

  const registrations = await prisma.registration.findMany({ where, orderBy: { registrationDate: "asc" } });

  // Shaped into flat, export-friendly rows (no nested objects/enums-as-is)
  return registrations.map((r) => ({
    RefNo: r.refNo,
    Name: r.name,
    Email: r.email,
    Phone: r.phone ?? "",
    Department: r.department ?? "",
    RollNo: r.rollNo ?? "",
    Category: r.category,
    Status: r.status,
    RegisteredVia: r.registeredVia,
    RegistrationDate: r.registrationDate.toISOString(),
  }));
}

// ------------------------------
// Send email to selected attendees
// ------------------------------
// NOT WIRED TO A REAL EMAIL PROVIDER YET — no SMTP/Resend credentials exist
// in this project. This function validates input and fetches recipients so
// the UI (Day 14+) can be built against a stable contract now. Once your
// team picks a provider, replace the body of `dispatchEmail` below with an
// actual call (e.g. Resend's `resend.emails.send(...)` or nodemailer).

const emailSchema = z.object({
  ids: z.array(z.string()).min(1, "Select at least one attendee"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

async function dispatchEmail(to: string, subject: string, message: string): Promise<void> {
  // TODO: wire up real provider here, e.g.:
  // await resend.emails.send({ from: "...", to, subject, text: message });
  throw new Error("Email provider not configured yet");
}

export async function sendEmailToSelectedAttendees(input: {
  ids: string[];
  subject: string;
  message: string;
}): Promise<ActionResult<{ sent: number; failed: number }>> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const tenantId = await getTenantId();
  const recipients = await prisma.registration.findMany({
    where: { id: { in: parsed.data.ids }, tenantId },
    select: { id: true, email: true },
  });

  if (recipients.length === 0) {
    return { success: false, error: "No matching attendees found." };
  }

  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    try {
      await dispatchEmail(r.email, parsed.data.subject, parsed.data.message);
      sent++;
    } catch {
      failed++;
    }
  }

  // Currently this will always report `failed === recipients.length` until
  // a real provider is wired up — that's expected, not a bug.
  return { success: true, data: { sent, failed } };
}
