import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role-check.auth";
import { checkOrgStatus } from "../middleware/checkOrgStatus";
import { imageUpload } from "../utils/upload";
import { getOrgProfile, updateOrgSettings, uploadOrgImage } from "../controllers/org-controller";

const router = Router();

// Expired orgs can still view and edit their profile so they can renew.
router.use(requireAuth, checkOrgStatus({ allowExpired: true }));

router.get("/me", getOrgProfile);
router.patch("/me", requireRole(["admin"]), updateOrgSettings);
router.post("/me/logo", requireRole(["admin"]), imageUpload.single("file"), uploadOrgImage("logo"));
router.post("/me/signature", requireRole(["admin"]), imageUpload.single("file"), uploadOrgImage("signature"));

export default router;