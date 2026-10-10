import { Router } from "express";
import rateLimit from "express-rate-limit";
import { orgScoped, canWrite } from "../middleware/orgChain";
import { fail } from "../utils/http";
import {
  getTemplates,
  previewCertificate,
  listCertificates,
  certificateStats,
  certificateCandidates,
  issueOne,
  issueBulk,
  emailMany,
  downloadCertificate,
  emailOne,
  revokeCertificate,
  restoreCertificate,
  publicVerify,
  publicCertificatePdf,
} from "../controllers/certificates-controller";

export const certificatesRouter = Router();
certificatesRouter.use(...orgScoped);

// Fixed paths first, then /:id
certificatesRouter.get("/templates", getTemplates);
certificatesRouter.get("/preview", previewCertificate);
certificatesRouter.get("/stats", certificateStats);
certificatesRouter.get("/candidates", canWrite, certificateCandidates);
certificatesRouter.get("/", listCertificates);
certificatesRouter.post("/", canWrite, issueOne);
certificatesRouter.post("/bulk", canWrite, issueBulk);
certificatesRouter.post("/email", canWrite, emailMany);
certificatesRouter.get("/:id/pdf", downloadCertificate);
certificatesRouter.post("/:id/email", canWrite, emailOne);
certificatesRouter.post("/:id/revoke", canWrite, revokeCertificate);
certificatesRouter.post("/:id/restore", canWrite, restoreCertificate);

// Public certificate check — no login. Limited so codes can't be guessed in bulk.
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, 429, "RATE_LIMITED", "Too many checks in a short time. Please wait a minute and try again.");
  },
});

export const verifyRouter = Router();
verifyRouter.use(verifyLimiter);
verifyRouter.get("/:code", publicVerify);
verifyRouter.get("/:code/pdf", publicCertificatePdf);
