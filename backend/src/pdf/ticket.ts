import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { FONTS, loadImage, registerFonts, toBuffer, type Doc } from "./assets";

/** What the QR on a ticket contains. The prefix lets the scanner ignore unrelated QR codes. */
export const TICKET_QR_PREFIX = "EVXT:";
export const ticketQrValue = (qrCode: string) => `${TICKET_QR_PREFIX}${qrCode}`;

export interface TicketData {
  ticketNo: string;
  qrCode: string;
  type: string | null;
  attendeeName: string;
  attendeeEmail: string;
  refNo: string;
  eventTitle: string;
  start: Date;
  end: Date;
  mode: string;
  location: string | null;
  meetingLink: string | null;
  orgName: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const INK = "#0f172a";
const MUTED = "#64748b";
const TZ = "Asia/Karachi";

const fmtDay = (d: Date) => d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const fmtTime = (d: Date) => d.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", timeZone: TZ });

function label(doc: Doc, text: string, x: number, y: number, w: number) {
  doc.font(FONTS.sansBold).fontSize(7).fillColor(MUTED).text(text.toUpperCase(), x, y, { width: w, characterSpacing: 1 });
  return doc.y + 1;
}

/** Draws one ticket on the current page (A6 portrait, 298 × 420 pt). */
async function drawTicket(doc: Doc, t: TicketData) {
  const W = doc.page.width;
  const H = doc.page.height;
  const brand = HEX.test(t.primaryColor ?? "") ? t.primaryColor! : "#7c3aed";
  const [logo, qr] = await Promise.all([
    loadImage(t.logoUrl),
    QRCode.toBuffer(ticketQrValue(t.qrCode), { margin: 1, width: 400, errorCorrectionLevel: "M", color: { dark: INK, light: "#ffffff" } }),
  ]);

  // Header band
  doc.rect(0, 0, W, 92).fill(brand);
  let x = 20;
  if (logo) {
    doc.roundedRect(18, 18, 36, 36, 6).fill("#ffffff");
    doc.image(logo, 21, 21, { fit: [30, 30], align: "center", valign: "center" });
    x = 64;
  }
  doc.font(FONTS.sansBold).fontSize(8).fillColor("#ffffff").text(t.orgName.toUpperCase(), x, 22, { width: W - x - 20, characterSpacing: 1, lineBreak: false, ellipsis: true });
  doc.font(FONTS.serifBold).fontSize(15).fillColor("#ffffff").text(t.eventTitle, x, 36, { width: W - x - 20, height: 42, ellipsis: true });

  // When / where
  let y = 108;
  const half = (W - 52) / 2;
  label(doc, "Date", 20, y, half);
  doc.font(FONTS.sansBold).fontSize(10).fillColor(INK).text(fmtDay(t.start), 20, y + 10, { width: half });
  label(doc, "Time", 32 + half, y, half);
  doc.font(FONTS.sansBold).fontSize(10).fillColor(INK).text(`${fmtTime(t.start)} – ${fmtTime(t.end)}`, 32 + half, y + 10, { width: half });
  y += 34;
  label(doc, t.mode === "ONLINE" ? "Online" : "Venue", 20, y, W - 40);
  const where = t.mode === "ONLINE" ? t.meetingLink || "Link will be shared before the event" : t.location || "To be announced";
  doc.font(FONTS.sans).fontSize(9.5).fillColor(INK).text(where, 20, y + 10, { width: W - 40, height: 26, ellipsis: true });

  // Perforation
  y = 182;
  doc.circle(0, y, 9).fill("#f3f0ff");
  doc.circle(W, y, 9).fill("#f3f0ff");
  doc.save().lineWidth(1).dash(4, { space: 4 }).moveTo(14, y).lineTo(W - 14, y).stroke("#cbd5e1").undash().restore();

  // QR
  const qrSize = 150;
  doc.image(qr, (W - qrSize) / 2, 196, { width: qrSize });
  doc.font(FONTS.mono).fontSize(9).fillColor(INK).text(t.ticketNo, 20, 350, { width: W - 40, align: "center" });

  // Attendee
  doc.font(FONTS.sansBold).fontSize(12).fillColor(INK).text(t.attendeeName, 20, 366, { width: W - 40, align: "center", lineBreak: false, ellipsis: true });
  const typeText = [t.type && t.type !== "General" ? t.type : null, t.refNo].filter(Boolean).join("  ·  ");
  doc.font(FONTS.sans).fontSize(8).fillColor(MUTED).text(typeText, 20, 383, { width: W - 40, align: "center" });
  doc.font(FONTS.sans).fontSize(6.5).fillColor("#94a3b8").text("Show this QR code at the entrance. One scan per ticket.", 20, H - 22, { width: W - 40, align: "center" });
}

const PAGE = { size: "A6" as const, margin: 0 };

/** One ticket as a PDF. */
export async function renderTicket(t: TicketData): Promise<Buffer> {
  const doc = new PDFDocument({ ...PAGE, info: { Title: `Ticket ${t.ticketNo}`, Author: t.orgName } });
  registerFonts(doc);
  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#ffffff");
  await drawTicket(doc, t);
  return toBuffer(doc);
}
