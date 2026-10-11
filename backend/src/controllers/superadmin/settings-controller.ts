import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { ok, fail, q } from "../../utils/http";
import { getSetting, setSetting } from "../../utils/settings";
import { logActivity } from "../../utils/activity";
import { saveUpload } from "../../utils/storage";
import { checkImageSize } from "../../utils/upload";
import { EMAIL_REGEX } from "../../utils/password";
import { isTemplateKey } from "../../pdf/certificate";

// ─────────────────────────── The editable settings ───────────────────────────
// Every key, its validation and its default. The Settings page sends any subset of these.

const imagePath = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/uploads/") || /^https:\/\//.test(v), "Upload an image or paste an https:// link");
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(191)
  .refine((v) => v === "" || EMAIL_REGEX.test(v), "Enter a valid email address");
const optionalLink = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Use a full link (https://…) or a page path like /pricing");

const FIELDS = {
  "platform.name": z.string().trim().min(2, "At least 2 characters").max(60),
  "platform.logoUrl": imagePath,
  "platform.faviconUrl": imagePath,
  "contact.email": optionalEmail,
  "contact.whatsapp": z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || /^\+?[\d\s-]{10,16}$/.test(v), "Enter a phone number like +92 300 1234567"),
  "contact.hours": z.string().trim().max(100),
  "trial.days": z.coerce.number({ error: "Enter a number of days" }).int("Whole days only").min(1, "At least 1 day").max(90, "At most 90 days"),
  "maintenance.enabled": z.boolean(),
  "maintenance.message": z.string().trim().max(300),
  banner: z.object({
    enabled: z.boolean(),
    text: z.string().trim().max(200),
    tone: z.enum(["info", "warning", "success"]),
    link: optionalLink,
    linkLabel: z.string().trim().max(30),
  }),
  "payments.accounts": z.object({
    jazzcash: z.string().trim().max(60),
    easypaisa: z.string().trim().max(60),
    bankIban: z.string().trim().max(80),
  }),
  "uploads.maxMb": z.coerce.number({ error: "Enter a size in MB" }).int("Whole MB only").min(1, "At least 1 MB").max(20, "At most 20 MB"),
  "certificates.defaultTemplate": z.string().refine((v) => isTemplateKey(v), "Choose one of the certificate designs"),
  seo: z.object({ title: z.string().trim().max(70), description: z.string().trim().max(160) }),
} as const;

type Key = keyof typeof FIELDS;
const KEYS = Object.keys(FIELDS) as Key[];

const DEFAULTS: Record<Key, unknown> = {
  "platform.name": "EventoraX",
  "platform.logoUrl": "",
  "platform.faviconUrl": "",
  "contact.email": "",
  "contact.whatsapp": "",
  "contact.hours": "",
  "trial.days": 1,
  "maintenance.enabled": false,
  "maintenance.message": "",
  banner: { enabled: false, text: "", tone: "info", link: "", linkLabel: "" },
  "payments.accounts": { jazzcash: "", easypaisa: "", bankIban: "" },
  "uploads.maxMb": 2,
  "certificates.defaultTemplate": "classic-royal",
  seo: { title: "", description: "" },
};

async function readAll() {
  const values = await Promise.all(KEYS.map((k) => getSetting<unknown>(k, DEFAULTS[k])));
  return Object.fromEntries(KEYS.map((k, i) => [k, values[i]])) as Record<Key, unknown>;
}

// GET /api/v1/superadmin/settings
export async function getSettings(_req: Request, res: Response) {
  return ok(res, await readAll());
}

// PATCH /api/v1/superadmin/settings   { "<key>": value, … }  (any subset)
export async function updateSettings(req: Request, res: Response) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const unknown = Object.keys(body).filter((k) => !KEYS.includes(k as Key));
  if (unknown.length) return fail(res, 400, "VALIDATION_ERROR", `Unknown setting: ${unknown.join(", ")}`);

  const fieldErrors: Record<string, string> = {};
  const parsed: Partial<Record<Key, Prisma.InputJsonValue>> = {};
  for (const [key, value] of Object.entries(body) as [Key, unknown][]) {
    const result = FIELDS[key].safeParse(value);
    if (result.success) parsed[key] = result.data as Prisma.InputJsonValue;
    else {
      // Nested objects report each inner field, e.g. "banner.text".
      for (const issue of result.error.issues) fieldErrors[[key, ...issue.path].join(".")] ??= issue.message;
    }
  }
  if (Object.keys(fieldErrors).length) return fail(res, 400, "VALIDATION_ERROR", "Please fix the highlighted fields", { fieldErrors });
  if (Object.keys(parsed).length === 0) return fail(res, 400, "VALIDATION_ERROR", "Nothing to save");

  const before = await readAll();
  for (const [key, value] of Object.entries(parsed)) await setSetting(key, value as Prisma.InputJsonValue);
  const changed = Object.keys(parsed).filter((k) => JSON.stringify(before[k as Key]) !== JSON.stringify(parsed[k as Key]));

  // Maintenance on/off gets its own log line (it affects everyone).
  if ("maintenance.enabled" in parsed && changed.includes("maintenance.enabled")) {
    await logActivity(req, { action: parsed["maintenance.enabled"] ? "maintenance.on" : "maintenance.off" });
  }
  if (changed.filter((k) => k !== "maintenance.enabled").length) {
    await logActivity(req, { action: "settings.update", metadata: { keys: changed.filter((k) => k !== "maintenance.enabled") } });
  }
  return ok(res, await readAll());
}

// POST /api/v1/superadmin/uploads?kind=logo|favicon   (multipart "file")
export async function uploadPlatformImage(req: Request, res: Response) {
  const kind = q(req.query.kind);
  if (kind !== "logo" && kind !== "favicon") return fail(res, 400, "VALIDATION_ERROR", "kind must be logo or favicon");
  if (!req.file) return fail(res, 400, "NO_FILE", "No file uploaded (form field name must be: file)");
  const tooBig = await checkImageSize(req.file);
  if (tooBig) return fail(res, 400, "FILE_TOO_LARGE", tooBig);
  // Platform logo is also printed on PDF reports → PNG / JPEG only.
  if (req.file.mimetype === "image/webp") return fail(res, 400, "UNSUPPORTED_IMAGE", "Please use a PNG or JPG");
  const url = await saveUpload("platform", req.file.buffer, req.file.mimetype);
  await logActivity(req, { action: "upload.image", metadata: { kind: `platform.${kind}`, url } });
  return ok(res, { url }, 201);
}

// GET /api/v1/platform   (public: name, branding, banner, maintenance, SEO and contact for every page)
export async function publicPlatform(_req: Request, res: Response) {
  const s = await readAll();
  const banner = s.banner as { enabled: boolean; text: string; tone: string; link: string; linkLabel: string };
  return ok(res, {
    name: s["platform.name"],
    logoUrl: s["platform.logoUrl"] || null,
    faviconUrl: s["platform.faviconUrl"] || null,
    banner: banner.enabled && banner.text ? { text: banner.text, tone: banner.tone, link: banner.link || null, linkLabel: banner.linkLabel || null } : null,
    maintenance: { enabled: s["maintenance.enabled"] === true, message: (s["maintenance.message"] as string) || null },
    seo: s.seo,
    trialDays: s["trial.days"],
    maxUploadMb: s["uploads.maxMb"],
  });
}
