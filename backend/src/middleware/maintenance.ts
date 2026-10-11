import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";
import { getSetting } from "../utils/settings";
import { verifyAuthToken } from "../utils/jwt";

// These keep working during maintenance: logging in, the superadmin panel, public certificate
// checks, the contact form and the platform info the website needs to show the maintenance message.
const OPEN_PATHS = ["/auth", "/health", "/platform", "/superadmin", "/verify", "/contact", "/plans"];

/**
 * Maintenance mode (System settings): every other API call answers 503 MAINTENANCE,
 * except for superadmins (and a superadmin who is "logged in as" someone).
 */
export async function maintenanceGate(req: Request, res: Response, next: NextFunction) {
  const enabled = await getSetting<boolean>("maintenance.enabled", false);
  if (!enabled || OPEN_PATHS.some((p) => req.path === p || req.path.startsWith(`${p}/`))) return next();

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyAuthToken(header.slice(7));
      if (payload.imp) return next();
      const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
      if (user?.role === "superAdmin") return next();
    } catch {
      // invalid token → treated like everyone else
    }
  }
  const message = await getSetting<string>("maintenance.message", "");
  return res.status(503).json({
    data: null,
    error: { code: "MAINTENANCE", message: message || "EventoraX is down for maintenance. Please try again shortly." },
  });
}
