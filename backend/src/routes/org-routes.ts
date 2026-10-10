import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role-check.auth";
import { checkOrgStatus } from "../middleware/checkOrgStatus";
import {
  getOrgProfile,
  updateOrgSettings,
  deleteAllEventData,
  closeOrganization,
} from "../controllers/org-controller";

const router = Router();

// Expired orgs can still view and edit their profile so they can renew.
router.use(requireAuth, checkOrgStatus({ allowExpired: true }));

router.get("/me", getOrgProfile);
router.patch("/me", requireRole(["admin"]), updateOrgSettings);
// Logo / signature: upload with POST /uploads/image?kind=logo|signature, then save the URL here.

// Danger zone (admins only, with name + password confirmation inside)
router.post("/me/delete-data", requireRole(["admin"]), deleteAllEventData);
router.post("/me/close", requireRole(["admin"]), closeOrganization);

export default router;