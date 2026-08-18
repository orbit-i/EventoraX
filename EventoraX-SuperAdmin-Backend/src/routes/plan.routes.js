import express from 'express';
import { createPlanSchema, updatePlanSchema } from '../validators/plan.validator.js';
import { validate } from '../middlewares/validate.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { createPlan, deletePlan, getAllPlans, getPlan, updatePlan } from '../controllers/plan.controller.js';

const router = express.Router();

router.route("/create-plan").post(validate(createPlanSchema), createPlan);
router.route("/get-plans").get(getAllPlans);
router.route("/get-plan/:planId").get(getPlan);
router.route("/update-plan/:planId").patch(validate(updatePlanSchema), updatePlan);
router.route("/delete-plan").delete(deletePlan);

export default router;