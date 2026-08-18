import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getTenants, createTenant, selectTenantById, suspendTenant, deleteTenant, extendTrial, impersonateTenant } from "../controllers/tenant.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createTenantSchema } from "../validators/tenant.validator.js";

const router = express.Router();

router.route("/get-tenants").get(verifyJWT, getTenants);
router.route("/create-tenant").post(validate(createTenantSchema), createTenant);
router.route("/select-tenant/:tenantId").get(selectTenantById);
router.route("/suspend-tenant/:tenantId").patch(suspendTenant);
router.route("/delete-tenant/:tenantId").delete(deleteTenant);
router.route("/extend-trial/:tenantId").post(extendTrial);
router.route("/impersonate/:tenantId").post(verifyJWT, impersonateTenant);

export default router;