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
import { listPlans, createPlan, updatePlan, deletePlan } from "../controllers/superadmin/plans-controller";
import {
  listPayments,
  paymentStats,
  exportPayments,
  confirmPayment,
  rejectPayment,
  revenueOverview,
} from "../controllers/superadmin/payments-controller";

import { listUsers, userStats, exportUsers, getUser, disableUser, enableUser, forceLogout, resetUserPassword } from "../controllers/superadmin/users-controller";
import {
  listAllCertificates,
  allCertificateStats,
  certificateEvents,
  getCertificate,
  certificatePdfForAdmin,
  revokeAnyCertificate,
  restoreAnyCertificate,
  bulkRevoke,
  platformTemplates,
  platformTemplatePreview,
} from "../controllers/superadmin/certificates-controller";
import { getPlatformAnalytics, platformAnalyticsReport, platformAnalyticsCsv } from "../controllers/superadmin/analytics-controller";

import { getSettings, updateSettings, uploadPlatformImage } from "../controllers/superadmin/settings-controller";
import { imageUpload } from "../utils/upload";
import { platformActivity, exportPlatformActivity, loginAttempts, securityOverview } from "../controllers/superadmin/security-controller";
import {
  listTemplates,
  saveTemplate,
  resetTemplate,
  previewTemplate,
  sendTestTemplate,
  getSmtp,
  saveSmtp,
  clearSmtp,
  verifySmtp,
} from "../controllers/superadmin/emails-controller";

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
superadminRouter.post("/plans", createPlan);
superadminRouter.patch("/plans/:id", updatePlan);
superadminRouter.delete("/plans/:id", deletePlan);

// Payments & revenue
superadminRouter.get("/revenue", revenueOverview);
superadminRouter.get("/payments", listPayments);
superadminRouter.get("/payments/stats", paymentStats);
superadminRouter.get("/payments/export", exportPayments);
superadminRouter.post("/payments/:id/confirm", confirmPayment);
superadminRouter.post("/payments/:id/reject", rejectPayment);

// Users (every account on the platform)
superadminRouter.get("/users", listUsers);
superadminRouter.get("/users/stats", userStats);
superadminRouter.get("/users/export", exportUsers);
superadminRouter.get("/users/:id", getUser);
superadminRouter.post("/users/:id/disable", disableUser);
superadminRouter.post("/users/:id/enable", enableUser);
superadminRouter.post("/users/:id/logout", forceLogout);
superadminRouter.post("/users/:id/reset-password", resetUserPassword);

// Certificates across all tenants
superadminRouter.get("/certificates", listAllCertificates);
superadminRouter.get("/certificates/stats", allCertificateStats);
superadminRouter.get("/certificates/events", certificateEvents);
superadminRouter.get("/certificates/templates", platformTemplates);
superadminRouter.get("/certificates/preview", platformTemplatePreview);
superadminRouter.post("/certificates/bulk-revoke", bulkRevoke);
superadminRouter.get("/certificates/:id", getCertificate);
superadminRouter.get("/certificates/:id/pdf", certificatePdfForAdmin);
superadminRouter.post("/certificates/:id/revoke", revokeAnyCertificate);
superadminRouter.post("/certificates/:id/restore", restoreAnyCertificate);

// Platform analytics
superadminRouter.get("/analytics", getPlatformAnalytics);
superadminRouter.get("/analytics/report", platformAnalyticsReport);
superadminRouter.get("/analytics/export", platformAnalyticsCsv);

// System settings
superadminRouter.get("/settings", getSettings);
superadminRouter.patch("/settings", updateSettings);
superadminRouter.post("/uploads", imageUpload.single("file"), uploadPlatformImage);

// Email templates & SMTP
superadminRouter.get("/emails", listTemplates);
superadminRouter.put("/emails/:type", saveTemplate);
superadminRouter.delete("/emails/:type", resetTemplate);
superadminRouter.post("/emails/:type/preview", previewTemplate);
superadminRouter.post("/emails/:type/test", sendTestTemplate);
superadminRouter.get("/smtp", getSmtp);
superadminRouter.put("/smtp", saveSmtp);
superadminRouter.delete("/smtp", clearSmtp);
superadminRouter.post("/smtp/verify", verifySmtp);

// Security & activity log
superadminRouter.get("/security/overview", securityOverview);
superadminRouter.get("/security/activity", platformActivity);
superadminRouter.get("/security/activity/export", exportPlatformActivity);
superadminRouter.get("/security/logins", loginAttempts);
