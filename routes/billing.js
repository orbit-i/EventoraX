import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveTenant, requireTenantRole } from '../middleware/tenant.js';

const router = express.Router();

const DEFAULT_PLAN_LIMITS = {
  Starter: { 
    name: 'Starter', 
    slug: 'starter', 
    price: 36, 
    yearlyPrice: 29, 
    pricePkrMonthly: 10000,
    pricePkrYearly: 8000,
    price_usd_monthly: 36,
    price_pkr_monthly: 10000,
    attendees: 500, 
    maxEvents: 10, 
    maxCerts: 520, 
    trialEvents: 2,
    trialAttendees: 40,
    trialCerts: 50,
    description: 'Perfect for small events, meetups, training & initial credential testing',
    badge: 'Trial Available',
    features: [
      '10 Events included (Trial: 2 events)',
      'Up to 500 total attendees (Trial: 40 attendees)',
      '520 ID Passes & Certificates (Trial: 50 certs)',
      'Instant QR Code Verification',
      'Digital QR Ticketing & ID Card Designer',
      'Analytics Dashboard & Attendance Reports',
      'Renewal / Repurchase upon quota exhaustion'
    ],
    whiteLabel: false 
  },
  Professional: { 
    name: 'Professional', 
    slug: 'professional', 
    price: 49, 
    yearlyPrice: 39, 
    pricePkrMonthly: 13800,
    pricePkrYearly: 11040,
    price_usd_monthly: 49,
    price_pkr_monthly: 13800,
    attendees: 5000, 
    maxEvents: 25, 
    maxCerts: 2500, 
    description: 'Best for frequent event organizers, bootcamps & training centers',
    badge: 'Most Popular',
    features: [
      'Up to 5,000 attendees & 25 events',
      'Bulk Certificate Automation (2,500 certs/mo)',
      'CSV / Excel Recipient Auto-Merge',
      'High-Res PNG, PDF & Batch ZIP Downloads',
      'Individual Email Dispatch & Delivery Tracking',
      'Custom Brand Colors & Branded Portal (/t/slug)',
      'Multi-Role Team Collaborators',
      'Real-time Check-in Scanner'
    ],
    whiteLabel: true 
  },
  Enterprise: { 
    name: 'Enterprise', 
    slug: 'enterprise', 
    price: 299, 
    yearlyPrice: 239, 
    pricePkrMonthly: 83000,
    pricePkrYearly: 66400,
    price_usd_monthly: 299,
    price_pkr_monthly: 83000,
    attendees: 50000, 
    maxEvents: 500, 
    maxCerts: 50000, 
    description: 'For universities, government, agencies & global conferences',
    badge: 'Enterprise White-Label',
    features: [
      '50,000+ attendees & 500 events',
      'Unlimited Certificate & ID Badge Generation',
      'Full White-Labeling (Remove EventoraX)',
      'Custom Domain (events.yourdomain.com)',
      'Multi-Tenant Workspaces Isolation',
      'Tamper-Proof Public Verification Portal',
      'Dedicated Account Manager & 99.9% SLA',
      'Priority 24/7 Phone & Email Support'
    ],
    whiteLabel: true 
  }
};

// Helper: Resolve plan from DB or fallback
async function resolvePlan(nameOrSlug) {
  try {
    const slug = String(nameOrSlug || 'starter').toLowerCase().trim();
    const [rows] = await query(
      'SELECT * FROM `pricing_plans` WHERE LOWER(`slug`) = ? OR LOWER(`name`) = ? LIMIT 1',
      [slug, slug]
    );
    if (rows && rows.length > 0) {
      const p = rows[0];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.monthly_price) || 36,
        yearlyPrice: Number(p.yearly_price) || 29,
        pricePkrMonthly: Number(p.price_pkr_monthly) || (p.slug === 'starter' ? 10000 : 13800),
        pricePkrYearly: Number(p.price_pkr_yearly) || (p.slug === 'starter' ? 8000 : 11040),
        attendees: Number(p.attendees_limit) || 500,
        maxEvents: Number(p.max_events) || 10,
        maxCerts: Number(p.max_certs) || 520,
        trialEvents: Number(p.trial_events) || 2,
        trialAttendees: Number(p.trial_attendees) || 40,
        trialCerts: Number(p.trial_certs) || 50,
        whiteLabel: Boolean(p.white_label),
        description: p.description || '',
        badge: p.badge || p.tag || '',
        features: typeof p.features === 'string' ? JSON.parse(p.features || '[]') : (p.features || []),
        isActive: Boolean(p.is_active)
      };
    }
  } catch (err) {
    console.warn('[Billing] Dynamic plan query fallback:', err.message);
  }

  // Fallback to static defaults
  const key = Object.keys(DEFAULT_PLAN_LIMITS).find(k => k.toLowerCase() === String(nameOrSlug).toLowerCase());
  return key ? DEFAULT_PLAN_LIMITS[key] : DEFAULT_PLAN_LIMITS.Starter;
}

// GET /api/billing/plans - Get all active market plans
router.get('/plans', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM `pricing_plans` WHERE `is_active` = 1 ORDER BY `display_order` ASC');
    const plans = (rows && rows.length > 0) ? rows.map(p => ({
      ...p,
      price_usd_monthly: Number(p.monthly_price) || (p.slug === 'starter' ? 36 : p.slug === 'professional' ? 49 : 299),
      price_pkr_monthly: Number(p.price_pkr_monthly) || (p.slug === 'starter' ? 10000 : p.slug === 'professional' ? 13800 : 83000),
      features: typeof p.features === 'string' ? JSON.parse(p.features || '[]') : (p.features || [])
    })) : Object.values(DEFAULT_PLAN_LIMITS);

    return res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('[Billing Plans Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve plans.' });
  }
});

// POST /api/billing/validate-coupon - Validate coupon code & compute exact discount
router.post('/validate-coupon', async (req, res) => {
  try {
    const { code, plan: planName = 'Professional', billingCycle = 'monthly' } = req.body || {};

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, valid: false, message: 'Please enter a coupon code.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const [couponRows] = await query('SELECT * FROM `coupons` WHERE UPPER(`code`) = ? LIMIT 1', [cleanCode]);

    if (!couponRows || couponRows.length === 0) {
      return res.status(404).json({ success: false, valid: false, message: 'Invalid coupon code. Please check and try again.' });
    }

    const coupon = couponRows[0];

    if (!coupon.is_active) {
      return res.status(400).json({ success: false, valid: false, message: 'This coupon code is currently disabled.' });
    }

    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ success: false, valid: false, message: 'This coupon code has expired.' });
    }

    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return res.status(400).json({ success: false, valid: false, message: 'This coupon code usage limit has been reached.' });
    }

    // Resolve base price for plan
    const planInfo = await resolvePlan(planName);
    const isYearly = billingCycle === 'yearly' || billingCycle === 'annual';
    const basePrice = isYearly
      ? (planInfo.yearlyPrice > 0 ? planInfo.yearlyPrice * 12 : Math.round(planInfo.price * 12 * 0.8))
      : planInfo.price;

    if (basePrice < Number(coupon.min_purchase || 0)) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `This coupon requires a minimum purchase of $${coupon.min_purchase}.`
      });
    }

    // Compute discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round((basePrice * Number(coupon.discount_value)) / 100);
    } else {
      discountAmount = Math.min(basePrice, Number(coupon.discount_value));
    }

    const finalPrice = Math.max(0, basePrice - discountAmount);

    return res.json({
      success: true,
      valid: true,
      message: `Coupon "${cleanCode}" applied successfully!`,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value)
      },
      originalPrice: basePrice,
      discountAmount,
      finalPrice
    });
  } catch (error) {
    console.error('[Validate Coupon Error]:', error);
    return res.status(500).json({ success: false, valid: false, message: 'Failed to validate coupon code.' });
  }
});

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
    const planInfo = await resolvePlan(planName);

    return res.json({
      success: true,
      isSuperAdmin: false,
      billing: {
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        plan: planInfo.name,
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

    const newLimits = await resolvePlan(plan);

    // Update tenant record
    await query(
      'UPDATE `tenants` SET `plan` = ?, `max_events` = ?, `max_attendees` = ?, `white_label_enabled` = ? WHERE `id` = ?',
      [newLimits.name, newLimits.maxEvents, newLimits.attendees, newLimits.whiteLabel ? 1 : 0, tenant.id]
    );

    // Record subscription
    await query(
      'INSERT INTO `subscriptions` (`tenant_id`, `user_id`, `plan`, `price`, `billing_cycle`, `attendees_limit`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [tenant.id, req.user.id, newLimits.name, newLimits.price, 'monthly', newLimits.attendees, 'active']
    );

    return res.json({
      success: true,
      message: `Plan upgraded to ${newLimits.name}!`,
      plan: newLimits.name,
      price: newLimits.price,
      attendeesLimit: newLimits.attendees
    });
  } catch (error) {
    console.error('[Billing Upgrade Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to upgrade plan.' });
  }
});

// POST /api/billing/purchase - Submit real plan purchase with secure payment details
// Enforces 100% server-side price validation & coupon discount calculations to prevent loopholes
router.post('/purchase', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly', paymentMethod = 'card', transactionRef, currency = 'USD', notes, couponCode } = req.body;
    let tenant = req.tenant;

    // If caller is an organizer but tenant resolved to default platform tenant #1, look up client's actual tenant
    if (tenant.id === 1 && req.user?.role !== 'admin') {
      const [userTenants] = await query('SELECT * FROM `tenants` WHERE `owner_id` = ? LIMIT 1', [req.user.id]);
      if (userTenants && userTenants.length > 0) {
        tenant = userTenants[0];
        req.tenant = tenant;
      }
    }

    if (req.user?.role === 'admin' || tenant.id === 1 || tenant.slug === 'eventorax-hq') {
      return res.status(400).json({
        success: false,
        message: 'SuperAdmin has unlimited platform authority and cannot purchase a paid client subscription.'
      });
    }

    const planInfo = await resolvePlan(plan);
    const isYearly = billingCycle === 'yearly' || billingCycle === 'annual';

    // SERVER-SIDE BASE PRICE (Never trusting client-tampered amount)
    const basePrice = isYearly
      ? (planInfo.yearlyPrice > 0 ? planInfo.yearlyPrice * 12 : Math.round(planInfo.price * 12 * 0.8))
      : planInfo.price;

    let discountAmount = 0;
    let appliedCoupon = null;

    // Apply Coupon if provided
    if (couponCode && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const [cRows] = await query('SELECT * FROM `coupons` WHERE UPPER(`code`) = ? AND `is_active` = 1 LIMIT 1', [cleanCode]);
      if (cRows && cRows.length > 0) {
        const c = cRows[0];
        const isExpired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
        const limitReached = c.max_uses && c.times_used >= c.max_uses;
        const meetsMin = basePrice >= Number(c.min_purchase || 0);

        if (!isExpired && !limitReached && meetsMin) {
          if (c.discount_type === 'percentage') {
            discountAmount = Math.round((basePrice * Number(c.discount_value)) / 100);
          } else {
            discountAmount = Math.min(basePrice, Number(c.discount_value));
          }
          appliedCoupon = c.code;

          // Increment times_used atomically
          await query('UPDATE `coupons` SET `times_used` = `times_used` + 1 WHERE `id` = ?', [c.id]);
        }
      }
    }

    const finalAmount = Math.max(0, basePrice - discountAmount);
    const finalRef = transactionRef || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialStatus = 'pending_approval';

    // Insert subscription record with full pricing audit trail
    await query(
      'INSERT INTO `subscriptions` (`tenant_id`, `user_id`, `plan`, `price`, `billing_cycle`, `attendees_limit`, `status`, `payment_method`, `transaction_ref`, `currency`, `notes`, `coupon_code`, `discount_amount`, `original_price`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [tenant.id, req.user.id, planInfo.name, finalAmount, billingCycle, planInfo.attendees, initialStatus, paymentMethod, finalRef, currency, notes || '', appliedCoupon, discountAmount, basePrice]
    );

    // Update tenant plan and enforce pending_approval status until SuperAdmin approves & issues license key
    await query(
      'UPDATE `tenants` SET `plan` = ?, `status` = "pending_approval", `license_status` = "pending" WHERE `id` = ?',
      [planInfo.name, tenant.id]
    );

    // Trigger SuperAdmin Notification
    try {
      const { dispatchNotification } = await import('../services/notificationsService.js');
      await dispatchNotification({
        title: 'New Client Subscription Purchase Pending Approval',
        message: `Organization "${tenant.name}" (${req.user.email}) submitted ${currency} ${finalAmount} for ${planInfo.name} (${billingCycle})${appliedCoupon ? ` with coupon ${appliedCoupon} (-${currency} ${discountAmount})` : ''} via ${paymentMethod.toUpperCase()} (Ref: ${finalRef}). Pending SuperAdmin approval.`,
        category: 'billing',
        severity: 'warning',
        metadata: {
          tenantId: tenant.id,
          plan: planInfo.name,
          amount: finalAmount,
          originalPrice: basePrice,
          coupon: appliedCoupon,
          discountAmount,
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
      plan: planInfo.name,
      status: 'pending_approval',
      invoiceNumber: finalRef,
      paymentMethod,
      amount: finalAmount,
      originalPrice: basePrice,
      discountAmount,
      couponCode: appliedCoupon,
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
