import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveTenant, requireTenantRole } from '../middleware/tenant.js';

const router = express.Router();

const PLAN_LIMITS = {
  Starter: { price: 0, attendees: 500, maxEvents: 5, whiteLabel: false },
  Professional: { price: 99, attendees: 5000, maxEvents: 25, whiteLabel: true },
  Enterprise: { price: 299, attendees: 50000, maxEvents: 500, whiteLabel: true }
};

// GET /api/billing - Get current organization's subscription & usage
router.get('/', verifyToken, resolveTenant, async (req, res) => {
  try {
    const tenant = req.tenant;
    const isMasterAuthority = req.user?.role === 'admin' || tenant.id === 1 || tenant.slug === 'eventorax-hq';

    // Get attendees used count for this tenant
    const [attendeeRows] = await query(
      'SELECT COALESCE(SUM(`registered_count`), 0) as used FROM `events` WHERE `tenant_id` = ?',
      [tenant.id]
    );
    const used = attendeeRows[0]?.used || 0;

    if (isMasterAuthority) {
      return res.json({
        success: true,
        isSuperAdmin: true,
        billing: {
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          plan: 'Platform Authority',
          isSuperAdmin: true,
          price: 0,
          period: 'Lifetime',
          renewsOn: 'Lifetime Owner (No Billing Required)',
          attendeesUsed: used,
          attendeesLimit: 999999999,
          maxEvents: 999999999,
          whiteLabel: true
        }
      });
    }

    const [subRows] = await query(
      'SELECT * FROM `subscriptions` WHERE `tenant_id` = ? ORDER BY `created_at` DESC LIMIT 1',
      [tenant.id]
    );

    const planName = tenant.plan || subRows[0]?.plan || 'Starter';
    const planInfo = PLAN_LIMITS[planName] || PLAN_LIMITS.Starter;

    return res.json({
      success: true,
      isSuperAdmin: false,
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
        whiteLabel: planInfo.whiteLabel
      }
    });
  } catch (error) {
    console.error('[Billing Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve billing info.' });
  }
});

// POST /api/billing/upgrade - Upgrade or change client organization plan
router.post('/upgrade', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const { plan } = req.body;
    const tenant = req.tenant;

    if (req.user?.role === 'admin' || tenant.id === 1 || tenant.slug === 'eventorax-hq') {
      return res.status(400).json({
        success: false,
        message: 'SuperAdmin has unlimited platform authority and cannot be assigned a paid client subscription.'
      });
    }

    if (!PLAN_LIMITS[plan]) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan selected. Valid options are: ${Object.keys(PLAN_LIMITS).join(', ')}`
      });
    }

    const newLimits = PLAN_LIMITS[plan];

    // Update tenant record
    await query(
      'UPDATE `tenants` SET `plan` = ?, `max_events` = ?, `max_attendees` = ?, `white_label_enabled` = ? WHERE `id` = ?',
      [plan, newLimits.maxEvents, newLimits.attendees, newLimits.whiteLabel ? 1 : 0, tenant.id]
    );

    // Record subscription
    await query(
      'INSERT INTO `subscriptions` (`tenant_id`, `user_id`, `plan`, `price`, `billing_cycle`, `attendees_limit`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tenant.id, req.user.id, plan, newLimits.price, 'monthly', newLimits.attendees, 'active']
    );

    return res.json({
      success: true,
      message: `Plan upgraded to ${plan}!`,
      plan,
      price: newLimits.price,
      attendeesLimit: newLimits.attendees
    });
  } catch (error) {
    console.error('[Billing Upgrade Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to upgrade plan.' });
  }
});

// POST /api/billing/purchase - Submit real plan purchase with secure payment details
router.post('/purchase', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly', paymentMethod = 'card', transactionRef, amount, currency = 'USD', notes } = req.body;
    const tenant = req.tenant;

    if (req.user?.role === 'admin' || tenant.id === 1 || tenant.slug === 'eventorax-hq') {
      return res.status(400).json({
        success: false,
        message: 'SuperAdmin has unlimited platform authority and cannot purchase a paid client subscription.'
      });
    }

    if (!PLAN_LIMITS[plan]) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan selected. Valid options are: ${Object.keys(PLAN_LIMITS).join(', ')}`
      });
    }

    const planInfo = PLAN_LIMITS[plan];
    const finalAmount = amount || (planInfo.price * (billingCycle === 'yearly' ? 10 : 1));
    const finalRef = transactionRef || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Insert pending subscription record awaiting SuperAdmin verification
    const [subResult] = await query(
      'INSERT INTO `subscriptions` (`tenant_id`, `user_id`, `plan`, `price`, `billing_cycle`, `attendees_limit`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tenant.id, req.user.id, plan, finalAmount, billingCycle, planInfo.attendees, 'pending_approval']
    );

    // If Starter (free tier), auto-activate; paid tiers require SuperAdmin verification
    if (plan === 'Starter' || finalAmount === 0) {
      await query(
        'UPDATE `tenants` SET `plan` = ?, `max_events` = ?, `max_attendees` = ?, `white_label_enabled` = ? WHERE `id` = ?',
        [plan, planInfo.maxEvents, planInfo.attendees, 0, tenant.id]
      );
      return res.json({
        success: true,
        message: 'Starter tier activated successfully!',
        plan,
        status: 'active',
        invoiceNumber: finalRef
      });
    }

    // Trigger SuperAdmin Notification
    try {
      const { dispatchNotification } = await import('../services/notificationsService.js');
      await dispatchNotification({
        title: 'New Client Subscription Purchase Pending Approval',
        message: `Organization "${tenant.name}" (${req.user.email}) submitted ${currency} ${finalAmount} for ${plan} (${billingCycle}) via ${paymentMethod.toUpperCase()} (Ref: ${finalRef}). Pending SuperAdmin approval.`,
        category: 'billing',
        severity: 'warning',
        metadata: {
          tenantId: tenant.id,
          plan,
          amount: finalAmount,
          currency,
          paymentMethod,
          transactionRef: finalRef
        }
      });
    } catch (notifErr) {
      console.warn('Notification dispatch failed:', notifErr);
    }

    return res.json({
      success: true,
      message: 'Subscription payment details submitted successfully! Your account plan is in queue for SuperAdmin approval.',
      plan,
      status: 'pending_approval',
      invoiceNumber: finalRef,
      paymentMethod,
      amount: finalAmount,
      currency
    });
  } catch (error) {
    console.error('[Billing Purchase Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process subscription purchase.' });
  }
});

// GET /api/billing/transactions - Get invoices & payment history for current tenant
router.get('/transactions', verifyToken, resolveTenant, async (req, res) => {
  try {
    const tenant = req.tenant;
    const [rows] = await query(
      'SELECT * FROM `subscriptions` WHERE `tenant_id` = ? ORDER BY `created_at` DESC',
      [tenant.id]
    );

    return res.json({
      success: true,
      transactions: rows || []
    });
  } catch (error) {
    console.error('[Billing Transactions Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve transactions.' });
  }
});

export default router;
