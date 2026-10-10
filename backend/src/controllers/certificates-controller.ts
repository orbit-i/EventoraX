import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "../prisma/client";
import { ok, fail, validationFail, pagination, q } from "../utils/http";
import { isOneOf, isUniqueViolation } from "../utils/schemas";
import { logActivity } from "../utils/activity";
import { listTemplates, renderCertificate, LAYOUTS, VARIANTS, type CertType } from "../pdf/certificate";
import {
  EVENT_FOR_CERT,
  certificateData,
  certificateFileName,
  certificateHash,
  certificatePdf,
  chooseTemplate,
  emailCertificate,
  issueCertificate,
  normaliseVerifyCode,
  verifyUrl,
} from "../services/certificates";

const CERT_TYPES = ["PARTICIPATION", "ACHIEVEMENT", "APPRECIATION", "SPEAKER", "ORGANIZER"] as const;
/** Types that only make sense for people who actually attended. */
const NEEDS_ATTENDANCE: CertType[] = ["PARTICIPATION", "ACHIEVEMENT"];
const BULK_MAX = 1000;

const LIST_INCLUDE = { event: { select: { id: true, title: true, startDateTime: true } } } as const;

function sendPdf(res: Response, pdf: Buffer, fileName: string, inline: boolean) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${fileName}"`);
  res.setHeader("Cache-Control", "private, no-store");
  return res.send(pdf);
}

// GET /api/v1/certificates/templates
export function getTemplates(_req: Request, res: Response) {
  return ok(res, { layouts: LAYOUTS, variants: VARIANTS, templates: listTemplates() });
}

// GET /api/v1/certificates/preview?templateKey=&eventId=&type=   (sample PDF with a SAMPLE watermark)
export async function previewCertificate(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const eventId = q(req.query.eventId);
  const typeQ = q(req.query.type);
  const type: CertType = isOneOf(CERT_TYPES, typeQ) ? typeQ : "PARTICIPATION";

  const event = eventId ? await db.event.findUnique({ where: { id: eventId }, select: EVENT_FOR_CERT }) : null;
  const templateKey = await chooseTemplate(q(req.query.templateKey), event ?? { certTemplateId: null });
  const sampleEvent = event ?? { id: "sample", title: "Your Event Title", startDateTime: new Date(), location: "Your venue", mode: "OFFLINE" };
  const sample = { type, recipientName: "Ayesha Khan", category: null, verifyCode: "EVX-SAMP-LE00", sha256Hash: "0".repeat(64), issuedAt: new Date() };

  const pdf = await renderCertificate(templateKey, { ...certificateData(org, sampleEvent, sample), sample: true });
  return sendPdf(res, pdf, `preview-${templateKey}.pdf`, true);
}

function buildWhere(query: Record<string, unknown>): Prisma.CertificateWhereInput {
  const where: Prisma.CertificateWhereInput = {};
  const eventId = q(query.eventId);
  const status = q(query.status);
  const type = q(query.type);
  const emailed = q(query.emailed);
  const search = q(query.search);
  if (eventId) where.eventId = eventId;
  if (status === "ISSUED" || status === "REVOKED") where.status = status;
  if (isOneOf(CERT_TYPES, type)) where.type = type;
  if (emailed === "yes") where.emailedAt = { not: null };
  if (emailed === "no") where.emailedAt = null;
  if (search) {
    where.OR = [{ recipientName: { contains: search } }, { recipientEmail: { contains: search } }, { verifyCode: { contains: search.toUpperCase() } }];
  }
  return where;
}

// GET /api/v1/certificates?eventId=&status=&type=&emailed=yes|no&search=&page=&limit=
export async function listCertificates(req: Request, res: Response) {
  const db = req.db!;
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const where = buildWhere(query);
  const [items, total] = await Promise.all([
    db.certificate.findMany({ where, include: LIST_INCLUDE, orderBy: { issuedAt: "desc" }, skip, take: limit }),
    db.certificate.count({ where }),
  ]);
  return ok(res, items, 200, { total, page, limit });
}

// GET /api/v1/certificates/stats?eventId=
export async function certificateStats(req: Request, res: Response) {
  const db = req.db!;
  const eventId = q(req.query.eventId);
  const scope = eventId ? { eventId } : {};
  const [issued, revoked, emailed, downloads, awaiting] = await Promise.all([
    db.certificate.count({ where: { ...scope, status: "ISSUED" } }),
    db.certificate.count({ where: { ...scope, status: "REVOKED" } }),
    db.certificate.count({ where: { ...scope, status: "ISSUED", emailedAt: { not: null } } }),
    db.certificate.aggregate({ where: scope, _sum: { downloadCount: true } }),
    db.registration.count({ where: { ...scope, status: "ATTENDED", certificates: { none: { type: "PARTICIPATION" } } } }),
  ]);
  return ok(res, { issued, revoked, emailed, downloads: downloads._sum.downloadCount ?? 0, awaitingParticipation: awaiting });
}

// GET /api/v1/certificates/candidates?eventId=&type=&search=   (attendee picker for "Generate one")
export async function certificateCandidates(req: Request, res: Response) {
  const db = req.db!;
  const eventId = q(req.query.eventId);
  if (!eventId) return fail(res, 400, "VALIDATION_ERROR", "Choose an event first");
  const typeQ = q(req.query.type);
  const type: CertType = isOneOf(CERT_TYPES, typeQ) ? typeQ : "PARTICIPATION";
  const search = q(req.query.search);

  const regs = await db.registration.findMany({
    where: {
      eventId,
      status: { not: "CANCELLED" },
      ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      category: { select: { label: true } },
      certificates: { where: { type }, select: { id: true, verifyCode: true, status: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    take: 30,
  });
  return ok(
    res,
    regs.map(({ certificates, ...r }) => ({
      ...r,
      existing: certificates[0] ?? null,
      eligible: certificates.length === 0 && (!NEEDS_ATTENDANCE.includes(type) || r.status === "ATTENDED"),
    }))
  );
}

const issueSchema = z.object({
  registrationId: z.string().min(1, "Choose an attendee"),
  type: z.enum(CERT_TYPES).default("PARTICIPATION"),
  templateKey: z.string().max(50).optional(),
  sendEmail: z.boolean().default(false),
});

// POST /api/v1/certificates   { registrationId, type?, templateKey?, sendEmail? }
export async function issueOne(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const parsed = issueSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const { registrationId, type, sendEmail } = parsed.data;

  const reg = await db.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, name: true, email: true, status: true, category: { select: { label: true } }, event: { select: EVENT_FOR_CERT } },
  });
  if (!reg) return fail(res, 404, "NOT_FOUND", "Attendee not found");
  if (reg.status === "CANCELLED") return fail(res, 400, "REGISTRATION_CANCELLED", "This registration is cancelled, so it can't get a certificate");
  if (NEEDS_ATTENDANCE.includes(type) && reg.status !== "ATTENDED") {
    return fail(res, 400, "NOT_ATTENDED", `Mark ${reg.name} as attended first — ${type.toLowerCase()} certificates are only for people who attended`);
  }

  const templateKey = await chooseTemplate(parsed.data.templateKey, reg.event);
  try {
    const cert = await issueCertificate(db, org, reg.event, reg, { type, templateKey });
    if (sendEmail) await emailCertificate(db, org, reg.event, cert);
    await logActivity(req, {
      action: "certificate.issue",
      entityType: "Certificate",
      entityId: cert.id,
      metadata: { name: reg.name, type, verifyCode: cert.verifyCode },
    });
    const fresh = await db.certificate.findUnique({ where: { id: cert.id }, include: LIST_INCLUDE });
    return ok(res, fresh, 201);
  } catch (err) {
    if (isUniqueViolation(err)) return fail(res, 409, "ALREADY_ISSUED", `${reg.name} already has a ${type.toLowerCase()} certificate for this event`);
    throw err;
  }
}

const bulkSchema = z.object({
  eventId: z.string().min(1, "Choose an event"),
  type: z.enum(CERT_TYPES).default("PARTICIPATION"),
  templateKey: z.string().max(50).optional(),
  sendEmail: z.boolean().default(false),
});

// POST /api/v1/certificates/bulk   { eventId, type?, templateKey?, sendEmail? }
// Issues a certificate to every ATTENDED attendee of the event who doesn't have one of this type yet.
export async function issueBulk(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const parsed = bulkSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const { eventId, type, sendEmail } = parsed.data;

  const event = await db.event.findUnique({ where: { id: eventId }, select: { ...EVENT_FOR_CERT, status: true } });
  if (!event) return fail(res, 404, "NOT_FOUND", "Event not found");

  const regs = await db.registration.findMany({
    where: { eventId, status: "ATTENDED", certificates: { none: { type } } },
    select: { id: true, name: true, email: true, category: { select: { label: true } } },
    orderBy: { name: "asc" },
    take: BULK_MAX,
  });
  if (regs.length === 0) {
    return ok(res, { issued: 0, failed: 0, emailed: 0, message: "Everyone who attended already has this certificate." });
  }

  const templateKey = await chooseTemplate(parsed.data.templateKey, event);
  let issued = 0;
  let failed = 0;
  const created = [];
  for (const reg of regs) {
    try {
      created.push(await issueCertificate(db, org, event, reg, { type, templateKey }));
      issued++;
    } catch (err) {
      failed++;
      if (!isUniqueViolation(err)) console.error(`Certificate for registration ${reg.id} failed:`, err);
    }
  }

  await logActivity(req, {
    action: "certificate.bulk",
    entityType: "Event",
    entityId: eventId,
    metadata: { title: event.title, issued, type, emailing: sendEmail },
  });

  // Emails go out in the background so a big event doesn't keep the browser waiting.
  if (sendEmail && created.length > 0) {
    void (async () => {
      for (const cert of created) {
        await emailCertificate(db, org, event, cert).catch((err) => console.error(`Emailing certificate ${cert.id} failed:`, err));
      }
    })();
  }

  return ok(res, { issued, failed, emailing: sendEmail ? created.length : 0 }, 201);
}

async function loadCert(req: Request) {
  return req.db!.certificate.findUnique({ where: { id: String(req.params.id) }, include: { event: { select: EVENT_FOR_CERT } } });
}

// GET /api/v1/certificates/:id/pdf?inline=1
export async function downloadCertificate(req: Request, res: Response) {
  const cert = await loadCert(req);
  if (!cert) return fail(res, 404, "NOT_FOUND", "Certificate not found");
  const pdf = await certificatePdf(req.org!, cert.event, cert);
  const inline = q(req.query.inline) === "1";
  if (!inline) await req.db!.certificate.update({ where: { id: cert.id }, data: { downloadCount: { increment: 1 } } });
  return sendPdf(res, pdf, certificateFileName(cert), inline);
}

// POST /api/v1/certificates/:id/email
export async function emailOne(req: Request, res: Response) {
  const cert = await loadCert(req);
  if (!cert) return fail(res, 404, "NOT_FOUND", "Certificate not found");
  if (cert.status === "REVOKED") return fail(res, 400, "REVOKED", "Revoked certificates can't be emailed");
  await emailCertificate(req.db!, req.org!, cert.event, cert);
  await logActivity(req, { action: "certificate.email", entityType: "Certificate", entityId: cert.id, metadata: { name: cert.recipientName } });
  return ok(res, { id: cert.id, emailedAt: new Date() });
}

const emailManySchema = z.object({ ids: z.array(z.string().min(1)).min(1, "Select at least one certificate").max(BULK_MAX) });

// POST /api/v1/certificates/email   { ids }   (revoked ones are skipped; sends in the background)
export async function emailMany(req: Request, res: Response) {
  const db = req.db!;
  const org = req.org!;
  const parsed = emailManySchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);

  const certs = await db.certificate.findMany({
    where: { id: { in: parsed.data.ids }, status: "ISSUED" },
    include: { event: { select: EVENT_FOR_CERT } },
  });
  void (async () => {
    for (const cert of certs) {
      await emailCertificate(db, org, cert.event, cert).catch((err) => console.error(`Emailing certificate ${cert.id} failed:`, err));
    }
  })();
  await logActivity(req, { action: "certificate.email.bulk", metadata: { count: certs.length } });
  return ok(res, { sending: certs.length, skipped: parsed.data.ids.length - certs.length });
}

const revokeSchema = z.object({ reason: z.string().trim().min(3, "Give a short reason (it's shown on the verify page)").max(500) });

// POST /api/v1/certificates/:id/revoke   { reason }
export async function revokeCertificate(req: Request, res: Response) {
  const parsed = revokeSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const cert = await loadCert(req);
  if (!cert) return fail(res, 404, "NOT_FOUND", "Certificate not found");
  if (cert.status === "REVOKED") return fail(res, 409, "ALREADY_REVOKED", "This certificate is already revoked");

  const updated = await req.db!.certificate.update({
    where: { id: cert.id },
    data: { status: "REVOKED", revokedAt: new Date(), revokeReason: parsed.data.reason },
    include: LIST_INCLUDE,
  });
  await logActivity(req, { action: "certificate.revoke", entityType: "Certificate", entityId: cert.id, metadata: { name: cert.recipientName, reason: parsed.data.reason } });
  return ok(res, updated);
}

// POST /api/v1/certificates/:id/restore   (undo a revoke)
export async function restoreCertificate(req: Request, res: Response) {
  const cert = await loadCert(req);
  if (!cert) return fail(res, 404, "NOT_FOUND", "Certificate not found");
  if (cert.status === "ISSUED") return ok(res, cert);
  const updated = await req.db!.certificate.update({
    where: { id: cert.id },
    data: { status: "ISSUED", revokedAt: null, revokeReason: null },
    include: LIST_INCLUDE,
  });
  await logActivity(req, { action: "certificate.restore", entityType: "Certificate", entityId: cert.id, metadata: { name: cert.recipientName } });
  return ok(res, updated);
}

// ─────────────────────────── Public verification ───────────────────────────

async function findPublic(codeParam: string) {
  const code = normaliseVerifyCode(codeParam);
  return prisma.certificate.findUnique({
    where: { verifyCode: code },
    include: {
      event: { select: { id: true, title: true, startDateTime: true, location: true, mode: true } },
    },
  });
}

// GET /api/v1/verify/:code   (no login)
export async function publicVerify(req: Request, res: Response) {
  const cert = await findPublic(String(req.params.code));
  if (!cert) return fail(res, 404, "NOT_FOUND", "No certificate has this code. Check it and try again.");

  const org = await prisma.organization.findUnique({ where: { id: cert.organizationId }, select: { name: true, whiteLabelName: true, logoUrl: true } });
  const hashMatches = certificateHash(cert) === cert.sha256Hash;
  const valid = hashMatches && cert.status === "ISSUED";

  return ok(res, {
    valid,
    status: !hashMatches ? "TAMPERED" : cert.status,
    verifyCode: cert.verifyCode,
    recipientName: cert.recipientName,
    type: cert.type,
    category: cert.category,
    event: { title: cert.event.title, date: cert.event.startDateTime, location: cert.event.mode === "ONLINE" ? "Online" : cert.event.location },
    organization: { name: org?.whiteLabelName || org?.name || "", logoUrl: org?.logoUrl ?? null },
    issuedAt: cert.issuedAt,
    sha256Hash: cert.sha256Hash,
    revokedAt: cert.revokedAt,
    revokeReason: cert.revokeReason,
    verifyUrl: verifyUrl(cert.verifyCode),
  });
}

// GET /api/v1/verify/:code/pdf   (valid certificates only)
export async function publicCertificatePdf(req: Request, res: Response) {
  const cert = await findPublic(String(req.params.code));
  if (!cert || cert.status !== "ISSUED" || certificateHash(cert) !== cert.sha256Hash) {
    return fail(res, 404, "NOT_FOUND", "This certificate isn't available");
  }
  const org = await prisma.organization.findUnique({ where: { id: cert.organizationId } });
  if (!org) return fail(res, 404, "NOT_FOUND", "This certificate isn't available");
  const pdf = await certificatePdf(org, cert.event, cert);
  await prisma.certificate.update({ where: { id: cert.id }, data: { downloadCount: { increment: 1 } } });
  return sendPdf(res, pdf, certificateFileName(cert), q(req.query.inline) === "1");
}
