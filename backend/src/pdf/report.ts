import PDFDocument from "pdfkit";
import { FONTS, loadImage, registerFonts, toBuffer, type Doc } from "./assets";

// ─────────────────────────── Report kit ───────────────────────────
// Small building blocks for A4 reports: header, KPI tiles, bar charts, horizontal bars
// and tables. Used by the organization's Analytics report and the superadmin's reports.

const INK = "#0f172a";
const MUTED = "#64748b";
const FAINT = "#94a3b8";
const LINE = "#e2e8f0";
const HEX = /^#[0-9a-fA-F]{6}$/;
const TZ = "Asia/Karachi";
const MARGIN = 40;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-03" → "Mar" (or "Mar 26" with the year). */
export function monthLabel(key: string, withYear = false) {
  const [y, m] = key.split("-");
  const name = MONTHS[Number(m) - 1] ?? key;
  return withYear ? `${name} ${y?.slice(2)}` : name;
}

/** Cuts text (with "…") so it fits in `width` at the current font and size. */
function fit(doc: Doc, text: string, width: number) {
  if (doc.widthOfString(text) <= width) return text;
  let t = text;
  while (t.length > 1 && doc.widthOfString(`${t}…`) > width) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

export interface Kpi {
  label: string;
  value: string | number;
  hint?: string;
}

export interface TableColumn {
  header: string;
  width: number; // share of the content width (they're scaled to fit)
  align?: "left" | "right" | "center";
}

export class ReportKit {
  readonly doc: Doc;
  readonly brand: string;
  readonly left = MARGIN;
  readonly width: number;
  y = MARGIN;

  constructor(doc: Doc, brand: string | null) {
    this.doc = doc;
    this.brand = brand && HEX.test(brand) ? brand : "#7c3aed";
    this.width = doc.page.width - MARGIN * 2;
  }

  private get bottom() {
    return this.doc.page.height - MARGIN - 18; // room for the footer
  }

  /** Starts a new page when fewer than `height` points are left. */
  ensure(height: number) {
    if (this.y + height > this.bottom) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  header(opts: { title: string; subtitle: string; orgName: string; logo: Buffer | null; generatedBy?: string }) {
    const { doc } = this;
    doc.rect(0, 0, doc.page.width, 6).fill(this.brand);
    let x = this.left;
    if (opts.logo) {
      doc.image(opts.logo, x, 28, { fit: [40, 40], valign: "center" });
      x += 50;
    }
    doc.font(FONTS.sansBold).fontSize(8).fillColor(MUTED).text(opts.orgName.toUpperCase(), x, 30, { width: this.width - (x - this.left), characterSpacing: 1, lineBreak: false, ellipsis: true });
    doc.font(FONTS.serifBold).fontSize(20).fillColor(INK).text(opts.title, x, 42, { width: this.width - (x - this.left), lineBreak: false, ellipsis: true });
    const when = new Date().toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: TZ });
    const meta = [opts.subtitle, `Generated ${when}`, opts.generatedBy ? `by ${opts.generatedBy}` : null].filter(Boolean).join("  ·  ");
    doc.font(FONTS.sans).fontSize(8.5).fillColor(MUTED).text(meta, this.left, 80, { width: this.width });
    this.y = 104;
    doc.rect(this.left, this.y, this.width, 0.7).fill(LINE);
    this.y += 16;
  }

  section(title: string, description?: string) {
    this.ensure(70);
    const { doc } = this;
    doc.rect(this.left, this.y + 2, 3, 11).fill(this.brand);
    doc.font(FONTS.sansBold).fontSize(11.5).fillColor(INK).text(title, this.left + 9, this.y, { width: this.width - 9 });
    this.y = doc.y + 2;
    if (description) {
      doc.font(FONTS.sans).fontSize(8.5).fillColor(MUTED).text(description, this.left + 9, this.y, { width: this.width - 9 });
      this.y = doc.y;
    }
    this.y += 8;
  }

  kpis(items: Kpi[]) {
    const { doc } = this;
    const gap = 8;
    const perRow = Math.min(items.length, 4);
    const w = (this.width - gap * (perRow - 1)) / perRow;
    const h = 54;
    for (let i = 0; i < items.length; i++) {
      if (i % perRow === 0) {
        if (i > 0) this.y += h + gap;
        this.ensure(h);
      }
      const k = items[i]!;
      const x = this.left + (i % perRow) * (w + gap);
      doc.roundedRect(x, this.y, w, h, 6).fillAndStroke("#faf8ff", "#e9e4ff");
      doc.font(FONTS.sansBold).fontSize(7).fillColor(MUTED).text(k.label.toUpperCase(), x + 10, this.y + 9, { width: w - 20, characterSpacing: 0.6, lineBreak: false, ellipsis: true });
      doc.font(FONTS.sansBold).fontSize(17).fillColor(INK);
      doc.text(fit(doc, typeof k.value === "number" ? k.value.toLocaleString("en-PK") : k.value, w - 20), x + 10, this.y + 20, { lineBreak: false });
      if (k.hint) doc.font(FONTS.sans).fontSize(7).fillColor(FAINT).text(fit(doc, k.hint, w - 20), x + 10, this.y + 41, { lineBreak: false });
    }
    this.y += h + 18;
  }

  /** Vertical bars (e.g. one per month) with value labels on top. */
  barChart(items: { label: string; value: number }[], opts: { color?: string; height?: number; format?: (n: number) => string } = {}) {
    const { doc } = this;
    const height = opts.height ?? 120;
    const color = opts.color ?? this.brand;
    const fmt = opts.format ?? ((n: number) => n.toLocaleString("en-PK"));
    this.ensure(height + 34);
    const top = this.y + 12;
    const base = top + height;
    const max = Math.max(1, ...items.map((i) => i.value));
    const slot = this.width / Math.max(1, items.length);
    const barW = Math.min(28, slot * 0.6);

    // light grid lines
    for (let g = 0; g <= 4; g++) {
      const gy = base - (height * g) / 4;
      doc.rect(this.left, gy, this.width, 0.4).fill(g === 0 ? "#cbd5e1" : "#f1f5f9");
    }
    items.forEach((item, i) => {
      const h = (item.value / max) * height;
      const x = this.left + i * slot + (slot - barW) / 2;
      if (h > 0) doc.roundedRect(x, base - h, barW, h, Math.min(3, h / 2)).fill(color);
      if (item.value > 0) {
        doc.font(FONTS.sansBold).fontSize(7).fillColor(INK).text(fmt(item.value), x - 12, base - h - 10, { width: barW + 24, align: "center", lineBreak: false });
      }
      doc.font(FONTS.sans).fontSize(7).fillColor(MUTED).text(item.label, this.left + i * slot, base + 5, { width: slot, align: "center", lineBreak: false, ellipsis: true });
    });
    this.y = base + 26;
  }

  /** One labelled horizontal bar per item (e.g. events by status, attendance per event). */
  hBars(items: { label: string; value: number; color?: string; right?: string }[], opts: { max?: number; emptyText?: string } = {}) {
    const { doc } = this;
    if (items.length === 0) return this.note(opts.emptyText ?? "Nothing to show yet.");
    const max = opts.max ?? Math.max(1, ...items.map((i) => i.value));
    const labelW = this.width * 0.34;
    const rightW = 70;
    const barArea = this.width - labelW - rightW - 12;
    for (const item of items) {
      this.ensure(18);
      doc.font(FONTS.sans).fontSize(8.5).fillColor(INK);
      doc.text(fit(doc, item.label, labelW - 8), this.left, this.y + 2, { lineBreak: false });
      const x = this.left + labelW;
      doc.roundedRect(x, this.y + 3, barArea, 8, 4).fill("#f1f5f9");
      const w = Math.max(0, Math.min(1, item.value / max)) * barArea;
      if (w > 0) doc.roundedRect(x, this.y + 3, Math.max(w, 8), 8, 4).fill(item.color ?? this.brand);
      doc.font(FONTS.sansBold).fontSize(8.5).fillColor(INK).text(item.right ?? item.value.toLocaleString("en-PK"), x + barArea + 12, this.y + 2, { width: rightW, align: "right", lineBreak: false });
      this.y += 17;
    }
    this.y += 10;
  }

  table(columns: TableColumn[], rows: (string | number)[][], opts: { emptyText?: string } = {}) {
    const { doc } = this;
    if (rows.length === 0) return this.note(opts.emptyText ?? "Nothing to show yet.");
    const total = columns.reduce((s, c) => s + c.width, 0);
    const widths = columns.map((c) => (c.width / total) * this.width);
    const rowH = 18;
    const drawHead = () => {
      doc.rect(this.left, this.y, this.width, rowH).fill("#f5f3ff");
      let x = this.left;
      columns.forEach((c, i) => {
        doc.font(FONTS.sansBold).fontSize(7.5).fillColor(MUTED).text(c.header.toUpperCase(), x + 6, this.y + 6, { width: widths[i]! - 12, align: c.align ?? "left", characterSpacing: 0.4, lineBreak: false, ellipsis: true });
        x += widths[i]!;
      });
      this.y += rowH;
    };
    this.ensure(rowH * 2);
    drawHead();
    rows.forEach((row, r) => {
      if (this.y + rowH > this.bottom) {
        doc.addPage();
        this.y = MARGIN;
        drawHead();
      }
      if (r % 2 === 1) doc.rect(this.left, this.y, this.width, rowH).fill("#fafafa");
      let x = this.left;
      row.forEach((cell, i) => {
        const c = columns[i]!;
        const text = typeof cell === "number" ? cell.toLocaleString("en-PK") : cell;
        doc.font(i === 0 ? FONTS.sansBold : FONTS.sans).fontSize(8.5).fillColor(INK);
        doc.text(fit(doc, text, widths[i]! - 12), x + 6, this.y + 5, { width: widths[i]! - 12, align: c.align ?? "left", lineBreak: false });
        x += widths[i]!;
      });
      doc.rect(this.left, this.y + rowH - 0.4, this.width, 0.4).fill(LINE);
      this.y += rowH;
    });
    this.y += 14;
  }

  note(text: string) {
    this.ensure(24);
    this.doc.font(FONTS.sans).fontSize(8.5).fillColor(FAINT).text(text, this.left, this.y, { width: this.width });
    this.y = this.doc.y + 14;
  }

  /** Two blocks side by side (each gets half the width). */
  columns(leftBlock: (kit: ReportKit) => void, rightBlock: (kit: ReportKit) => void, minHeight = 170) {
    this.ensure(minHeight);
    const startY = this.y;
    const half = (this.width - 20) / 2;
    const leftKit = Object.assign(Object.create(Object.getPrototypeOf(this)) as ReportKit, this, { width: half });
    leftBlock(leftKit);
    const rightKit = Object.assign(Object.create(Object.getPrototypeOf(this)) as ReportKit, this, { width: half, left: this.left + half + 20, y: startY });
    rightBlock(rightKit);
    this.y = Math.max(leftKit.y, rightKit.y);
  }

  /** Page numbers + a small footer on every page (call last). */
  footer(text: string) {
    const { doc } = this;
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const y = doc.page.height - MARGIN + 6;
      doc.rect(this.left, y - 6, doc.page.width - MARGIN * 2, 0.5).fill(LINE);
      doc.font(FONTS.sans).fontSize(7).fillColor(FAINT).text(text, this.left, y, { width: 300, lineBreak: false });
      doc.text(`Page ${i - range.start + 1} of ${range.count}`, doc.page.width - MARGIN - 120, y, { width: 120, align: "right", lineBreak: false });
    }
  }
}

/** A new A4 report document with our fonts and page buffering (for page numbers). */
export function newReport(title: string, author: string) {
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false, bufferPages: true, info: { Title: title, Author: author } });
  registerFonts(doc);
  return doc;
}


// ─────────────────────────── Organization analytics report ───────────────────────────

export interface AnalyticsReportData {
  totals: { events: number; registrations: number; attended: number; attendanceRate: number; certificatesIssued: number };
  eventsByStatus: { status: string; count: number }[];
  registrationsByStatus: Record<string, number>;
  registeredVia: { via: string; count: number }[];
  monthlyRegistrations: { month: string; count: number }[];
  monthlyCertificates: { month: string; count: number }[];
  attendanceByEvent: { title: string; startDateTime: Date; registered: number; attended: number; rate: number }[];
  categoryBreakdown: { label: string; count: number }[];
  topEvents: { title: string; startDateTime: Date; maxAttendees: number | null; registrations: number }[];
}

const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", PUBLISHED: "Upcoming", ONGOING: "Active", COMPLETED: "Completed", ARCHIVED: "Archived" };
const STATUS_COLOR: Record<string, string> = { DRAFT: "#e87ba4", PUBLISHED: "#2a78d6", ONGOING: "#1baf7a", COMPLETED: "#6250d6", ARCHIVED: "#eda100" };
const REG_LABEL: Record<string, string> = { REGISTERED: "Registered", ATTENDED: "Attended", ABSENT: "Absent", CANCELLED: "Cancelled" };
const VIA_LABEL: Record<string, string> = { WEB: "Public page", ADMIN: "Added by organizers", CSV_IMPORT: "CSV import", API: "API" };
const fmtDate = (d: Date) => d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });

export async function renderAnalyticsReport(
  data: AnalyticsReportData,
  org: { orgName: string; logoUrl: string | null; primaryColor: string | null; generatedBy: string }
): Promise<Buffer> {
  const doc = newReport(`Analytics report: ${org.orgName}`, org.orgName);
  doc.addPage();
  const kit = new ReportKit(doc, org.primaryColor);
  const logo = await loadImage(org.logoUrl);
  kit.header({ title: "Analytics report", subtitle: "All events (archived events excluded from totals)", orgName: org.orgName, logo, generatedBy: org.generatedBy });

  const t = data.totals;
  kit.kpis([
    { label: "Events", value: t.events, hint: "not archived" },
    { label: "Registrations", value: t.registrations, hint: "cancelled excluded" },
    { label: "Attended", value: t.attended, hint: `${t.attendanceRate}% attendance rate` },
    { label: "Certificates", value: t.certificatesIssued, hint: "issued, not revoked" },
  ]);

  const regTotal = data.monthlyRegistrations.reduce((s, m) => s + m.count, 0);
  kit.section("Registrations per month", `Last 12 months · ${regTotal.toLocaleString("en-PK")} in total`);
  kit.barChart(data.monthlyRegistrations.map((m, i) => ({ label: monthLabel(m.month, i === 0 || m.month.endsWith("-01")), value: m.count })));

  kit.columns(
    (k) => {
      k.section("Events by status");
      const order = ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "ARCHIVED"];
      k.hBars(
        order
          .map((s) => ({ s, count: data.eventsByStatus.find((g) => g.status === s)?.count ?? 0 }))
          .filter((g) => g.count > 0)
          .map((g) => ({ label: STATUS_LABEL[g.s] ?? g.s, value: g.count, color: STATUS_COLOR[g.s] })),
        { emptyText: "No events yet." }
      );
    },
    (k) => {
      k.section("Registrations by status");
      const regs = Object.entries(data.registrationsByStatus).filter(([, n]) => n > 0);
      k.hBars(
        regs.map(([s, n]) => ({ label: REG_LABEL[s] ?? s, value: n, color: s === "ATTENDED" ? "#1baf7a" : s === "CANCELLED" ? "#94a3b8" : s === "ABSENT" ? "#eda100" : kit.brand })),
        { emptyText: "No registrations yet." }
      );
    }
  );

  kit.section("Attendance rate per event", "The 10 most recent active or completed events");
  kit.hBars(
    data.attendanceByEvent.map((e) => ({ label: e.title, value: e.rate, right: `${e.rate}%  (${e.attended}/${e.registered})`, color: "#1baf7a" })),
    { max: 100, emptyText: "Attendance appears here once events are running or completed." }
  );

  kit.columns(
    (k) => {
      k.section("Category breakdown");
      k.hBars(data.categoryBreakdown.slice(0, 8).map((c) => ({ label: c.label, value: c.count })), { emptyText: "No registrations yet." });
    },
    (k) => {
      k.section("How people registered");
      k.hBars(data.registeredVia.map((v) => ({ label: VIA_LABEL[v.via] ?? v.via, value: v.count })), { emptyText: "No registrations yet." });
    }
  );

  const certTotal = data.monthlyCertificates.reduce((s, m) => s + m.count, 0);
  kit.section("Certificates issued per month", `Last 12 months · ${certTotal.toLocaleString("en-PK")} in total`);
  kit.barChart(
    data.monthlyCertificates.map((m, i) => ({ label: monthLabel(m.month, i === 0 || m.month.endsWith("-01")), value: m.count })),
    { color: "#1baf7a", height: 100 }
  );

  kit.section("Top events by registrations");
  kit.table(
    [
      { header: "Event", width: 5 },
      { header: "Date", width: 2 },
      { header: "Registrations", width: 1.6, align: "right" },
      { header: "Capacity", width: 1.4, align: "right" },
    ],
    data.topEvents.map((e) => [e.title, fmtDate(e.startDateTime), e.registrations, e.maxAttendees ? `${Math.round((e.registrations / e.maxAttendees) * 100)}% of ${e.maxAttendees}` : "Unlimited"]),
    { emptyText: "No events yet." }
  );

  kit.footer(`${org.orgName} · Analytics report · EventoraX`);
  return toBuffer(doc);
}
