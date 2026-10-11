import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { FONTS, loadImage, registerFonts, toBuffer, type Doc } from "./assets";
import { ticketQrValue } from "./ticket";

// ─────────────────────────── Templates & options ───────────────────────────
// ID cards are standard CR80 size (54 × 85.6 mm), portrait. They are printed either
// one per page (for card printers) or 9 per A4 sheet with crop marks (cut by hand).

export const IDCARD_TEMPLATES = [
  { key: "classic", name: "Classic", description: "Coloured header with logo, centred name" },
  { key: "sidebar", name: "Sidebar", description: "Coloured band down the left side" },
  { key: "minimal", name: "Minimal", description: "White card, thin accent line, lots of space" },
  { key: "bold", name: "Bold", description: "Full-colour card with white text" },
] as const;
export type IdCardTemplate = (typeof IDCARD_TEMPLATES)[number]["key"];
export const DEFAULT_IDCARD_TEMPLATE: IdCardTemplate = "classic";

/** Optional fields. The attendee's name and the event title are always printed. */
export const IDCARD_FIELDS = [
  { key: "category", name: "Category", description: "General, VIP, Speaker…" },
  { key: "department", name: "Department" },
  { key: "rollNo", name: "Roll no." },
  { key: "email", name: "Email" },
  { key: "qr", name: "QR code", description: "The ticket QR — scan it at the entrance to check in" },
] as const;
export type IdCardField = (typeof IDCARD_FIELDS)[number]["key"];
export const DEFAULT_IDCARD_FIELDS: IdCardField[] = ["category", "department", "rollNo", "qr"];

export type IdCardLayout = "sheet" | "single";

export interface IdCardOptions {
  template: IdCardTemplate;
  fields: IdCardField[];
  showLogo: boolean;
  layout: IdCardLayout;
}

export interface IdCardPerson {
  name: string;
  email: string;
  category: string | null;
  department: string | null;
  rollNo: string | null;
  qrCode: string | null; // the ticket's QR value (null = no ticket)
}

export interface IdCardEvent {
  eventTitle: string;
  eventDate: Date;
  orgName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
}

// ─────────────────────────── Drawing helpers ───────────────────────────

const CARD_W = 153; // 54 mm
const CARD_H = 243; // 85.6 mm
const INK = "#0f172a";
const MUTED = "#64748b";
const HEX = /^#[0-9a-fA-F]{6}$/;
const TZ = "Asia/Karachi";

const colour = (value: string | null, fallback: string) => (value && HEX.test(value) ? value : fallback);
/** Dark text on light colours, white text on dark ones. */
function readableOn(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? INK : "#ffffff";
}
const fmtDate = (d: Date) => d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]![0] : "")).toUpperCase() || "?";
}

/** Writes a name that shrinks (down to 9 pt, then wraps to 2 lines) so it always fits. */
function fitText(doc: Doc, text: string, x: number, y: number, w: number, opts: { font: string; max: number; min?: number; color: string; align?: "center" | "left" }) {
  let size = opts.max;
  doc.font(opts.font);
  while (size > (opts.min ?? 9) && doc.fontSize(size).widthOfString(text) > w) size -= 0.5;
  doc.fontSize(size).fillColor(opts.color).text(text, x, y, { width: w, align: opts.align ?? "center", height: size * 2.6, ellipsis: true });
  return doc.y;
}

/** "Department · Roll no." style detail lines, skipping empty values. */
function detailLines(p: IdCardPerson, fields: IdCardField[]): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  if (fields.includes("department") && p.department) out.push({ label: "Department", value: p.department });
  if (fields.includes("rollNo") && p.rollNo) out.push({ label: "Roll no.", value: p.rollNo });
  if (fields.includes("email")) out.push({ label: "Email", value: p.email });
  return out;
}

/** Label + value pairs between y and maxY. Spacing tightens when space is short; lines that still don't fit are left out. */
function drawDetails(doc: Doc, lines: { label: string; value: string }[], x: number, y: number, w: number, maxY: number, color: string, labelColor: string, align: "center" | "left") {
  const step = Math.max(16, Math.min(19, (maxY - y) / Math.max(1, lines.length)));
  for (const l of lines) {
    if (y + 16 > maxY) break;
    doc.font(FONTS.sansBold).fontSize(5.5).fillColor(labelColor).text(l.label.toUpperCase(), x, y, { width: w, align, characterSpacing: 0.6, lineBreak: false });
    doc.font(FONTS.sans).fontSize(7.5).fillColor(color).text(l.value, x, y + 6.5, { width: w, align, lineBreak: false, ellipsis: true });
    y += step;
  }
}

function pill(doc: Doc, text: string, cx: number, y: number, bg: string, fg: string) {
  doc.font(FONTS.sansBold).fontSize(6.5);
  const w = Math.min(CARD_W - 24, doc.widthOfString(text.toUpperCase(), { characterSpacing: 0.8 }) + 14);
  doc.roundedRect(cx - w / 2, y, w, 13, 6.5).fill(bg);
  doc.fillColor(fg).text(text.toUpperCase(), cx - w / 2, y + 3.6, { width: w, align: "center", characterSpacing: 0.8, lineBreak: false, ellipsis: true });
}

function avatar(doc: Doc, name: string, cx: number, cy: number, r: number, bg: string, fg: string, ring?: string) {
  if (ring) doc.circle(cx, cy, r + 2.5).fill(ring);
  doc.circle(cx, cy, r).fill(bg);
  doc.font(FONTS.sansBold).fontSize(r * 0.8).fillColor(fg).text(initials(name), cx - r, cy - r * 0.48, { width: r * 2, align: "center", lineBreak: false });
}

interface Assets {
  logo: Buffer | null;
  qr: Buffer | null;
}

// ─────────────────────────── The 4 templates ───────────────────────────

function drawClassic(doc: Doc, p: IdCardPerson, e: IdCardEvent, o: IdCardOptions, a: Assets, brand: string) {
  const W = CARD_W;
  doc.rect(0, 0, W, CARD_H).fill("#ffffff");
  doc.rect(0, 0, W, 58).fill(brand);
  let ty = 12;
  if (a.logo) {
    doc.roundedRect(W / 2 - 13, 8, 26, 26, 5).fill("#ffffff");
    doc.image(a.logo, W / 2 - 11, 10, { fit: [22, 22], align: "center", valign: "center" });
    ty = 37;
  }
  doc.font(FONTS.sansBold).fontSize(6).fillColor("#ffffff").text(e.orgName.toUpperCase(), 8, ty, { width: W - 16, align: "center", characterSpacing: 0.8, lineBreak: false, ellipsis: true });
  if (!a.logo) doc.font(FONTS.serifBold).fontSize(9).fillColor("#ffffff").text(e.eventTitle, 10, 24, { width: W - 20, align: "center", height: 26, ellipsis: true });

  avatar(doc, p.name, W / 2, 80, 20, "#f1f5f9", brand, "#ffffff");
  let y = fitText(doc, p.name, 10, 106, W - 20, { font: FONTS.serifBold, max: 14, color: INK }) + 3;
  if (o.fields.includes("category") && p.category) {
    pill(doc, p.category, W / 2, y, brand, readableOn(brand));
    y += 18;
  }
  drawDetails(doc, detailLines(p, o.fields), 12, y + 2, W - 24, a.qr ? CARD_H - 78 : CARD_H - 24, INK, MUTED, "center");

  if (a.qr) doc.image(a.qr, W / 2 - 25, CARD_H - 76, { width: 50 });
  doc.rect(0, CARD_H - 20, W, 20).fill("#f8fafc");
  doc.rect(0, CARD_H - 20, W, 1).fill(brand);
  const footer = a.logo ? `${e.eventTitle} · ${fmtDate(e.eventDate)}` : fmtDate(e.eventDate);
  doc.font(FONTS.sans).fontSize(5.8).fillColor(MUTED).text(footer, 8, CARD_H - 13, { width: W - 16, align: "center", lineBreak: false, ellipsis: true });
}

function drawSidebar(doc: Doc, p: IdCardPerson, e: IdCardEvent, o: IdCardOptions, a: Assets, brand: string, accent: string) {
  const W = CARD_W;
  const band = 30;
  doc.rect(0, 0, W, CARD_H).fill("#ffffff");
  doc.rect(0, 0, band, CARD_H).fill(brand);
  doc.rect(band, 0, 2.5, CARD_H).fill(accent);
  // Event title runs up the band
  doc.save().rotate(-90, { origin: [band / 2, CARD_H / 2] });
  doc.font(FONTS.sansBold).fontSize(7).fillColor("#ffffff").text(e.eventTitle.toUpperCase(), band / 2 - CARD_H / 2 + 10, CARD_H / 2 - 4, { width: CARD_H - 20, align: "center", characterSpacing: 1, lineBreak: false, ellipsis: true });
  doc.restore();

  const x = band + 10;
  const w = W - x - 8;
  let y = 12;
  if (a.logo) {
    doc.image(a.logo, x, y, { fit: [24, 24], valign: "center" });
    doc.font(FONTS.sansBold).fontSize(6).fillColor(MUTED).text(e.orgName.toUpperCase(), x + 28, y + 6, { width: w - 28, height: 16, characterSpacing: 0.5, ellipsis: true });
    y += 34;
  } else {
    doc.font(FONTS.sansBold).fontSize(6).fillColor(MUTED).text(e.orgName.toUpperCase(), x, y, { width: w, characterSpacing: 0.5, lineBreak: false, ellipsis: true });
    y += 16;
  }
  avatar(doc, p.name, x + 18, y + 18, 18, brand, "#ffffff");
  y += 44;
  y = fitText(doc, p.name, x, y, w, { font: FONTS.serifBold, max: 13, color: INK, align: "left" }) + 3;
  if (o.fields.includes("category") && p.category) {
    doc.font(FONTS.sansBold).fontSize(7).fillColor(brand).text(p.category.toUpperCase(), x, y, { width: w, characterSpacing: 0.8, lineBreak: false, ellipsis: true });
    y += 14;
  }
  doc.rect(x, y, 22, 1.5).fill(accent);
  drawDetails(doc, detailLines(p, o.fields), x, y + 6, w, a.qr ? CARD_H - 64 : CARD_H - 26, INK, MUTED, "left");

  if (a.qr) doc.image(a.qr, x, CARD_H - 62, { width: 46 });
  doc.font(FONTS.sans).fontSize(5.8).fillColor(MUTED).text(fmtDate(e.eventDate), a.qr ? x + 50 : x, CARD_H - 22, { width: a.qr ? w - 50 : w, align: a.qr ? "right" : "left", lineBreak: false });
}

function drawMinimal(doc: Doc, p: IdCardPerson, e: IdCardEvent, o: IdCardOptions, a: Assets, brand: string) {
  const W = CARD_W;
  doc.rect(0, 0, W, CARD_H).fill("#ffffff");
  doc.rect(0, 0, W, 4).fill(brand);
  let y = 16;
  if (a.logo) {
    doc.image(a.logo, W / 2 - 12, y, { fit: [24, 24], align: "center", valign: "center" });
    y += 30;
  }
  doc.font(FONTS.sansBold).fontSize(5.8).fillColor(MUTED).text(e.orgName.toUpperCase(), 10, y, { width: W - 20, align: "center", characterSpacing: 1, lineBreak: false, ellipsis: true });
  y += a.logo ? 22 : 34;
  y = fitText(doc, p.name, 10, y, W - 20, { font: FONTS.sansBold, max: 15, color: INK }) + 4;
  doc.rect(W / 2 - 10, y, 20, 1.5).fill(brand);
  y += 7;
  if (o.fields.includes("category") && p.category) {
    doc.font(FONTS.sansBold).fontSize(7).fillColor(brand).text(p.category.toUpperCase(), 10, y, { width: W - 20, align: "center", characterSpacing: 1, lineBreak: false, ellipsis: true });
    y += 14;
  }
  drawDetails(doc, detailLines(p, o.fields), 12, y, W - 24, a.qr ? CARD_H - 84 : CARD_H - 36, INK, "#94a3b8", "center");

  if (a.qr) doc.image(a.qr, W / 2 - 23, CARD_H - 82, { width: 46 });
  doc.font(FONTS.sansBold).fontSize(6.5).fillColor(INK).text(e.eventTitle, 10, CARD_H - 32, { width: W - 20, align: "center", lineBreak: false, ellipsis: true });
  doc.font(FONTS.sans).fontSize(5.8).fillColor(MUTED).text(fmtDate(e.eventDate), 10, CARD_H - 22, { width: W - 20, align: "center", lineBreak: false });
}

function drawBold(doc: Doc, p: IdCardPerson, e: IdCardEvent, o: IdCardOptions, a: Assets, brand: string, accent: string) {
  const W = CARD_W;
  doc.rect(0, 0, W, CARD_H).fill(brand);
  doc.circle(W + 10, -10, 60).fillOpacity(0.12).fill("#ffffff").fillOpacity(1);
  doc.circle(-20, CARD_H + 10, 55).fillOpacity(0.1).fill("#ffffff").fillOpacity(1);
  let y = 14;
  if (a.logo) {
    doc.roundedRect(12, y, 24, 24, 5).fill("#ffffff");
    doc.image(a.logo, 14, y + 2, { fit: [20, 20], align: "center", valign: "center" });
    doc.font(FONTS.sansBold).fontSize(6).fillColor("#ffffff").text(e.orgName.toUpperCase(), 42, y + 4, { width: W - 54, height: 16, characterSpacing: 0.5, ellipsis: true });
  } else {
    doc.font(FONTS.sansBold).fontSize(6).fillColor("#ffffff").text(e.orgName.toUpperCase(), 12, y + 8, { width: W - 24, characterSpacing: 0.5, lineBreak: false, ellipsis: true });
  }
  y = 50;
  doc.font(FONTS.serifBold).fontSize(8.5).fillColor("#ffffff").text(e.eventTitle, 12, y, { width: W - 24, height: 24, ellipsis: true });
  y = 80;
  doc.rect(12, y, 24, 2).fill(accent);
  y += 8;
  y = fitText(doc, p.name, 12, y, W - 24, { font: FONTS.sansBold, max: 15, color: "#ffffff", align: "left" }) + 3;
  if (o.fields.includes("category") && p.category) {
    doc.font(FONTS.sansBold).fontSize(6.5);
    const pw = Math.min(W - 24, doc.widthOfString(p.category.toUpperCase(), { characterSpacing: 0.8 }) + 14);
    doc.roundedRect(12, y, pw, 13, 6.5).fill(accent);
    doc.fillColor(readableOn(accent)).text(p.category.toUpperCase(), 12, y + 3.6, { width: pw, align: "center", characterSpacing: 0.8, lineBreak: false, ellipsis: true });
    y += 18;
  }
  drawDetails(doc, detailLines(p, o.fields), 12, y + 2, W - 24, a.qr ? CARD_H - 66 : CARD_H - 26, "#ffffff", "#e2e8f0", "left");

  if (a.qr) {
    doc.roundedRect(W - 64, CARD_H - 64, 54, 54, 6).fill("#ffffff");
    doc.image(a.qr, W - 61, CARD_H - 61, { width: 48 });
  }
  doc.font(FONTS.sans).fontSize(6).fillColor("#ffffff").text(fmtDate(e.eventDate), 12, CARD_H - 20, { width: 80, lineBreak: false });
}

async function drawCard(doc: Doc, x: number, y: number, p: IdCardPerson, e: IdCardEvent, o: IdCardOptions, logo: Buffer | null) {
  const brand = colour(e.primaryColor, "#7c3aed");
  const accent = colour(e.accentColor, "#f59e0b");
  const qr =
    o.fields.includes("qr") && p.qrCode
      ? await QRCode.toBuffer(ticketQrValue(p.qrCode), { margin: 1, width: 240, errorCorrectionLevel: "M", color: { dark: INK, light: "#ffffff" } })
      : null;
  const assets = { logo: o.showLogo ? logo : null, qr };

  doc.save();
  doc.translate(x, y);
  doc.roundedRect(0, 0, CARD_W, CARD_H, 7).clip();
  switch (o.template) {
    case "sidebar":
      drawSidebar(doc, p, e, o, assets, brand, accent);
      break;
    case "minimal":
      drawMinimal(doc, p, e, o, assets, brand);
      break;
    case "bold":
      drawBold(doc, p, e, o, assets, brand, accent);
      break;
    default:
      drawClassic(doc, p, e, o, assets, brand);
  }
  doc.restore();
  // Thin outline so white cards are easy to cut out
  doc.save().lineWidth(0.4).roundedRect(x, y, CARD_W, CARD_H, 7).stroke("#cbd5e1").restore();
}

// ─────────────────────────── Pages ───────────────────────────

const SHEET = { cols: 3, rows: 3, gapX: 14, gapY: 12 };

function cropMarks(doc: Doc, x: number, y: number) {
  const m = 6;
  const off = 3;
  doc.save().lineWidth(0.3).strokeColor("#94a3b8");
  for (const [cx, cy, dx, dy] of [
    [x, y, -1, -1],
    [x + CARD_W, y, 1, -1],
    [x, y + CARD_H, -1, 1],
    [x + CARD_W, y + CARD_H, 1, 1],
  ] as const) {
    doc.moveTo(cx + dx * off, cy).lineTo(cx + dx * (off + m), cy).stroke();
    doc.moveTo(cx, cy + dy * off).lineTo(cx, cy + dy * (off + m)).stroke();
  }
  doc.restore();
}

/**
 * Renders ID cards for many people into one PDF.
 * "single" = one card per card-sized page; "sheet" = 9 cards per A4 page with crop marks.
 */
export async function renderIdCards(people: IdCardPerson[], event: IdCardEvent, options: IdCardOptions, extra: { sample?: boolean } = {}): Promise<Buffer> {
  const single = options.layout === "single";
  const doc = new PDFDocument({
    size: single ? [CARD_W, CARD_H] : "A4",
    margin: 0,
    autoFirstPage: false,
    info: { Title: `ID cards — ${event.eventTitle}`, Author: event.orgName },
  });
  registerFonts(doc);
  const logo = options.showLogo ? await loadImage(event.logoUrl) : null;

  if (single) {
    for (const p of people) {
      doc.addPage();
      await drawCard(doc, 0, 0, p, event, options, logo);
    }
  } else {
    const perPage = SHEET.cols * SHEET.rows;
    const gridW = SHEET.cols * CARD_W + (SHEET.cols - 1) * SHEET.gapX;
    const gridH = SHEET.rows * CARD_H + (SHEET.rows - 1) * SHEET.gapY;
    for (let i = 0; i < people.length; i++) {
      if (i % perPage === 0) {
        doc.addPage();
        if (extra.sample) {
          doc.font(FONTS.sans).fontSize(8).fillColor("#94a3b8").text("Preview — 9 cards fit on one A4 page. Cut along the marks.", 0, 16, { width: doc.page.width, align: "center" });
        }
      }
      const slot = i % perPage;
      const x0 = (doc.page.width - gridW) / 2;
      const y0 = (doc.page.height - gridH) / 2;
      const x = x0 + (slot % SHEET.cols) * (CARD_W + SHEET.gapX);
      const y = y0 + Math.floor(slot / SHEET.cols) * (CARD_H + SHEET.gapY);
      cropMarks(doc, x, y);
      await drawCard(doc, x, y, people[i]!, event, options, logo);
    }
  }
  if (people.length === 0) doc.addPage();
  return toBuffer(doc);
}

/** Sample people for the design preview. */
export const SAMPLE_PEOPLE: IdCardPerson[] = [
  { name: "Ayesha Khan", email: "ayesha@example.com", category: "VIP", department: "Computer Science", rollNo: "FA21-BCS-042", qrCode: "0".repeat(32) },
  { name: "Muhammad Bilal Ahmed", email: "bilal@example.com", category: "General", department: "Electrical Engineering", rollNo: "SP22-BEE-118", qrCode: "1".repeat(32) },
  { name: "Hira Siddiqui", email: "hira@example.com", category: "Speaker", department: "Business Administration", rollNo: null, qrCode: "2".repeat(32) },
];
