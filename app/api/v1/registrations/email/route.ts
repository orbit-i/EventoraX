import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function getTenantId(req: NextRequest): Promise<string> {
  return "tenant_alpha_univ";
}

const emailSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "At least one id is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

// PLACEHOLDER: replace with real email sending (nodemailer/Resend/SendGrid) once credentials are ready.
async function sendEmailPlaceholder(to: string, subject: string, message: string) {
  console.log(`[EMAIL PLACEHOLDER] To: ${to} | Subject: ${subject} | Message: ${message}`);
  return true;
}

// POST /api/v1/registrations/email   body: { "ids": [...], "subject": "...", "message": "..." }
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors } },
        { status: 400 }
      );
    }

    const registrations = await prisma.registration.findMany({
      where: { id: { in: parsed.data.ids }, tenantId },
      select: { id: true, email: true, name: true },
    });

    if (registrations.length === 0) {
      return NextResponse.json(
        { data: null, error: { code: "NOT_FOUND", message: "No matching registrations found." } },
        { status: 404 }
      );
    }

    let sentCount = 0;
    for (const reg of registrations) {
      const ok = await sendEmailPlaceholder(reg.email, parsed.data.subject, parsed.data.message);
      if (ok) sentCount++;
    }

    return NextResponse.json({ data: { sent: sentCount, total: registrations.length }, error: null });
  } catch (err) {
    console.error("POST /api/v1/registrations/email failed:", err);
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Could not send emails." } },
      { status: 500 }
    );
  }
}