import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { getPlanDistribution, getRevenueGrowth, getRevenueOverview } from '../controllers/revenue.controller.js';

const router = express.Router();

router.route("/revenue-overview").get(verifyJWT, getRevenueOverview);
router.route("/revenue-growth").get(verifyJWT, getRevenueGrowth);
router.route("/revenue-plan-distribution").get(verifyJWT, getPlanDistribution);

export default router;