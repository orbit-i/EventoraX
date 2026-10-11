import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveTenant, requireTenantRole } from '../middleware/tenant.js';

const router = express.Router();

const PLAN_LIMITS = {
  Starter: { price: 0, attendees: 500, maxEvents: 5, apiAccess: false, whiteLabel: false },
  Professional: { price: 49, attendees: 5000, maxEvents: 25, apiAccess: false, whiteLabel: true },
  Enterprise: { price: 199, attendees: 50000, maxEvents: 500, apiAccess: true, whiteLabel: true },
  'PaaS Developer': { price: 299, attendees: 25000, maxEvents: 50, apiAccess: true, whiteLabel: true }
};

// GET /api/billing - Get current organization's subscription & usage
router.get('/', verifyToken, resolveTenant, async (req, res) => {
  try {
    const tenant = req.tenant;

    const [subRows] = await query(
      'SELECT * FROM \`subscriptions\` WHERE \`tenant_id\` = ? ORDER BY \`created_at\` DESC LIMIT 1',
      [tenant.id]
    );

    const planName = tenant.plan || subRows[0]?.plan || 'Professional';
    const planInfo = PLAN_LIMITS[planName] || PLAN_LIMITS.Professional;

    // Get attendees used count for this tenant
    const [attendeeRows] = await query(
      'SELECT COALESCE(SUM(`registered_count`), 0) as used FROM `events` WHERE `tenant_id` = ?',
      [tenant.id]
    );
    const used = attendeeRows[0]?.used || 0;

    return res.json({
      success: true,
      billing: {
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        plan: planName,
        price: planInfo.price,
        period: '/month',
        renewsOn: 'Next billing cycle',
        attendeesUsed: used,
        attendeesLimit: planInfo.attendees,
        maxEvents: planInfo.maxEvents,
        apiAccess: planInfo.apiAccess,
        whiteLabel: planInfo.whiteLabel
      }
    });
  } catch (error) {
    console.error('[Billing Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve billing info.' });
  }
});

// POST /api/billing/upgrade - Upgrade or change organization plan
router.post('/upgrade', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !PLAN_LIMITS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected.' });
    }

    const planInfo = PLAN_LIMITS[plan];
    const tenantId = req.tenantId;

    // Update tenant record
    await query(
      'UPDATE `tenants` SET `plan` = ?, `max_attendees` = ?, `max_events` = ?, `api_access_enabled` = ?, `white_label_enabled` = ? WHERE `id` = ?',
      [plan, planInfo.attendees, planInfo.maxEvents, planInfo.apiAccess ? 1 : 0, planInfo.whiteLabel ? 1 : 0, tenantId]
    );

    // Also update user plan
    await query('UPDATE `users` SET `plan` = ? WHERE `id` = ?', [plan, req.user.id]);

    // Insert subscription record
    await query(
      `INSERT INTO \`subscriptions\` (\`tenant_id\`, \`user_id\`, \`plan\`, \`price\`, \`billing_cycle\`, \`attendees_limit\`, \`status\`)
       VALUES (?, ?, ?, ?, 'monthly', ?, 'active')`,
      [tenantId, req.user.id, plan, planInfo.price, planInfo.attendees]
    );

    // Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'billing', 'Plan upgraded', ?)`,
      [tenantId, req.user.id, req.user.email, `Switched organization subscription to ${plan} ($${planInfo.price}/mo)`]
    );

    return res.json({
      success: true,
      message: `Organization successfully upgraded to ${plan} tier!`,
      plan,
      price: planInfo.price,
      attendeesLimit: planInfo.attendees
    });
  } catch (error) {
    console.error('[Plan Upgrade Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update plan.' });
  }
});

export default router;
