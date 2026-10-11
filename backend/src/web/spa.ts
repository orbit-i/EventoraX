import fs from "fs";
import path from "path";
import express, { type Express, type Request } from "express";
import prisma from "../prisma/client";
import { getSetting } from "../utils/settings";
import { escapeHtml } from "../utils/mail";
import { normaliseVerifyCode } from "../services/certificates";

// Serves the built website (Vite's dist/) from this same server, so one process runs the API and the app.
// WhatsApp, Facebook, LinkedIn and X don't run JavaScript when they build a link preview, so for shareable
// pages (/e/:id, /o/:slug, /verify/:code) the title, description and image are written into the HTML here.
// In development the website runs on Vite (:5173) and nothing here is used unless dist/ exists.

const DIST = process.env.WEB_DIST ? path.resolve(process.env.WEB_DIST) : path.resolve(__dirname, "../../../dist");
const INDEX = path.join(DIST, "index.html");

interface Meta {
  title: string;
  description: string;
  /** Absolute or site-relative; made absolute before it's written */
  image: string;
  /** "summary" for square logos, "summary_large_image" for the 1200×630 card */
  card: "summary" | "summary_large_image";
  type?: "website" | "article";
  status?: number;
}

const DEFAULT_IMAGE = "/og-image.png";
const PUBLIC_EVENT = ["PUBLISHED", "ONGOING", "COMPLETED"];

const when = (d: Date) =>
  new Intl.DateTimeFormat("en-PK", { timeZone: "Asia/Karachi", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);

/** First sentence-ish chunk of a long text, cut at a word boundary. */
function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

async function siteDefaults(): Promise<Meta> {
  const name = await getSetting("platform.name", "EventoraX");
  const seo = await getSetting<{ title?: string; description?: string }>("seo", {});
  return {
    title: seo.title || `${name} | Event management for universities and organizations`,
    description: seo.description || "Events, registrations, QR tickets, certificates and analytics in one place. Made in Pakistan by ORBIT-I.",
    image: DEFAULT_IMAGE,
    card: "summary_large_image",
  };
}

async function metaFor(pathname: string): Promise<Meta> {
  const site = await siteDefaults();
  const siteName = await getSetting("platform.name", "EventoraX");
  const notFound = (title: string): Meta => ({ ...site, title: `${title} | ${siteName}`, status: 404 });

  const eventMatch = /^\/e\/([^/]+)\/?$/.exec(pathname);
  if (eventMatch) {
    const event = await prisma.event.findUnique({
      where: { id: decodeURIComponent(eventMatch[1]!) },
      select: {
        title: true, description: true, topic: true, mode: true, location: true, startDateTime: true, status: true,
        organization: { select: { name: true, whiteLabelName: true, logoUrl: true, status: true } },
      },
    });
    if (!event || !PUBLIC_EVENT.includes(event.status) || event.organization.status === "suspended") return notFound("Event not found");
    const org = event.organization.whiteLabelName || event.organization.name;
    const where = event.mode === "ONLINE" ? "Online" : event.location || (event.mode === "HYBRID" ? "Hybrid" : "");
    const facts = [when(event.startDateTime), where, org].filter(Boolean).join(" · ");
    const about = event.description || event.topic;
    return {
      title: `${event.title} | ${org}`,
      description: clip(about ? `${facts}. ${about}` : facts, 200),
      image: event.organization.logoUrl || DEFAULT_IMAGE,
      card: event.organization.logoUrl ? "summary" : "summary_large_image",
      type: "article",
    };
  }

  const orgMatch = /^\/o\/([^/]+)\/?$/.exec(pathname);
  if (orgMatch) {
    const org = await prisma.organization.findUnique({
      where: { slug: decodeURIComponent(orgMatch[1]!) },
      select: { name: true, whiteLabelName: true, logoUrl: true, status: true },
    });
    if (!org || org.status === "suspended") return notFound("Page not found");
    const name = org.whiteLabelName || org.name;
    return {
      title: `${name} | Events`,
      description: `Upcoming and past events by ${name}. Register online and get your ticket by email.`,
      image: org.logoUrl || DEFAULT_IMAGE,
      card: org.logoUrl ? "summary" : "summary_large_image",
    };
  }

  const verifyMatch = /^\/verify\/([^/]+)\/?$/.exec(pathname);
  if (verifyMatch) {
    const cert = await prisma.certificate.findUnique({
      where: { verifyCode: normaliseVerifyCode(decodeURIComponent(verifyMatch[1]!)) },
      select: {
        recipientName: true, type: true, status: true, issuedAt: true,
        event: { select: { title: true, organization: { select: { name: true, whiteLabelName: true, logoUrl: true } } } },
      },
    });
    if (!cert) return { ...site, title: `Verify a certificate | ${siteName}`, description: "Check that an EventoraX certificate is genuine." };
    const org = cert.event.organization.whiteLabelName || cert.event.organization.name;
    const kind = cert.type.charAt(0) + cert.type.slice(1).toLowerCase();
    return {
      title: cert.status === "REVOKED" ? `Revoked certificate | ${org}` : `${cert.recipientName} | Certificate of ${kind}`,
      description:
        cert.status === "REVOKED"
          ? `This certificate for "${cert.event.title}" was revoked by ${org}.`
          : `Verified certificate of ${kind.toLowerCase()} for "${cert.event.title}", issued by ${org}.`,
      image: cert.event.organization.logoUrl || DEFAULT_IMAGE,
      card: cert.event.organization.logoUrl ? "summary" : "summary_large_image",
    };
  }

  return site;
}

/** Removes the generic tags from index.html and writes the page's own ones. */
function render(html: string, meta: Meta, origin: string, pathname: string) {
  const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${origin}${u.startsWith("/") ? "" : "/"}${u}`);
  const a = (v: string) => escapeHtml(v);
  const url = `${origin}${pathname}`;
  const tags = [
    `<title>${a(meta.title)}</title>`,
    `<meta name="description" content="${a(meta.description)}" />`,
    `<link rel="canonical" href="${a(url)}" />`,
    `<meta property="og:type" content="${meta.type ?? "website"}" />`,
    `<meta property="og:url" content="${a(url)}" />`,
    `<meta property="og:title" content="${a(meta.title)}" />`,
    `<meta property="og:description" content="${a(meta.description)}" />`,
    `<meta property="og:image" content="${a(abs(meta.image))}" />`,
    `<meta name="twitter:card" content="${meta.card}" />`,
    `<meta name="twitter:title" content="${a(meta.title)}" />`,
    `<meta name="twitter:description" content="${a(meta.description)}" />`,
    `<meta name="twitter:image" content="${a(abs(meta.image))}" />`,
  ].join("\n    ");
  return html
    .replace(/\s*<title>[\s\S]*?<\/title>/i, "")
    .replace(/\s*<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>/gi, "")
    .replace(/\s*<link\s+rel="canonical"[^>]*>/gi, "")
    .replace("</head>", `    ${tags}\n  </head>`);
}

function originOf(req: Request) {
  // FRONTEND_URL is the public address once deployed; otherwise whatever host the request came to.
  const configured = process.env.FRONTEND_URL;
  if (configured && process.env.NODE_ENV === "production") return configured.replace(/\/+$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

/** Mount after every /api and /uploads route. Does nothing if the website hasn't been built. */
export function mountWebApp(app: Express) {
  if (!fs.existsSync(INDEX)) {
    console.log("Website build not found (dist/index.html); run `npm run build` in the repo root to serve it from here.");
    return;
  }
  let template = fs.readFileSync(INDEX, "utf8");
  let templateTime = fs.statSync(INDEX).mtimeMs;

  // Hashed files under /assets never change → cache for a year. Everything else (favicon, images) for an hour.
  app.use(
    express.static(DIST, {
      index: false,
      setHeaders(res, file) {
        res.setHeader("Cache-Control", file.includes(`${path.sep}assets${path.sep}`) ? "public, max-age=31536000, immutable" : "public, max-age=3600");
      },
    })
  );

  // Any other GET is a page of the single-page app.
  app.get(/^(?!\/api\/|\/uploads\/).*/, async (req, res, next) => {
    // A missing file (an old /assets/… chunk after a new deploy) is a real 404, not the app's HTML.
    if (/\.[a-z0-9]+$/i.test(req.path)) return res.status(404).type("text").send("Not found");
    try {
      const mtime = fs.statSync(INDEX).mtimeMs; // pick up a rebuilt dist/ without a restart
      if (mtime !== templateTime) {
        template = fs.readFileSync(INDEX, "utf8");
        templateTime = mtime;
      }
      const meta = await metaFor(req.path);
      res.status(meta.status ?? 200).setHeader("Cache-Control", "no-cache").type("html").send(render(template, meta, originOf(req), req.path));
    } catch (err) {
      next(err);
    }
  });
}
