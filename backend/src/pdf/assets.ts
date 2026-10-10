import path from "path";
import fs from "fs/promises";
import PDFDocument from "pdfkit";
import { UPLOAD_ROOT } from "../utils/storage";

type Doc = InstanceType<typeof PDFDocument>;

// Open-licence fonts shipped as npm packages (@fontsource/*). pdfkit reads WOFF files directly.
const FONT_DIR = path.dirname(require.resolve("@fontsource/inter/package.json"));
const fontFile = (pkg: string, file: string) => path.join(FONT_DIR, "..", pkg, "files", file);

export const FONTS = {
  serif: "Playfair",
  serifBold: "Playfair-Bold",
  script: "GreatVibes",
  sans: "Inter",
  sansBold: "Inter-SemiBold",
  mono: "Courier", // built into pdfkit
} as const;

/** Registers our fonts on a new document (call once per document). */
export function registerFonts(doc: Doc) {
  doc.registerFont(FONTS.serif, fontFile("playfair-display", "playfair-display-latin-400-normal.woff"));
  doc.registerFont(FONTS.serifBold, fontFile("playfair-display", "playfair-display-latin-700-normal.woff"));
  doc.registerFont(FONTS.script, fontFile("great-vibes", "great-vibes-latin-400-normal.woff"));
  doc.registerFont(FONTS.sans, fontFile("inter", "inter-latin-400-normal.woff"));
  doc.registerFont(FONTS.sansBold, fontFile("inter", "inter-latin-600-normal.woff"));
}

/** PNG / JPEG only — pdfkit can't embed WEBP. */
function isEmbeddable(buf: Buffer): boolean {
  const png = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const jpg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  return png || jpg;
}

/**
 * Loads an image for a PDF from one of our uploads (/uploads/...) or an http(s) link.
 * Returns null (and the PDF simply leaves the image out) if it's missing, too slow or not PNG/JPEG.
 */
export async function loadImage(url: string | null | undefined): Promise<Buffer | null> {
  if (!url) return null;
  try {
    let buf: Buffer;
    if (url.startsWith("/uploads/")) {
      const full = path.resolve(UPLOAD_ROOT, url.replace(/^\/uploads\//, ""));
      if (!full.startsWith(UPLOAD_ROOT)) return null;
      buf = await fs.readFile(full);
    } else if (/^https?:\/\//i.test(url)) {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 5 * 1024 * 1024) return null;
    } else {
      return null;
    }
    return isEmbeddable(buf) ? buf : null;
  } catch {
    return null;
  }
}

/** Collects a finished pdfkit document into one Buffer. */
export function toBuffer(doc: Doc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export type { Doc };
