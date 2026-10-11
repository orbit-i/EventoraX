import rateLimit from "express-rate-limit";

/** A per-IP limiter that answers with our normal JSON error shape. */
function limiter(windowMinutes: number, limit: number, message: string) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ data: null, error: { code: "RATE_LIMITED", message } });
    },
  });
}

// Auth routes (on top of the per-email lockout in the login route itself).
// Limits are per IP, and a whole campus Wi-Fi can share one IP, so they're kept generous.
export const loginLimiter = limiter(15, 60, "Too many login attempts from this connection. Please wait 15 minutes.");
export const twoFactorLimiter = limiter(15, 15, "Too many verification codes tried. Please wait 15 minutes and log in again.");
export const registerLimiter = limiter(60, 5, "Too many sign-ups from this connection. Please try again in an hour.");
export const passwordLimiter = limiter(15, 5, "Too many password requests. Please wait 15 minutes.");
export const emailLinkLimiter = limiter(60, 10, "Too many requests. Please try again in an hour.");
export const inviteLimiter = limiter(60, 20, "Too many attempts. Please try again in an hour.");

/** A generous safety net for the whole API, so one client can't flood the server. */
export const apiLimiter = limiter(1, 600, "Too many requests. Please slow down and try again in a minute.");
