import { Router } from "express";
import { superAdminOnly } from "../middleware/orgChain";
import { platformDashboard } from "../controllers/superadmin/dashboard-controller";
import {
  listTenants,
  tenantStats,
  exportTenants,
  getTenant,
  createTenant,
  updateTenant,
  changeTenantPlan,
  extendTenant,
  suspendTenant,
  unsuspendTenant,
  impersonateTenant,
  deleteTenant,
} from "../controllers/superadmin/tenants-controller";
import { listPlans } from "../controllers/superadmin/plans-controller";

// Everything here is for the platform owner only.
export const superadminRouter = Router();
superadminRouter.use(...superAdminOnly);

superadminRouter.get("/dashboard", platformDashboard);

// Tenants (fixed paths before /:id)
superadminRouter.get("/tenants", listTenants);
superadminRouter.get("/tenants/stats", tenantStats);
superadminRouter.get("/tenants/export", exportTenants);
superadminRouter.post("/tenants", createTenant);
superadminRouter.get("/tenants/:id", getTenant);
superadminRouter.patch("/tenants/:id", updateTenant);
superadminRouter.post("/tenants/:id/plan", changeTenantPlan);
superadminRouter.post("/tenants/:id/extend", extendTenant);
superadminRouter.post("/tenants/:id/suspend", suspendTenant);
superadminRouter.post("/tenants/:id/unsuspend", unsuspendTenant);
superadminRouter.post("/tenants/:id/impersonate", impersonateTenant);
superadminRouter.delete("/tenants/:id", deleteTenant);

// Plans
superadminRouter.get("/plans", listPlans);
