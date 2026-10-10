import { requireAuth } from "./auth";
import { checkOrgStatus } from "./checkOrgStatus";
import { attachScopedPrisma } from "./scopedPrisma";
import { requireRole } from "./role-check.auth";

/** Logged in + organization active + org-scoped database client (req.db). */
export const orgScoped = [requireAuth, checkOrgStatus(), attachScopedPrisma];

/** Admins and managers can change data. Viewers are read-only. */
export const canWrite = requireRole(["admin", "manager"]);

/** Same as orgScoped, but still works after the plan expires (overview, billing, support). */
export const orgScopedAllowExpired = [requireAuth, checkOrgStatus({ allowExpired: true }), attachScopedPrisma];

/** Organization admins only. */
export const adminOnly = requireRole(["admin"]);