import { Router } from "express";
import { authedQuery } from "../middleware/authedQuery";
import { requireRole } from "../middleware/requireRole";
import { attachScopedPrisma } from "../middleware/attachScopedPrisma";
import {
  inviteMember,
  getTeamMembers,
  updateMemberRole,
  removeMember,
} from "../controllers/team-controller";

const router = Router();

router.use(authedQuery, attachScopedPrisma);

router.post("/invite", requireRole("superAdmin", "admin"), inviteMember);
router.get("/", requireRole("superAdmin", "admin", "manager", "viewer"), getTeamMembers);
router.patch("/:userId/role", requireRole("superAdmin", "admin"), updateMemberRole);
router.delete("/:userId", requireRole("superAdmin", "admin"), removeMember);

export default router;