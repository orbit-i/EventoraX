import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "../../prisma/client";
import { ok, fail, validationFail, pagination, q } from "../../utils/http";
import { isOneOf } from "../../utils/schemas";
import { logActivity } from "../../utils/activity";
import { certificateData, certificateFileName, certificateHash, certificatePdf, normaliseVerifyCode, verifyUrl } from "../../services/certificates";
import { LAYOUTS, VARIANTS, listTemplates, renderCertificate, isTemplateKey, DEFAULT_TEMPLATE } from "../../pdf/certificate";

const STATUSES = ["ISSUED", "REVOKED"] as const;
const TYPES = ["PARTICIPATION", "ACHIEVEMENT", "APPRECIATION", "SPEAKER", "ORGANIZER"] as const;

const LIST_INCLUDE = {
  event: { select: { id: true, title: true, startDateTime: true } },
} as const;

function buildWhere(query: Record<string, unknown>): Prisma.CertificateWhereInput {
  const where: Prisma.CertificateWhereInput = {};
  const status = q(query.status);
  const type = q(query.type);
  const orgId = q(query.orgId);
  const eventId = q(query.eventId);
  const search = q(query.search);
  if (isOneOf(STATUSES, status)) where.status = status;
  if (isOneOf(TYPES, type)) where.type = type;
  if (orgId) where.organizationId = orgId;
  if (eventId) where.eventId = eventId;
  if (search) {
    const code = normaliseVerifyCode(search);
    where.OR = [{ verifyCode: { contains: code } }, { recipientName: { contains: search } }, { recipientEmail: { contains: search } }];
  }
  return where;
}

/** Certificates only store organizationId, so organization names are looked up in one query. */
async function withOrgs<T extends { organizationId: string }>(rows: T[]) {
  const ids = [...new Set(rows.map((r) => r.organizationId))];
  const orgs = ids.length ? await prisma.organization.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
  const byId = new Map(orgs.map((o) => [o.id, o]));
  return rows.map((r) => ({ ...r, organization: byId.get(r.organizationId) ?? null }));
}

// GET /api/v1/superadmin/certificates?search=&status=&type=&orgId=&eventId=&page=&limit=
export async function listAllCertificates(req: Request, res: Response) {
  const query = req.query as Record<string, unknown>;
  const { page, limit, skip } = pagination(query);
  const where = buildWhere(query);
  const [rows, total] = await Promise.all([
    prisma.certificate.findMany({ where, include: LIST_INCLUDE, orderBy: { issuedAt: "desc" }, skip, take: limit }),
    prisma.certificate.count({ where }),
  ]);
  return ok(res, await withOrgs(rows), 200, { total, page, limit });
}

// GET /api/v1/superadmin/certificates/stats
export async function allCertificateStats(_req: Request, res: Response) {
  const [issued, revoked, downloads, orgs] = await Promise.all([
    prisma.certificate.count({ where: { status: "ISSUED" } }),
    prisma.certificate.count({ where: { status: "REVOKED" } }),
    prisma.certificate.aggregate({ _sum: { downloadCount: true } }),
    prisma.certificate.groupBy({ by: ["organizationId"] }),
  ]);
  return ok(res, { issued, revoked, downloads: downloads._sum.downloadCount ?? 0, organizations: orgs.length });
}

// GET /api/v1/superadmin/certificates/events?orgId=   (events that have certificates — for the bulk revoke picker)
export async function certificateEvents(req: Request, res: Response) {
  const orgId = q(req.query.orgId);
  const events = await prisma.event.findMany({
    where: { ...(orgId ? { organizationId: orgId } : {}), certificates: { some: {} } },
    orderBy: { startDateTime: "desc" },
    take: 200,
    select: { id: true, title: true, startDateTime: true, organization: { select: { id: true, name: true } }, _count: { select: { certificates: true } } },
  });
  return ok(res, events.map(({ _count, ...e }) => ({ ...e, certificates: _count.certificates })));
}

async function findCert(req: Request) {
  return prisma.certificate.findUnique({
    where: { id: String(req.params.id) },
    include: { event: { select: { id: true, title: true, startDateTime: true, location: true, mode: true } } },
  });
}

// GET /api/v1/superadmin/certificates/:id
export async function getCertificate(req: Request, res: Response) {
  const cert = await findCert(req);
  if (!cert) return fail(res, 404, "NOT_FOUND", "Certificate not found");
  const [withOrg] = await withOrgs([cert]);
  return ok(res, { ...withOrg, hashMatches: certificateHash(cert) === cert.sha256Hash, verifyUrl: verifyUrl(cert.verifyCode) });
}

// GET /api/v1/superadmin/certificates/:id/pdf?inline=1   (not counted as a download)
export async function certificatePdfForAdmin(req: Request, res: Response) {
  const cert = await findCert(req);
  if (!cert) return fail(res, 404, "NOT_FOUND", "Certificate not found");
  const org = await prisma.organization.findUnique({ where: { id: cert.organizationId } });
  if (!org) return fail(res, 404, "NOT_FOUND", "Organization not found");
  const pdf = await certificatePdf(org, cert.event, cert);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${q(req.query.inline) === "1" ? "inline" : "attachment"}; filename="${certificateFileName(cert)}"`);
  res.setHeader("Cache-Control", "private, no-store");
  return res.send(pdf);
}

const reasonSchema = z.object({
  reason: z.string({ error: "Give a short reason (it's shown on the verify page)" }).trim().min(3, "Give a short reason (it's shown on the verify page)").max(500),
});

// POST /api/v1/superadmin/certificates/:id/revoke   { reason }
export async function revokeAnyCertificate(req: Request, res: Response) {
  const parsed = reasonSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const cert = await findCert(req);
  if (!cert) return fail(res, 404, "NOT_FOUND", "Certificate not found");
  if (cert.status === "REVOKED") return fail(res, 409, "ALREADY_REVOKED", "This certificate is already revoked");
  await prisma.certificate.update({ where: { id: cert.id }, data: { status: "REVOKED", revokedAt: new Date(), revokeReason: parsed.data.reason } });
  await logActivity(req, {
    action: "platform.certificate.revoke",
    entityType: "Certificate",
    entityId: cert.id,
    metadata: { name: cert.recipientName, code: cert.verifyCode, reason: parsed.data.reason, orgId: cert.organizationId },
  });
  return ok(res, { id: cert.id, status: "REVOKED" });
}

// POST /api/v1/superadmin/certificates/:id/restore
export async function restoreAnyCertificate(req: Request, res: Response) {
  const cert = await findCert(req);
  if (!cert) return fail(res, 404, "NOT_FOUND", "Certificate not found");
  if (cert.status !== "REVOKED") return fail(res, 409, "NOT_REVOKED", "This certificate isn't revoked");
  await prisma.certificate.update({ where: { id: cert.id }, data: { status: "ISSUED", revokedAt: null, revokeReason: null } });
  await logActivity(req, { action: "platform.certificate.restore", entityType: "Certificate", entityId: cert.id, metadata: { name: cert.recipientName, code: cert.verifyCode } });
  return ok(res, { id: cert.id, status: "ISSUED" });
}

const bulkSchema = z
  .object({
    eventId: z.string().min(1).optional(),
    orgId: z.string().min(1).optional(),
    reason: reasonSchema.shape.reason,
    dryRun: z.boolean().default(false),
  })
  .refine((v) => Boolean(v.eventId) !== Boolean(v.orgId), { message: "Choose one event or one organization", path: ["eventId"] });

// POST /api/v1/superadmin/certificates/bulk-revoke   { eventId | orgId, reason, dryRun? }
// dryRun: true only counts what would be revoked (for the confirmation step).
export async function bulkRevoke(req: Request, res: Response) {
  const parsed = bulkSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationFail(res, parsed.error);
  const { eventId, orgId, reason, dryRun } = parsed.data;
  const where: Prisma.CertificateWhereInput = { status: "ISSUED", ...(eventId ? { eventId } : { organizationId: orgId }) };
  if (dryRun) return ok(res, { dryRun: true, count: await prisma.certificate.count({ where }) });

  const result = await prisma.certificate.updateMany({ where, data: { status: "REVOKED", revokedAt: new Date(), revokeReason: reason } });
  const label = eventId
    ? (await prisma.event.findUnique({ where: { id: eventId }, select: { title: true } }))?.title
    : (await prisma.organization.findUnique({ where: { id: orgId! }, select: { name: true } }))?.name;
  await logActivity(req, {
    action: "platform.certificate.bulkRevoke",
    entityType: eventId ? "Event" : "Organization",
    entityId: eventId ?? orgId,
    metadata: { count: result.count, scope: eventId ? "event" : "organization", label: label ?? "", reason },
  });
  return ok(res, { dryRun: false, count: result.count });
}

// GET /api/v1/superadmin/certificates/templates   (catalogue for the platform default design picker)
export function platformTemplates(_req: Request, res: Response) {
  return ok(res, { layouts: LAYOUTS, variants: VARIANTS, templates: listTemplates() });
}

// GET /api/v1/superadmin/certificates/preview?templateKey=   (sample PDF with sample branding)
export async function platformTemplatePreview(req: Request, res: Response) {
  const key = q(req.query.templateKey);
  const templateKey = isTemplateKey(key) ? key : DEFAULT_TEMPLATE;
  const sampleOrg = {
    id: "sample",
    name: "Your Organization",
    whiteLabelName: null,
    logoUrl: null,
    primaryColor: "#5b21b6",
    accentColor: "#c9a227",
    signatoryName: "Dr. Sana Malik",
    signatoryTitle: "Director",
    signatureUrl: null,
  };
  const sampleEvent = { id: "sample", title: "Your Event Title", startDateTime: new Date(), location: "Your venue", mode: "OFFLINE" as const };
  const sample = { type: "PARTICIPATION" as const, recipientName: "Ayesha Khan", category: null, verifyCode: "EVX-SAMP-LE00", sha256Hash: "0".repeat(64), issuedAt: new Date() };
  const pdf = await renderCertificate(templateKey, { ...certificateData(sampleOrg, sampleEvent, sample), sample: true });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="preview-${templateKey}.pdf"`);
  return res.send(pdf);
}
