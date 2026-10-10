import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { FONTS, loadImage, registerFonts, toBuffer, type Doc } from "./assets";

// ─────────────────────────── Template registry ───────────────────────────
// A template key is "<layout>-<variant>", e.g. "classic-royal" or "wave-brand".
// 10 layouts × 5 colour variants = 50 templates, plus a "brand" variant per layout
// that uses the organization's own colours.

export const LAYOUTS = [
  { key: "classic", name: "Classic", description: "Double border, centred, timeless" },
  { key: "modern", name: "Modern", description: "Coloured side band, left-aligned" },
  { key: "elegant", name: "Elegant", description: "Corner ornaments on ivory paper" },
  { key: "minimal", name: "Minimal", description: "Lots of white space, one accent line" },
  { key: "ribbon", name: "Ribbon", description: "Diagonal corner ribbons" },
  { key: "bold", name: "Bold", description: "Full-width coloured header" },
  { key: "academic", name: "Academic", description: "Seal and dotted border, formal" },
  { key: "geometric", name: "Geometric", description: "Layered triangles in the corners" },
  { key: "wave", name: "Wave", description: "Flowing waves top and bottom" },
  { key: "framed", name: "Framed", description: "Thick coloured frame" },
] as const;

export const VARIANTS = [
  { key: "royal", name: "Royal", primary: "#5b21b6", accent: "#c9a227" },
  { key: "navy", name: "Navy", primary: "#1e3a8a", accent: "#c9a227" },
  { key: "emerald", name: "Emerald", primary: "#065f46", accent: "#b7950b" },
  { key: "crimson", name: "Crimson", primary: "#9f1239", accent: "#b8860b" },
  { key: "charcoal", name: "Charcoal", primary: "#1f2937", accent: "#d97706" },
] as const;

type LayoutKey = (typeof LAYOUTS)[number]["key"];

export const DEFAULT_TEMPLATE = "classic-royal";

export interface TemplateInfo {
  key: string;
  layout: LayoutKey;
  layoutName: string;
  variant: string;
  variantName: string;
  primary: string | null; // null = organization's brand colours
  accent: string | null;
}

export function listTemplates(): TemplateInfo[] {
  const out: TemplateInfo[] = [];
  for (const l of LAYOUTS) {
    for (const v of VARIANTS) {
      out.push({ key: `${l.key}-${v.key}`, layout: l.key, layoutName: l.name, variant: v.key, variantName: v.name, primary: v.primary, accent: v.accent });
    }
    out.push({ key: `${l.key}-brand`, layout: l.key, layoutName: l.name, variant: "brand", variantName: "Your brand", primary: null, accent: null });
  }
  return out;
}

export function isTemplateKey(key: string | null | undefined): key is string {
  return Boolean(key) && listTemplates().some((t) => t.key === key);
}

// ─────────────────────────── Data ───────────────────────────

export type CertType = "PARTICIPATION" | "ACHIEVEMENT" | "APPRECIATION" | "SPEAKER" | "ORGANIZER";

export interface CertificateData {
  type: CertType;
  recipientName: string;
  category: string | null;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string | null;
  orgName: string;
  logoUrl: string | null;
  primaryColor: string | null; // org brand colours, used by "-brand" templates
  accentColor: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  signatureUrl: string | null;
  verifyCode: string;
  verifyUrl: string;
  sha256Hash: string;
  issuedAt: Date;
  /** Big diagonal "SAMPLE" for previews */
  sample?: boolean;
}

const TYPE_TEXT: Record<CertType, { title: string; line: string }> = {
  PARTICIPATION: { title: "of Participation", line: "has successfully participated in" },
  ACHIEVEMENT: { title: "of Achievement", line: "is recognised for outstanding achievement at" },
  APPRECIATION: { title: "of Appreciation", line: "is thanked with appreciation for contributing to" },
  SPEAKER: { title: "of Appreciation", line: "is thanked for speaking at" },
  ORGANIZER: { title: "of Appreciation", line: "is thanked for helping organise" },
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const INK = "#0f172a";
const MUTED = "#64748b";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" });
}

// ─────────────────────────── Layout decorations ───────────────────────────

interface Box {
  /** Content area */
  x: number;
  y: number;
  w: number;
  h: number;
  align: "center" | "left";
  /** Header drawn in white on a coloured band (bold layout) */
  titleOnColor?: boolean;
  paper: string;
}

type Colors = { primary: string; accent: string };

function cornerTriangles(doc: Doc, W: number, H: number, c: Colors) {
  const s = 150;
  doc.save();
  doc.polygon([0, 0], [s, 0], [0, s]).fill(c.primary);
  doc.polygon([0, 0], [s * 0.62, 0], [0, s * 0.62]).fill(c.accent);
  doc.polygon([W, H], [W - s, H], [W, H - s]).fill(c.primary);
  doc.polygon([W, H], [W - s * 0.62, H], [W, H - s * 0.62]).fill(c.accent);
  doc.restore();
}

const DECORATE: Record<LayoutKey, (doc: Doc, W: number, H: number, c: Colors) => Box> = {
  classic(doc, W, H, c) {
    doc.rect(0, 0, W, H).fill("#fffdf7");
    doc.lineWidth(3).rect(22, 22, W - 44, H - 44).stroke(c.primary);
    doc.lineWidth(1).rect(32, 32, W - 64, H - 64).stroke(c.accent);
    return { x: 70, y: 52, w: W - 140, h: H - 104, align: "center", paper: "#fffdf7" };
  },
  modern(doc, W, H, c) {
    doc.rect(0, 0, W, H).fill("#ffffff");
    doc.rect(0, 0, 190, H).fill(c.primary);
    doc.rect(190, 0, 8, H).fill(c.accent);
    doc.save().opacity(0.12).circle(95, H - 90, 140).fill("#ffffff").restore();
    return { x: 240, y: 50, w: W - 290, h: H - 100, align: "left", paper: "#ffffff" };
  },
  elegant(doc, W, H, c) {
    doc.rect(0, 0, W, H).fill("#fffaf0");
    doc.lineWidth(0.8).rect(28, 28, W - 56, H - 56).stroke(c.accent);
    const corner = (x: number, y: number, sx: number, sy: number) => {
      doc.save().translate(x, y).scale(sx, sy);
      doc.lineWidth(2).moveTo(0, 60).lineTo(0, 0).lineTo(60, 0).stroke(c.primary);
      doc.lineWidth(1).moveTo(10, 50).bezierCurveTo(10, 20, 20, 10, 50, 10).stroke(c.accent);
      doc.circle(10, 10, 3).fill(c.accent);
      doc.restore();
    };
    corner(40, 40, 1, 1);
    corner(W - 40, 40, -1, 1);
    corner(40, H - 40, 1, -1);
    corner(W - 40, H - 40, -1, -1);
    return { x: 90, y: 55, w: W - 180, h: H - 110, align: "center", paper: "#fffaf0" };
  },
  minimal(doc, W, H, c) {
    doc.rect(0, 0, W, H).fill("#ffffff");
    doc.rect(56, 60, 3, H - 120).fill(c.accent);
    doc.rect(0, H - 10, W, 10).fill(c.primary);
    return { x: 84, y: 60, w: W - 154, h: H - 120, align: "left", paper: "#ffffff" };
  },
  ribbon(doc, W, H, c) {
    doc.rect(0, 0, W, H).fill("#ffffff");
    doc.save();
    doc.polygon([W - 180, 0], [W - 120, 0], [W, 120], [W, 180]).fill(c.primary);
    doc.polygon([W - 100, 0], [W - 75, 0], [W, 75], [W, 100]).fill(c.accent);
    doc.polygon([0, H - 180], [0, H - 120], [120, H], [180, H]).fill(c.primary);
    doc.polygon([0, H - 100], [0, H - 75], [75, H], [100, H]).fill(c.accent);
    doc.restore();
    return { x: 90, y: 50, w: W - 180, h: H - 100, align: "center", paper: "#ffffff" };
  },
  bold(doc, W, H, c) {
    doc.rect(0, 0, W, H).fill("#ffffff");
    doc.rect(0, 0, W, 150).fill(c.primary);
    doc.rect(0, 150, W, 6).fill(c.accent);
    return { x: 70, y: 28, w: W - 140, h: H - 56, align: "center", titleOnColor: true, paper: "#ffffff" };
  },
  academic(doc, W, H, c) {
    doc.rect(0, 0, W, H).fill("#fffdf7");
    doc.lineWidth(1.5).rect(20, 20, W - 40, H - 40).stroke(c.primary);
    for (let x = 34; x <= W - 34; x += 12) {
      doc.circle(x, 30, 1.4).fill(c.accent);
      doc.circle(x, H - 30, 1.4).fill(c.accent);
    }
    for (let y = 42; y <= H - 42; y += 12) {
      doc.circle(30, y, 1.4).fill(c.accent);
      doc.circle(W - 30, y, 1.4).fill(c.accent);
    }
    // Seal, upper right
    const sx = W - 112;
    const sy = 112;
    doc.circle(sx, sy, 42).fill(c.accent);
    doc.lineWidth(1.5).circle(sx, sy, 35).stroke("#ffffff");
    doc.font(FONTS.serifBold).fontSize(11).fillColor("#ffffff").text("CERTIFIED", sx - 40, sy - 6, { width: 80, align: "center" });
    return { x: 70, y: 50, w: W - 140, h: H - 100, align: "center", paper: "#fffdf7" };
  },
  geometric(doc, W, H, c) {
    doc.rect(0, 0, W, H).fill("#ffffff");
    cornerTriangles(doc, W, H, c);
    doc.save().opacity(0.08);
    doc.polygon([W, 0], [W - 260, 0], [W, 200]).fill(c.primary);
    doc.polygon([0, H], [260, H], [0, H - 200]).fill(c.primary);
    doc.restore();
    return { x: 90, y: 50, w: W - 180, h: H - 100, align: "center", paper: "#ffffff" };
  },
  wave(doc, W, H, c) {
    doc.rect(0, 0, W, H).fill("#ffffff");
    doc.moveTo(0, 0).lineTo(W, 0).lineTo(W, 50).bezierCurveTo(W * 0.7, 110, W * 0.35, 0, 0, 70).closePath().fill(c.primary);
    doc.save().opacity(0.6);
    doc.moveTo(0, 70).bezierCurveTo(W * 0.35, 5, W * 0.7, 115, W, 55).lineTo(W, 62).bezierCurveTo(W * 0.7, 125, W * 0.35, 15, 0, 80).closePath().fill(c.accent);
    doc.restore();
    doc.moveTo(0, H).lineTo(W, H).lineTo(W, H - 34).bezierCurveTo(W * 0.65, H - 8, W * 0.3, H - 58, 0, H - 26).closePath().fill(c.primary);
    return { x: 80, y: 100, w: W - 160, h: H - 160, align: "center", paper: "#ffffff" };
  },
  framed(doc, W, H, c) {
    doc.rect(0, 0, W, H).fill(c.primary);
    doc.rect(26, 26, W - 52, H - 52).fill("#ffffff");
    doc.lineWidth(1).rect(36, 36, W - 72, H - 72).stroke(c.accent);
    return { x: 70, y: 52, w: W - 140, h: H - 104, align: "center", paper: "#ffffff" };
  },
};

// ─────────────────────────── Renderer ───────────────────────────

function resolveColors(templateKey: string, data: CertificateData): { layout: LayoutKey; colors: Colors } {
  const info = listTemplates().find((t) => t.key === templateKey) ?? listTemplates().find((t) => t.key === DEFAULT_TEMPLATE)!;
  const royal = VARIANTS[0];
  const primary = info.primary ?? (HEX.test(data.primaryColor ?? "") ? data.primaryColor! : royal.primary);
  const accent = info.accent ?? (HEX.test(data.accentColor ?? "") ? data.accentColor! : royal.accent);
  return { layout: info.layout, colors: { primary, accent } };
}

interface TextBlock {
  text: string;
  font: string;
  size: number;
  color: string;
  spacing?: number;
  /** Extra space below this line */
  after?: number;
  /** Thin accent rule under this line (the name) */
  rule?: boolean;
}

function blockHeight(doc: Doc, b: TextBlock, width: number) {
  doc.font(b.font).fontSize(b.size);
  return doc.heightOfString(b.text, { width, characterSpacing: b.spacing ?? 0 }) + (b.after ?? 0) + (b.rule ? 8 : 0);
}

function stackHeight(doc: Doc, blocks: TextBlock[], width: number) {
  return blocks.reduce((sum, b) => sum + blockHeight(doc, b, width), 0);
}

/** Draws the blocks top-down from y; returns the y below the last one. */
function drawStack(doc: Doc, blocks: TextBlock[], box: Box, y: number, ruleColor: string) {
  const W = doc.page.width;
  for (const b of blocks) {
    doc.font(b.font).fontSize(b.size).fillColor(b.color);
    doc.text(b.text, box.x, y, { width: box.w, align: box.align, characterSpacing: b.spacing ?? 0 });
    y = doc.y;
    if (b.rule) {
      const ruleW = Math.min(360, box.w);
      const ruleX = box.align === "center" ? W / 2 - ruleW / 2 : box.x;
      doc.lineWidth(0.8).moveTo(ruleX, y - 2).lineTo(ruleX + ruleW, y - 2).stroke(ruleColor);
      y += 8;
    }
    y += b.after ?? 0;
  }
  return y;
}

/** Renders one certificate as an A4 landscape PDF. */
export async function renderCertificate(templateKey: string, data: CertificateData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0, info: { Title: `Certificate — ${data.recipientName}`, Author: data.orgName } });
  registerFonts(doc);
  const W = doc.page.width;
  const H = doc.page.height;
  const { layout, colors } = resolveColors(templateKey, data);
  const box = DECORATE[layout](doc, W, H, colors);
  const [logo, signature, qr] = await Promise.all([
    loadImage(data.logoUrl),
    loadImage(data.signatureUrl),
    QRCode.toBuffer(data.verifyUrl, { margin: 1, width: 240, color: { dark: INK, light: "#ffffff" } }),
  ]);

  const onColor = Boolean(box.titleOnColor);
  const header: TextBlock[] = [
    { text: data.orgName.toUpperCase(), font: FONTS.sansBold, size: 9, color: onColor ? "#ffffff" : MUTED, spacing: 2, after: 6 },
    { text: "CERTIFICATE", font: FONTS.serifBold, size: 34, color: onColor ? "#ffffff" : colors.primary, spacing: 4 },
    { text: TYPE_TEXT[data.type].title.toUpperCase(), font: FONTS.sansBold, size: 11, color: onColor ? "#ffffff" : colors.accent, spacing: 3 },
  ];
  const details = [`held on ${fmtDate(data.eventDate)}`, data.eventLocation, data.category && data.category !== "General" ? `as ${data.category}` : null]
    .filter(Boolean)
    .join("  ·  ");
  const body: TextBlock[] = [
    { text: "This is to certify that", font: FONTS.sans, size: 11, color: MUTED, after: 2 },
    { text: data.recipientName, font: FONTS.script, size: 44, color: INK, rule: true, after: 6 },
    { text: TYPE_TEXT[data.type].line, font: FONTS.sans, size: 11, color: MUTED, after: 2 },
    { text: data.eventTitle, font: FONTS.serifBold, size: 20, color: INK, after: 2 },
    { text: details, font: FONTS.sans, size: 10, color: MUTED },
  ];

  const footY = H - 150; // signature row
  const logoSize = logo ? 46 : 0;
  const logoGap = logo ? 8 : 0;
  const drawLogo = (y: number) => {
    if (!logo) return y;
    const lx = box.align === "center" ? W / 2 - logoSize / 2 : box.x;
    if (onColor) doc.roundedRect(lx - 4, y - 4, logoSize + 8, logoSize + 8, 6).fill("#ffffff");
    doc.image(logo, lx, y, { fit: [logoSize, logoSize], align: "center", valign: "center" });
    return y + logoSize + logoGap;
  };

  if (onColor) {
    // Header stays inside the coloured band; the body is centred in the white area below.
    drawStack(doc, header, box, drawLogo(box.y), colors.accent);
    const top = 176;
    const free = footY - 16 - top - stackHeight(doc, body, box.w);
    drawStack(doc, body, box, top + Math.max(0, free / 2), colors.accent);
  } else {
    const gapBetween = 20;
    const total = logoSize + logoGap + stackHeight(doc, header, box.w) + gapBetween + stackHeight(doc, body, box.w);
    const free = footY - 16 - box.y - total;
    let y = drawLogo(box.y + Math.max(0, free / 2));
    y = drawStack(doc, header, box, y, colors.accent) + gapBetween;
    drawStack(doc, body, box, y, colors.accent);
  }

  // Footer: signature (left) · QR + verify code (middle) · issued date (right), spread across the content box
  const colW = Math.min(190, (box.w - 100) / 2);
  const leftX = box.align === "center" ? W / 2 - 300 : box.x;
  const rightX = box.align === "center" ? W / 2 + 110 : box.x + box.w - colW;
  const midX = box.align === "center" ? W / 2 - 40 : (leftX + colW + rightX) / 2 - 40;

  if (signature) doc.image(signature, leftX + colW / 2 - 70, footY - 6, { fit: [140, 40], align: "center", valign: "bottom" });
  doc.lineWidth(0.6).moveTo(leftX, footY + 38).lineTo(leftX + colW, footY + 38).stroke(INK);
  doc.font(FONTS.sansBold).fontSize(10).fillColor(INK).text(data.signatoryName || "Authorised signatory", leftX, footY + 43, { width: colW, align: "center" });
  doc.font(FONTS.sans).fontSize(8.5).fillColor(MUTED).text(data.signatoryTitle || data.orgName, leftX, doc.y + 1, { width: colW, align: "center" });

  doc.image(qr, midX, footY - 4, { width: 80 });
  doc.font(FONTS.sansBold).fontSize(8).fillColor(INK).text(data.verifyCode, midX - 30, footY + 79, { width: 140, align: "center" });

  doc.font(FONTS.serifBold).fontSize(12).fillColor(INK).text(fmtDate(data.issuedAt), rightX, footY + 20, { width: colW, align: "center" });
  doc.lineWidth(0.6).moveTo(rightX, footY + 38).lineTo(rightX + colW, footY + 38).stroke(INK);
  doc.font(FONTS.sans).fontSize(8.5).fillColor(MUTED).text("Date of issue", rightX, footY + 43, { width: colW, align: "center" });

  // Verification line: full SHA-256, tiny, inside the content area
  const hashX = box.align === "center" ? 40 : box.x;
  const hashW = box.align === "center" ? W - 80 : box.w;
  doc
    .font(FONTS.mono)
    .fontSize(6)
    .fillColor("#94a3b8")
    .text(`Verify at ${data.verifyUrl}  ·  SHA-256 ${data.sha256Hash}`, hashX, H - 52, { width: hashW, align: box.align });

  if (data.sample) {
    doc.save().opacity(0.08).rotate(-24, { origin: [W / 2, H / 2] });
    doc.font(FONTS.sansBold).fontSize(120).fillColor(INK).text("SAMPLE", 0, H / 2 - 70, { width: W, align: "center" });
    doc.restore();
  }

  return toBuffer(doc);
}
