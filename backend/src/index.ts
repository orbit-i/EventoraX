import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "./utils/rateLimits";
import { MulterError } from "multer";
import prisma from "./prisma/client";
import { UPLOAD_ROOT } from "./utils/storage";
import authRoutes from "./routes/auth-route";
import orgRoutes from "./routes/org-routes";
import teamRoutes from "./routes/team-routes";
import { eventsRouter, categoriesRouter } from "./routes/events-routes";
import { speakersRouter, sponsorsRouter, sessionsRouter, reorderRouter } from "./routes/program-routes";
import { registrationsRouter } from "./routes/registrations-routes";
import { uploadsRouter } from "./routes/uploads-routes";
import { certificatesRouter, verifyRouter } from "./routes/certificates-routes";
import { ticketsRouter } from "./routes/tickets-routes";
import { idCardsRouter } from "./routes/idcards-routes";
import { superadminRouter } from "./routes/superadmin-routes";
import { notificationsRouter } from "./routes/notifications-routes";
import { publicRouter } from "./routes/public-routes";
import { apiTokensRouter, extApiRouter } from "./routes/api-routes";
import { publicPlans } from "./controllers/superadmin/plans-controller";
import { publicPlatform, publicWebsite } from "./controllers/superadmin/settings-controller";
import { maintenanceGate } from "./middleware/maintenance";
import { recordError } from "./utils/errorLog";
import { startScheduler } from "./jobs";
   import {
     dashboardRouter,
     analyticsRouter,
     activityRouter,
     billingRouter,
     supportRouter,
     contactRouter,
   } from "./routes/dashboard-routes";
const app = express();

// Correct client IPs when running behind a proxy (Hostinger, Nginx, Docker).
app.set("trust proxy", 1);

// Security headers. The content policy matters once this server also serves the built website (Phase 12):
// images may come from https links (org logos), PDFs are previewed from blob: URLs, fonts from Google.
const production = process.env.NODE_ENV === "production";
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Only force https in production (on http://localhost it would lock the browser out of the dev server).
    hsts: production ? { maxAge: 31536000, includeSubDomains: true } : false,
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests: production ? [] : null,
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        frameSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        mediaSrc: ["'self'", "blob:"],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use("/api", apiLimiter); // 600 requests per minute per IP, a safety net for the whole API

// Uploaded files (logos, signatures, later certificates)
app.use("/uploads", express.static(UPLOAD_ROOT));

app.get("/api/v1/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: "up" });
  } catch {
    res.status(503).json({ ok: false, db: "down" });
  }
});

// Maintenance mode: everything below answers 503 for non-superadmins (see the middleware for exceptions).
app.use("/api/v1", maintenanceGate);
app.get("/api/v1/platform", publicPlatform); // public: name, banner, maintenance, SEO
app.get("/api/v1/platform/website", publicWebsite); // public: home-page stats, testimonials, logos

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/org", orgRoutes);
app.use("/api/v1/team", teamRoutes);
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/speakers", speakersRouter);
app.use("/api/v1/sponsors", sponsorsRouter);
app.use("/api/v1/sessions", sessionsRouter);
app.use("/api/v1/reorder", reorderRouter);
app.use("/api/v1/registrations", registrationsRouter);
app.use("/api/v1/uploads", uploadsRouter);
app.use("/api/v1/certificates", certificatesRouter);
app.use("/api/v1/verify", verifyRouter);
app.use("/api/v1/tickets", ticketsRouter);
app.use("/api/v1/idcards", idCardsRouter);
app.use("/api/v1/superadmin", superadminRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/public", publicRouter);
app.use("/api/v1/api-tokens", apiTokensRouter);
app.use("/api/v1/ext", extApiRouter); // public REST API (Enterprise, API tokens)
app.get("/api/v1/plans", publicPlans); // public: pricing page
   app.use("/api/v1/dashboard", dashboardRouter);
   app.use("/api/v1/analytics", analyticsRouter);
   app.use("/api/v1/activity", activityRouter);
   app.use("/api/v1/billing", billingRouter);
   app.use("/api/v1/support", supportRouter);
   app.use("/api/v1/contact", contactRouter);

// Unknown API route → JSON 404 (not an HTML page)
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

function statusOf(err: unknown): number {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return 500;
}

// One place that turns any thrown error into a clean JSON response.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof MulterError) {
    return res.status(400).json({ error: err.message });
  }
  const status = statusOf(err);
  if (status >= 500) {
    console.error(err);
    void recordError(err, req, status); // shown on Superadmin → Maintenance
  }
  res.status(status).json({
    error: status >= 500 ? "Something went wrong" : err instanceof Error ? err.message : "Bad request",
  });
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  startScheduler();
});

