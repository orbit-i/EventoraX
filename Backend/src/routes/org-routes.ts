import { Router } from "express";
import { authedQuery } from "../middleware/auth";
import { requireRole } from "../middleware/role-check.auth";
import { checkOrgStatus } from "../middleware/checkOrgStatus";
import { logoUpload } from "../utils/upload";
import {
  getOrgProfile,
  updateOrgSettings,
  uploadLogo,
  assignPlan,
} from "../controllers/org-controller";
import { attachScopedPrisma } from "../middleware/scopedPrisma";

const router = Router();

router.get("/me", authedQuery, checkOrgStatus, attachScopedPrisma, getOrgProfile);
router.patch("/me", authedQuery, checkOrgStatus, attachScopedPrisma, requireRole(["admin", "superAdmin"]), updateOrgSettings);
router.post("/me/logo", authedQuery, checkOrgStatus, attachScopedPrisma, requireRole(["admin", "superAdmin"]), logoUpload.single("logo"), uploadLogo);
router.patch("/me/plan", authedQuery, attachScopedPrisma, requireRole(["superAdmin"]), assignPlan);
export default router;