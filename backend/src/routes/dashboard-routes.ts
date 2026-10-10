import { Router } from "express";
import rateLimit from "express-rate-limit";
import { orgScoped, orgScopedAllowExpired, adminOnly } from "../middleware/orgChain";
import { fail } from "../utils/http";
import { getOverview, getAnalytics } from "../controllers/dashboard-controller";
import { listActivity, exportActivity } from "../controllers/activity-controller";
import { getBilling, listPayments, submitPayment, cancelPayment } from "../controllers/billing-controller";
import { publicContact, dashboardSupport } from "../controllers/support-controller";

// Overview works even after the plan expires (so the org can see what's happening and renew).
export const dashboardRouter = Router();
dashboardRouter.get("/overview", ...orgScopedAllowExpired, getOverview);

export const analyticsRouter = Router();
analyticsRouter.get("/", ...orgScoped, getAnalytics);

export const activityRouter = Router();
activityRouter.use(...orgScoped, adminOnly);
activityRouter.get("/", listActivity);
activityRouter.get("/export", exportActivity);

// Billing must keep working when the plan has expired — that's how orgs renew.
export const billingRouter = Router();
billingRouter.use(...orgScopedAllowExpired, adminOnly);
billingRouter.get("/", getBilling);
billingRouter.get("/payments", listPayments);
billingRouter.post("/payments", submitPayment);
billingRouter.delete("/payments/:id", cancelPayment);

export const supportRouter = Router();
supportRouter.post("/", ...orgScopedAllowExpired, dashboardSupport);

// Public website contact form: at most 5 messages per hour from one visitor.
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 429, "RATE_LIMITED", "You've sent several messages already. Please try again in an hour.");
  },
});

export const contactRouter = Router();
contactRouter.post("/", contactLimiter, publicContact);