import { Router } from "express";
import rateLimit from "express-rate-limit";
import { fail } from "../utils/http";
import { publicOrg, publicEvent, publicRegister } from "../controllers/public-controller";

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 429, "RATE_LIMITED", "Too many requests. Please wait a minute and try again.");
  },
});

// Registering is limited per IP, so nobody can flood an event with fake sign-ups.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 429, "RATE_LIMITED", "Too many registrations from this connection. Please try again in an hour.");
  },
});

// No login: the public organization page and event pages.
export const publicRouter = Router();
publicRouter.get("/orgs/:slug", readLimiter, publicOrg);
publicRouter.get("/events/:id", readLimiter, publicEvent);
publicRouter.post("/events/:id/register", registerLimiter, publicRegister);
