import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role-check.auth";
import { attachScopedPrisma } from "../middleware/scopedPrisma";
import { checkOrgStatus } from "../middleware/checkOrgStatus";
import {
  getTeamMembers,
  inviteMember,
  cancelInvite,
  updateMemberRole,
  removeMember,
} from "../controllers/team-controller";

const router = Router();

router.use(requireAuth, checkOrgStatus(), attachScopedPrisma);

router.get("/", requireRole(["admin", "manager", "viewer"]), getTeamMembers);
router.post("/invite", requireRole(["admin"]), inviteMember);
router.delete("/invites/:inviteId", requireRole(["admin"]), cancelInvite);
router.patch("/:userId/role", requireRole(["admin"]), updateMemberRole);
router.delete("/:userId", requireRole(["admin"]), removeMember);

export default router;