import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { logSecurityEvent, getSecurityMetrics, scanContentPolicy, liveAuditLogs } from '../middleware/securityScanner.js';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearNotifications, 
  dispatchNotification 
} from '../services/notificationsService.js';

const router = express.Router();

// Middleware: Strictly ensure caller is Platform Superadmin
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    // 24/7 Security Event Logging: Log unauthorized probe by client organization
    logSecurityEvent({
      severity: 'CRITICAL',
      type: 'UNAUTHORIZED_SUPERADMIN_PROBE',
      action: 'Unauthorized Superadmin Access Intercepted',
      detail: `Organization user #${req.user?.id || 'unauthenticated'} (${req.user?.email || 'unknown'}) attempted to access protected platform admin endpoint: ${req.originalUrl}`,
      userId: req.user?.id,
      tenantId: req.user?.tenantId,
      ip: req.ip
    });

    return res.status(403).json({
      success: false,
      status: 'forbidden',
      message: 'Access strictly denied. EventoraX Platform Superadmin privileges are required. Client organizations cannot access the platform admin panel.'
    });
  }
  next();
}

const PLAN_MRR = {
  Starter: 0,
  Professional: 99,
  Enterprise: 299
};

// GET /api/admin/overview - Global SaaS Platform Metrics
router.get('/overview', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [tenants] = await query('SELECT * FROM `tenants`');
    const [users] = await query('SELECT COUNT(*) as total_users FROM `users`');
    const [events] = await query('SELECT COUNT(*) as total_events, COALESCE(SUM(registered_count), 0) as total_attendees FROM `events`');

    const clientTenants = tenants.filter(t => t.id !== 1 && t.slug !== 'eventorax-hq');
    const totalTenants = clientTenants.length;
    const activeTenants = clientTenants.filter(t => t.status === 'active').length;
    const suspendedTenants = clientTenants.filter(t => t.status === 'suspended').length;

    // Calculate MRR (Monthly Recurring Revenue from client organizations)
    let totalMRR = 0;
    const planBreakdown = {
      Starter: 0,
      Professional: 0,
      Enterprise: 0
    };

    clientTenants.forEach(t => {
      const p = t.plan || 'Starter';
      if (planBreakdown[p] !== undefined) planBreakdown[p]++;
      if (t.status === 'active') {
        totalMRR += (PLAN_MRR[p] || 0);
      }
    });

    return res.json({
      success: true,
      metrics: {
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalUsers: users[0]?.total_users || 0,
        totalEvents: events[0]?.total_events || 0,
        totalAttendees: events[0]?.total_attendees || 0,
        totalMRR,
        annualRunRate: totalMRR * 12,
        planBreakdown
      }
    });
  } catch (error) {
    console.error('[Platform Admin Overview Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve SaaS platform metrics.' });
  }
});

// GET /api/admin/tenants - List all tenants with details & owner info
router.get('/tenants', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { search, plan, status } = req.query;

    const [tenants] = await query('SELECT * FROM `tenants` ORDER BY `created_at` DESC');
    const [users] = await query('SELECT id, full_name, email FROM `users`');
    const [eventCounts] = await query('SELECT tenant_id, COUNT(*) as event_count, SUM(registered_count) as attendees_count FROM `events` GROUP BY tenant_id');

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const eventMap = {};
    eventCounts.forEach(e => { eventMap[e.tenant_id] = e; });

    let result = tenants.map(t => {
      const isMaster = t.id === 1 || t.slug === 'eventorax-hq';
      return {
        ...t,
        isSuperAdmin: isMaster,
        plan: isMaster ? 'Platform Authority' : (t.plan || 'Starter'),
        owner: userMap[t.owner_id] || { full_name: isMaster ? 'Platform SuperAdmin' : 'Organization Owner', email: isMaster ? 'admin@eventorax.com' : 'client@eventorax.com' },
        eventCount: eventMap[t.id]?.event_count || 0,
        attendeeCount: eventMap[t.id]?.attendees_count || 0,
        mrr: isMaster ? 0 : (PLAN_MRR[t.plan] || 0)
      };
    });

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(s) || t.slug.toLowerCase().includes(s) || t.owner.email.toLowerCase().includes(s));
    }
    if (plan && plan !== 'All') {
      result = result.filter(t => t.plan === plan);
    }
    if (status && status !== 'All') {
      result = result.filter(t => t.status === status);
    }

    return res.json({
      success: true,
      tenants: result
    });
  } catch (error) {
    console.error('[Platform Admin List Tenants Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve tenants list.' });
  }
});

// PUT /api/admin/tenants/:id/plan - Update tenant subscription tier
router.put('/tenants/:id/plan', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);
    const { plan } = req.body;

    if (tenantId === 1) {
      return res.status(400).json({ success: false, message: 'Cannot modify plan of the Platform SuperAdmin workspace.' });
    }

    if (!PLAN_MRR.hasOwnProperty(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan specified. Available plans: Starter, Professional, Enterprise.' });
    }

    await query('UPDATE `tenants` SET `plan` = ? WHERE `id` = ?', [plan, tenantId]);

    return res.json({
      success: true,
      message: `Tenant upgraded to ${plan} tier.`,
      plan
    });
  } catch (error) {
    console.error('[Platform Admin Change Plan Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update tenant plan.' });
  }
});

// PUT /api/admin/tenants/:id/status - Toggle tenant status (active / suspended)
router.put('/tenants/:id/status', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['active', 'suspended', 'trial'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    await query('UPDATE `tenants` SET `status` = ? WHERE `id` = ?', [status, tenantId]);

    return res.json({
      success: true,
      message: `Tenant status changed to ${status}.`,
      status
    });
  } catch (error) {
    console.error('[Platform Admin Toggle Status Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update tenant status.' });
  }
});

// GET /api/admin/security/metrics - 24/7 Security & Compliance Engine Metrics
router.get('/security/metrics', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const metrics = getSecurityMetrics();
    return res.json({
      success: true,
      security: metrics
    });
  } catch (error) {
    console.error('[Platform Security Metrics Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve security metrics.' });
  }
});

// GET /api/admin/security/logs - Real-time audit log stream
router.get('/security/logs', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    return res.json({
      success: true,
      logs: liveAuditLogs.slice(0, 100)
    });
  } catch (error) {
    console.error('[Platform Security Logs Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve security logs.' });
  }
});

// POST /api/admin/security/scan-all - Run real-time compliance scan across all database events
router.post('/security/scan-all', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [events] = await query('SELECT id, title, description, slug, tenant_id FROM `events`');
    let flaggedCount = 0;
    const flaggedItems = [];

    for (const ev of events) {
      const check = scanContentPolicy(`${ev.title} ${ev.description}`);
      if (!check.isAllowed) {
        flaggedCount++;
        flaggedItems.push({
          eventId: ev.id,
          title: ev.title,
          category: check.category,
          severity: check.severity
        });
        logSecurityEvent({
          severity: check.severity,
          type: 'AUDIT_POLICY_FLAG',
          action: 'Existing Event Flagged by Policy Scanner',
          detail: `Event #${ev.id} "${ev.title}" flagged for: ${check.category}`,
          userId: req.user.id,
          tenantId: ev.tenant_id
        });
      }
    }

    return res.json({
      success: true,
      scannedEventsCount: events.length,
      flaggedCount,
      flaggedItems,
      message: flaggedCount === 0 
        ? 'Audit complete: 100% of events comply with platform safety and legal policies.'
        : `Audit complete: ${flaggedCount} event(s) flagged for policy review.`
    });
  } catch (error) {
    console.error('[Platform Security Scan All Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to execute full compliance scan.' });
  }
});

// =====================================================
// CMS CONTENT MANAGEMENT (Public Official Website CMS)
// =====================================================
// GET /api/admin/cms - Retrieve all website CMS content blocks
router.get('/cms', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [pages] = await query('SELECT * FROM `website_cms` ORDER BY `page_key` ASC');
    return res.json({
      success: true,
      pages
    });
  } catch (error) {
    console.error('[Admin CMS Get Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve website CMS pages.' });
  }
});

// GET /api/admin/cms/:pageKey - Get single CMS page
router.get('/cms/:pageKey', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { pageKey } = req.params;
    const [rows] = await query('SELECT * FROM `website_cms` WHERE `page_key` = ?', [pageKey.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'CMS page not found.' });
    }
    return res.json({
      success: true,
      page: rows[0]
    });
  } catch (error) {
    console.error('[Admin CMS Get Single Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve CMS block.' });
  }
});

// PUT /api/admin/cms/:pageKey - Update CMS page content
router.put('/cms/:pageKey', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { pageKey } = req.params;
    const { title, data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, message: 'Content data is required.' });
    }

    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const pageTitle = title || `${pageKey.toUpperCase()} Content`;

    const [existing] = await query('SELECT id FROM `website_cms` WHERE `page_key` = ?', [pageKey.toLowerCase()]);
    if (existing.length > 0) {
      await query(
        'UPDATE `website_cms` SET `data` = ?, `title` = ?, `updated_by` = ?, `updated_at` = NOW() WHERE `page_key` = ?',
        [jsonString, pageTitle, req.user.id, pageKey.toLowerCase()]
      );
    } else {
      await query(
        'INSERT INTO `website_cms` (`page_key`, `title`, `data`, `updated_by`) VALUES (?, ?, ?, ?)',
        [pageKey.toLowerCase(), pageTitle, jsonString, req.user.id]
      );
    }

    logSecurityEvent({
      severity: 'INFO',
      type: 'CMS_UPDATE',
      action: `Website CMS block '${pageKey}' published`,
      detail: `Superadmin updated public page '${pageKey}' content.`,
      userId: req.user.id
    });

    await dispatchNotification({
      title: `Website CMS Updated: ${pageKey.toUpperCase()}`,
      message: `Superadmin updated public page '${pageKey}' content live on production.`,
      category: 'cms',
      severity: 'info',
      metadata: { pageKey, updatedBy: req.user.id }
    });

    const [updated] = await query('SELECT * FROM `website_cms` WHERE `page_key` = ?', [pageKey.toLowerCase()]);

    return res.json({
      success: true,
      message: `Website content for '${pageKey}' updated & published live!`,
      page: updated[0]
    });
  } catch (error) {
    console.error('[Admin CMS Update Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update CMS page.' });
  }
});

// ================= REAL-TIME LIVE NOTIFICATIONS (SUPERADMIN) =================

// GET /api/admin/notifications - Retrieve live platform notification stream
router.get('/notifications', verifyToken, requireSuperAdmin, (req, res) => {
  const { limit, unreadOnly } = req.query;
  const data = getNotifications({
    limit: limit ? Number(limit) : 50,
    unreadOnly: unreadOnly === 'true'
  });
  return res.json({
    success: true,
    ...data
  });
});

// PATCH /api/admin/notifications/:id/read - Mark single notification as read
router.patch('/notifications/:id/read', verifyToken, requireSuperAdmin, (req, res) => {
  const { id } = req.params;
  const ok = markNotificationAsRead(id);
  return res.json({ success: ok, message: ok ? 'Notification marked as read.' : 'Notification not found.' });
});

// POST /api/admin/notifications/mark-all-read - Mark all as read
router.post('/notifications/mark-all-read', verifyToken, requireSuperAdmin, (req, res) => {
  markAllNotificationsAsRead();
  return res.json({ success: true, message: 'All notifications marked as read.' });
});

// DELETE /api/admin/notifications - Clear notifications
router.delete('/notifications', verifyToken, requireSuperAdmin, (req, res) => {
  clearNotifications();
  return res.json({ success: true, message: 'Notification stream cleared.' });
});

// =========================================================================
// SUPERADMIN SUBSCRIPTION & PAYMENT APPROVAL WORKFLOW
// =========================================================================

const SA_PLAN_LIMITS = {
  Starter: { price: 0, attendees: 500, maxEvents: 5, whiteLabel: false },
  Professional: { price: 99, attendees: 5000, maxEvents: 25, whiteLabel: true },
  Enterprise: { price: 299, attendees: 50000, maxEvents: 500, whiteLabel: true }
};

// GET /api/admin/subscriptions - List all client subscription & payment requests
router.get('/subscriptions', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [subRows] = await query('SELECT * FROM `subscriptions` ORDER BY `created_at` DESC');
    const [tenants] = await query('SELECT id, name, slug, plan, status FROM `tenants`');
    const [users] = await query('SELECT id, full_name, email, phone FROM `users`');

    const tenantMap = {};
    tenants.forEach(t => { tenantMap[t.id] = t; });
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const enriched = (subRows || []).map(s => {
      const t = tenantMap[s.tenant_id] || {};
      const u = userMap[s.user_id] || {};
      return {
        ...s,
        tenantName: t.name || s.tenant_name || 'Organization',
        tenantSlug: t.slug || '',
        currentTenantPlan: t.plan || 'Starter',
        ownerName: u.full_name || s.user_name || 'Client User',
        ownerEmail: u.email || s.user_email || '',
        ownerPhone: u.phone || '',
        price: s.price || 0,
        currency: s.currency || 'USD',
        status: s.status || 'pending_approval'
      };
    });

    return res.json({
      success: true,
      subscriptions: enriched
    });
  } catch (error) {
    console.error('[Platform Admin Subscriptions Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve subscriptions.' });
  }
});

// POST /api/admin/subscriptions/:id/approve - Approve client plan & grant full platform access
router.post('/subscriptions/:id/approve', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const subId = parseInt(req.params.id, 10);
    const [subRows] = await query('SELECT * FROM `subscriptions` WHERE `id` = ?', [subId]);
    const subscription = subRows[0];

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription request not found.' });
    }

    const plan = subscription.plan || 'Professional';
    const planConfig = SA_PLAN_LIMITS[plan] || SA_PLAN_LIMITS.Professional;

    // 1. Mark subscription as active & approved
    await query(
      'UPDATE `subscriptions` SET `status` = ?, `approved_by` = ? WHERE `id` = ?',
      ['active', req.user.id, subId]
    );

    // 2. Activate tenant and set official plan limits
    await query(
      'UPDATE `tenants` SET `plan` = ?, `status` = ?, `max_events` = ?, `max_attendees` = ?, `white_label_enabled` = ? WHERE `id` = ?',
      [plan, 'active', planConfig.maxEvents, planConfig.attendees, planConfig.whiteLabel ? 1 : 0, subscription.tenant_id]
    );

    // 3. Dispatch Live Alert to Platform SuperAdmin Notification Stream
    await dispatchNotification({
      title: 'Client Subscription Approved & Activated',
      message: `Tenant #${subscription.tenant_id} has been activated on ${plan} tier by SuperAdmin.`,
      category: 'billing',
      severity: 'success',
      metadata: { subscriptionId: subId, plan, approvedBy: req.user.email }
    });

    logSecurityEvent({
      severity: 'INFO',
      type: 'SUBSCRIPTION_APPROVED',
      action: 'SuperAdmin Activated Client Subscription',
      detail: `SuperAdmin ${req.user.email} approved ${plan} subscription #${subId} for tenant #${subscription.tenant_id}`,
      userId: req.user.id,
      tenantId: subscription.tenant_id
    });

    return res.json({
      success: true,
      message: `Subscription approved successfully! Client organization upgraded to ${plan} tier.`,
      subscriptionId: subId,
      plan
    });
  } catch (error) {
    console.error('[Platform Admin Approve Subscription Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve subscription.' });
  }
});

// POST /api/admin/subscriptions/:id/reject - Reject subscription request with reason
router.post('/subscriptions/:id/reject', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const subId = parseInt(req.params.id, 10);
    const { reason = 'Payment verification could not be completed.' } = req.body;

    await query(
      'UPDATE `subscriptions` SET `status` = ?, `notes` = ? WHERE `id` = ?',
      ['rejected', reason, subId]
    );

    return res.json({
      success: true,
      message: 'Subscription request rejected.',
      subscriptionId: subId
    });
  } catch (error) {
    console.error('[Platform Admin Reject Subscription Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject subscription.' });
  }
});

// PUT /api/admin/tenants/:id/permissions - Fine-tune specific client features & quotas
router.put('/tenants/:id/permissions', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);
    const { maxEvents, maxAttendees, whiteLabel, customDomain } = req.body;

    if (tenantId === 1) {
      return res.status(400).json({ success: false, message: 'SuperAdmin workspace has unconditional master authority.' });
    }

    await query(
      'UPDATE `tenants` SET `max_events` = ?, `max_attendees` = ?, `white_label_enabled` = ? WHERE `id` = ?',
      [
        maxEvents !== undefined ? parseInt(maxEvents, 10) : 25,
        maxAttendees !== undefined ? parseInt(maxAttendees, 10) : 5000,
        whiteLabel ? 1 : 0,
        tenantId
      ]
    );

    return res.json({
      success: true,
      message: 'Tenant quota and permissions updated successfully.'
    });
  } catch (error) {
    console.error('[Platform Admin Permissions Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update tenant permissions.' });
  }
});

export default router;
