import { Router } from "express";
import rateLimit from "express-rate-limit";
import { orgScoped, adminOnly } from "../middleware/orgChain";
import { requireApiToken } from "../middleware/apiToken";
import { fail } from "../utils/http";
import { listTokens, createToken, revokeToken, requireApiPlan } from "../controllers/api-tokens-controller";
import {
  extListEvents,
  extGetEvent,
  extListRegistrations,
  extCreateRegistration,
  extGetRegistration,
  extUpdateRegistrationStatus,
  extCheckIn,
  extListCertificates,
  extGetCertificate,
} from "../controllers/ext-api-controller";

// Dashboard → API: admins of Enterprise organizations manage their tokens.
export const apiTokensRouter = Router();
apiTokensRouter.use(...orgScoped, adminOnly, requireApiPlan);
apiTokensRouter.get("/", listTokens);
apiTokensRouter.post("/", createToken);
apiTokensRouter.post("/:id/revoke", revokeToken);

// 120 requests per minute for each token (counted per token, not per IP).
const perToken = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `token:${req.apiToken!.id}`,
  handler: (_req, res) => {
    fail(res, 429, "RATE_LIMITED", "Too many requests: the limit is 120 per minute per token");
  },
});

// The public REST API (see /developers). Authenticated with "Authorization: Bearer evx_live_…".
export const extApiRouter = Router();
extApiRouter.use(requireApiToken, perToken);
extApiRouter.get("/events", extListEvents);
extApiRouter.get("/events/:id", extGetEvent);
extApiRouter.get("/events/:id/registrations", extListRegistrations);
extApiRouter.post("/events/:id/registrations", extCreateRegistration);
extApiRouter.get("/events/:id/certificates", extListCertificates);
extApiRouter.get("/registrations/:id", extGetRegistration);
extApiRouter.patch("/registrations/:id", extUpdateRegistrationStatus);
extApiRouter.post("/check-in", extCheckIn);
extApiRouter.get("/certificates/:code", extGetCertificate);
