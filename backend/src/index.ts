import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
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

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));

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
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof MulterError) {
    return res.status(400).json({ error: err.message });
  }
  const status = statusOf(err);
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? "Something went wrong" : err instanceof Error ? err.message : "Bad request",
  });
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

