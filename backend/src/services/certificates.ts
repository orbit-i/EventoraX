import crypto from "crypto";
import type { Certificate, Prisma } from "@prisma/client";
import type { OrgWithPlan } from "../middleware/checkOrgStatus";
import type { ScopedPrisma } from "../prisma/scopedClient";
import { renderCertificate, isTemplateKey, DEFAULT_TEMPLATE, type CertType, type CertificateData } from "../pdf/certificate";
import { savePrivate, readPrivate } from "../utils/storage";
import { sendCertificateEmail } from "../utils/mail";
import { getSetting } from "../utils/settings";
import { isUniqueViolation } from "../utils/schemas";

// No 0/O, 1/I/L — easy to read out and type.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomChars(n: number) {
  const bytes = crypto.randomBytes(n);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/** e.g. EVX-7K3M-Q9TD */
function newVerifyCode() {
  return `EVX-${randomChars(4)}-${randomChars(4)}`;
}

/** Normalises what people type: lower case, spaces, missing dashes. */
export function normaliseVerifyCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith("EVX") ? raw.slice(3) : raw;
  return body.length === 8 ? `EVX-${body.slice(0, 4)}-${body.slice(4)}` : input.trim().toUpperCase();
}

export function verifyUrl(code: string) {
  return `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify/${code}`;
}

/**
 * SHA-256 over the facts frozen at issue time. If anyone edits those columns in the
 * database later, the stored hash no longer matches and verification shows INVALID.
 */
export function certificateHash(c: Pick<Certificate, "verifyCode" | "recipientName" | "recipientEmail" | "type" | "category" | "eventId" | "organizationId" | "issuedAt">) {
  const canonical = JSON.stringify({
    v: 1,
    code: c.verifyCode,
    name: c.recipientName,
    email: c.recipientEmail.toLowerCase(),
    type: c.type,
    category: c.category ?? null,
    event: c.eventId,
    org: c.organizationId,
    issuedAt: c.issuedAt.toISOString(),
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

const pdfKey = (orgId: string, code: string) => `orgs/${orgId}/certificates/${code}.pdf`;

export interface CertEvent {
  id: string;
  title: string;
  startDateTime: Date;
  location: string | null;
  mode: string;
  certTemplateId: string | null;
}

type OrgBranding = Pick<OrgWithPlan, "id" | "name" | "whiteLabelName" | "logoUrl" | "primaryColor" | "accentColor" | "signatoryName" | "signatoryTitle" | "signatureUrl">;

export function certificateData(org: OrgBranding, event: Omit<CertEvent, "certTemplateId">, cert: Pick<Certificate, "type" | "recipientName" | "category" | "verifyCode" | "sha256Hash" | "issuedAt">): CertificateData {
  return {
    type: cert.type as CertType,
    recipientName: cert.recipientName,
    category: cert.category,
    eventTitle: event.title,
    eventDate: event.startDateTime,
    eventLocation: event.mode === "ONLINE" ? "Online" : event.location,
    orgName: org.name,
    logoUrl: org.logoUrl,
    primaryColor: org.primaryColor,
    accentColor: org.accentColor,
    signatoryName: org.signatoryName,
    signatoryTitle: org.signatoryTitle,
    signatureUrl: org.signatureUrl,
    verifyCode: cert.verifyCode,
    verifyUrl: verifyUrl(cert.verifyCode),
    sha256Hash: cert.sha256Hash,
    issuedAt: cert.issuedAt,
  };
}

/** The template to use: explicit choice → the event's → the platform default. */
export async function chooseTemplate(explicit: string | null | undefined, event: Pick<CertEvent, "certTemplateId">) {
  if (isTemplateKey(explicit)) return explicit;
  if (isTemplateKey(event.certTemplateId)) return event.certTemplateId;
  const platformDefault = await getSetting<string>("certificates.defaultTemplate", DEFAULT_TEMPLATE);
  return isTemplateKey(platformDefault) ? platformDefault : DEFAULT_TEMPLATE;
}

export interface IssueTarget {
  id: string;
  name: string;
  email: string;
  category: { label: string } | null;
}

/**
 * Creates the certificate row, renders its PDF and stores it privately.
 * Throws a unique-constraint error if this registration already has a certificate of this type.
 */
export async function issueCertificate(
  db: ScopedPrisma,
  org: OrgBranding,
  event: CertEvent,
  registration: IssueTarget,
  opts: { type: CertType; templateKey: string }
) {
  const issuedAt = new Date(Math.floor(Date.now() / 1000) * 1000); // whole seconds: survives the DB round trip exactly

  for (let attempt = 0; ; attempt++) {
    const verifyCode = newVerifyCode();
    const facts = {
      verifyCode,
      recipientName: registration.name,
      recipientEmail: registration.email,
      type: opts.type,
      category: registration.category?.label ?? null,
      eventId: event.id,
      organizationId: org.id,
      issuedAt,
    };
    const sha256Hash = certificateHash(facts);
    try {
      const created = await db.certificate.create({
        data: {
          ...facts,
          registrationId: registration.id,
          templateKey: opts.templateKey,
          sha256Hash,
          pdfUrl: pdfKey(org.id, verifyCode),
        } as Prisma.CertificateUncheckedCreateInput,
      });
      try {
        const pdf = await renderCertificate(opts.templateKey, certificateData(org, event, created));
        await savePrivate(pdfKey(org.id, verifyCode), pdf);
      } catch (err) {
        await db.certificate.delete({ where: { id: created.id } }); // no certificate without a PDF
        throw err;
      }
      return created;
    } catch (err) {
      // Retry only a verify-code collision (vanishingly rare); a duplicate certificate is a real error.
      if (isUniqueViolation(err) && attempt < 3 && String((err as { meta?: { target?: unknown } }).meta?.target ?? "").includes("verifyCode")) continue;
      throw err;
    }
  }
}

/** The stored PDF, or a freshly rendered one if the file went missing. */
export async function certificatePdf(org: OrgBranding, event: Omit<CertEvent, "certTemplateId">, cert: Certificate): Promise<Buffer> {
  const stored = await readPrivate(cert.pdfUrl);
  if (stored) return stored;
  const pdf = await renderCertificate(cert.templateKey, certificateData(org, event, cert));
  await savePrivate(pdfKey(cert.organizationId, cert.verifyCode), pdf).catch(() => undefined);
  return pdf;
}

export function certificateFileName(cert: Pick<Certificate, "recipientName" | "verifyCode">) {
  const safe = cert.recipientName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40) || "certificate";
  return `${safe}-${cert.verifyCode}.pdf`;
}

/** Emails one certificate with its PDF attached and records when. */
export async function emailCertificate(db: ScopedPrisma, org: OrgBranding, event: Omit<CertEvent, "certTemplateId">, cert: Certificate) {
  const pdf = await certificatePdf(org, event, cert);
  await sendCertificateEmail(cert.recipientEmail, cert.recipientName, org.whiteLabelName || org.name, event.title, verifyUrl(cert.verifyCode), {
    filename: certificateFileName(cert),
    content: pdf,
    contentType: "application/pdf",
  });
  await db.certificate.update({ where: { id: cert.id }, data: { emailedAt: new Date() } });
}

export const EVENT_FOR_CERT = { id: true, title: true, startDateTime: true, location: true, mode: true, certTemplateId: true, autoIssueCert: true } as const;

/**
 * Attendance hook: when people are marked ATTENDED on an event with "auto-issue" on,
 * give each a Participation certificate (if they don't have one) and email it.
 * Runs in the background — failures are logged, never shown to the person marking attendance.
 */
export async function autoIssueForAttended(db: ScopedPrisma, org: OrgBranding, eventId: string, registrationIds: string[]) {
  if (registrationIds.length === 0) return;
  const event = await db.event.findUnique({ where: { id: eventId }, select: EVENT_FOR_CERT });
  if (!event?.autoIssueCert) return;

  const regs = await db.registration.findMany({
    where: { id: { in: registrationIds }, status: "ATTENDED", certificates: { none: { type: "PARTICIPATION" } } },
    select: { id: true, name: true, email: true, category: { select: { label: true } } },
  });
  const templateKey = await chooseTemplate(null, event);
  for (const reg of regs) {
    try {
      const cert = await issueCertificate(db, org, event, reg, { type: "PARTICIPATION", templateKey });
      await emailCertificate(db, org, event, cert);
    } catch (err) {
      if (!isUniqueViolation(err)) console.error(`Auto-issue certificate failed for registration ${reg.id}:`, err);
    }
  }
}
