import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const PLAN_LIMITS = {
  Starter: { price: 0, attendees: 500 },
  Professional: { price: 99, attendees: 5000 },
  Enterprise: { price: 299, attendees: 50000 },
};

// GET /api/billing - Get current plan & usage
router.get('/', verifyToken, async (req, res) => {
  try {
    const [subRows] = await query('SELECT * FROM `subscriptions` WHERE `user_id` = ? ORDER BY `created_at` DESC LIMIT 1', [req.user.id]);
    const [userRows] = await query('SELECT `plan` FROM `users` WHERE `id` = ?', [req.user.id]);

    const planName = userRows[0]?.plan || subRows[0]?.plan || 'Professional';
    const planInfo = PLAN_LIMITS[planName] || PLAN_LIMITS.Professional;

    // Get attendees used count
    const [attendeeRows] = await query('SELECT SUM(`registered_count`) as used FROM `events` WHERE `organizer_id` = ?', [req.user.id]);
    const used = attendeeRows[0]?.used || 3245;

    return res.json({
      success: true,
      billing: {
        plan: planName,
        price: planInfo.price,
        period: '/month',
        renewsOn: 'July 15, 2025',
        attendeesUsed: used,
        attendeesLimit: planInfo.attendees,
      }
    });
  } catch (error) {
    console.error('[Billing Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve billing info.' });
  }
});

// POST /api/billing/upgrade - Upgrade or change plan
router.post('/upgrade', verifyToken, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !PLAN_LIMITS[plan]) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected.' });
    }

    const planInfo = PLAN_LIMITS[plan];

    await query('UPDATE `users` SET `plan` = ? WHERE `id` = ?', [plan, req.user.id]);

    await query(
      `INSERT INTO \`subscriptions\` (\`user_id\`, \`plan\`, \`price\`, \`billing_cycle\`, \`attendees_limit\`, \`status\`)
       VALUES (?, ?, ?, 'monthly', ?, 'active')`,
      [req.user.id, plan, planInfo.price, planInfo.attendees]
    );

    // Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'billing', 'Plan upgraded', ?)`,
      [req.user.id, req.user.email, `Switched subscription to ${plan} plan ($${planInfo.price}/mo)`]
    );

    return res.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan!`,
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
