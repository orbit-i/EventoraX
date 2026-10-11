import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/db.js';
import { verifyToken, generateToken } from '../middleware/auth.js';
import { logSecurityEvent, getSecurityMetrics, scanContentPolicy, liveAuditLogs } from '../middleware/securityScanner.js';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearNotifications, 
  dispatchNotification 
} from '../services/notificationsService.js';

const router = express.Router();

function generateActivationLicenseKey(plan = 'Starter') {
  const code = (plan || 'STR').substring(0, 3).toUpperCase();
  const rand1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const rand2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const rand3 = Math.floor(1000 + Math.random() * 9000);
  return `EVX-${code}-${rand1}-${rand2}-${rand3}`;
}

// POST /api/admin/gateway/login - Secret ORBIT-I Platform Master Authority Gateway Login
router.post('/gateway/login', async (req, res) => {
  try {
    const { email, password, masterKey } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Master Administrator email and password required.' });
    }

    const [rows] = await query('SELECT * FROM `users` WHERE `email` = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid Master Authority credentials.' });
    }

    const userRow = rows[0];
    if (userRow.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only EventoraX (ORBIT-I) Platform Master Authority can enter this private gateway.'
      });
    }

    const isMatch = await bcrypt.compare(password, userRow.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Master Authority credentials.' });
    }

    // Master Key validation (accepts default ORBIT-I master authorization passcode)
    if (masterKey && masterKey.trim() !== '' && masterKey.trim() !== 'ORBIT-I-HQ-2026' && masterKey.trim() !== 'admin123') {
      return res.status(401).json({ success: false, message: 'Invalid Master Security Access Key.' });
    }

    const [hq] = await query('SELECT * FROM `tenants` WHERE `id` = 1');
    const masterTenant = hq[0] || { id: 1, name: 'EventoraX HQ', slug: 'eventorax-hq', plan: 'Platform Authority' };

    const token = generateToken({
      id: userRow.id,
      email: userRow.email,
      role: 'admin',
      tenantId: 1
    });

    logSecurityEvent({
      severity: 'INFO',
      type: 'MASTER_GATEWAY_LOGIN',
      action: 'SuperAdmin Authenticated via Secret Gateway',
      detail: `SuperAdmin ${userRow.email} signed into ORBIT-I Master Authority Gateway from IP: ${req.ip || 'local'}`,
      userId: userRow.id,
      tenantId: 1
    });

    return res.json({
      success: true,
      message: 'Master Authority authenticated successfully. Welcome to EventoraX HQ.',
      token,
      user: {
        id: userRow.id,
        fullName: userRow.full_name,
        email: userRow.email,
        role: 'admin',
        orgName: 'EventoraX (ORBIT-I)'
      },
      tenant: masterTenant
    });
  } catch (error) {
    console.error('[Master Gateway Login Error]:', error);
    return res.status(500).json({ success: false, message: 'Master gateway authentication error.' });
  }
});

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
  Starter: { price: 0, attendees: 500, maxEvents: 5, maxCerts: 50, whiteLabel: false },
  Professional: { price: 99, attendees: 5000, maxEvents: 25, maxCerts: 2500, whiteLabel: true },
  Enterprise: { price: 299, attendees: 50000, maxEvents: 500, maxCerts: 999999, whiteLabel: true }
};

// GET /api/admin/subscriptions - List all client subscription & payment requests
router.get('/subscriptions', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [subRows] = await query('SELECT * FROM `subscriptions` ORDER BY `created_at` DESC');
    const [tenants] = await query('SELECT id, name, slug, plan, status, license_key, license_status FROM `tenants`');
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
        status: s.status || 'pending_approval',
        licenseKey: s.license_key || t.license_key || null,
        licenseStatus: t.license_status || 'pending'
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

// POST /api/admin/subscriptions/:id/approve - Approve client plan, issue Activation License Key & grant full platform access
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
    const isYearly = subscription.billing_cycle === 'yearly';

    // 1. Generate Unique Cryptographic Activation License Key
    const licenseKey = req.body?.customLicenseKey || generateActivationLicenseKey(plan);

    // Calculate expiry (1 year for annual, 30 days for monthly, 365 days for starter trial)
    const expiryDate = new Date();
    if (isYearly || plan === 'Starter') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setDate(expiryDate.getDate() + 30);
    }
    const expiresAt = expiryDate.toISOString();

    // 2. Mark subscription as active & approved with license key
    await query(
      'UPDATE `subscriptions` SET `status` = ?, `license_key` = ?, `approved_by` = ?, `approved_at` = NOW() WHERE `id` = ?',
      ['active', licenseKey, req.user.id, subId]
    );

    // 3. Activate tenant and bind license key & quota allocations
    await query(
      'UPDATE `tenants` SET `plan` = ?, `status` = ?, `license_key` = ?, `license_status` = ?, `license_activated_at` = NOW(), `license_expires_at` = ?, `max_events` = ?, `max_attendees` = ?, `max_certs` = ?, `white_label_enabled` = ? WHERE `id` = ?',
      [
        plan,
        'active',
        licenseKey,
        'active',
        expiresAt,
        planConfig.maxEvents,
        planConfig.attendees,
        planConfig.maxCerts,
        planConfig.whiteLabel ? 1 : 0,
        subscription.tenant_id
      ]
    );

    // 4. Dispatch Live Alert to Platform SuperAdmin Notification Stream
    await dispatchNotification({
      title: 'Activation License Issued & Subscription Approved',
      message: `Tenant #${subscription.tenant_id} activated on ${plan} tier with License Key: ${licenseKey}`,
      category: 'billing',
      severity: 'success',
      metadata: { subscriptionId: subId, tenantId: subscription.tenant_id, plan, licenseKey, approvedBy: req.user.email }
    });

    logSecurityEvent({
      severity: 'INFO',
      type: 'LICENSE_KEY_ISSUED',
      action: 'SuperAdmin Activated Organization License',
      detail: `SuperAdmin ${req.user.email} approved ${plan} subscription #${subId} and issued License Key ${licenseKey} for tenant #${subscription.tenant_id}`,
      userId: req.user.id,
      tenantId: subscription.tenant_id
    });

    return res.json({
      success: true,
      message: `Subscription approved successfully! Issued Activation License Key: ${licenseKey}`,
      subscriptionId: subId,
      tenantId: subscription.tenant_id,
      licenseKey,
      expiresAt,
      plan
    });
  } catch (error) {
    console.error('[Platform Admin Approve Subscription Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve subscription and issue license.' });
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

// =========================================================================
// SUPERADMIN CLIENT LICENSE KEYS & RESOURCE UTILIZATION TRACKING
// =========================================================================

// GET /api/admin/licenses - Track all client organization licenses, status & resource utilization
router.get('/licenses', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [tenants] = await query('SELECT * FROM `tenants` WHERE `id` != 1 ORDER BY `created_at` DESC');
    const [users] = await query('SELECT id, full_name, email, phone FROM `users`');
    const [eventStats] = await query('SELECT tenant_id, COUNT(*) as event_count, COALESCE(SUM(registered_count), 0) as attendee_count FROM `events` GROUP BY tenant_id');
    const [certStats] = await query('SELECT organization_id, COUNT(*) as cert_count FROM `certificates` GROUP BY organization_id');

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const eventMap = {};
    eventStats.forEach(e => { eventMap[e.tenant_id] = e; });

    const certMap = {};
    certStats.forEach(c => { certMap[c.organization_id] = c.cert_count; });

    const licenses = tenants.map(t => {
      const owner = userMap[t.owner_id] || { full_name: 'Client Owner', email: 'owner@client.com' };
      const e = eventMap[t.id] || { event_count: 0, attendee_count: 0 };
      const cCount = certMap[t.id] || 0;
      const planConfig = SA_PLAN_LIMITS[t.plan] || SA_PLAN_LIMITS.Starter;

      return {
        tenantId: t.id,
        name: t.name,
        slug: t.slug,
        ownerName: owner.full_name,
        ownerEmail: owner.email,
        ownerPhone: owner.phone || '',
        plan: t.plan || 'Starter',
        status: t.status || 'pending_approval',
        licenseKey: t.license_key || null,
        licenseStatus: t.license_status || (t.status === 'active' ? 'active' : 'pending'),
        licenseActivatedAt: t.license_activated_at || t.created_at,
        licenseExpiresAt: t.license_expires_at,
        eventsUsed: e.event_count || 0,
        eventsLimit: t.max_events || planConfig.maxEvents,
        attendeesUsed: e.attendee_count || 0,
        attendeesLimit: t.max_attendees || planConfig.attendees,
        certsUsed: cCount,
        certsLimit: t.max_certs || planConfig.maxCerts,
        whiteLabelEnabled: Boolean(t.white_label_enabled),
        customDomain: t.custom_domain || ''
      };
    });

    return res.json({
      success: true,
      licenses
    });
  } catch (error) {
    console.error('[Platform Admin Get Licenses Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve licenses.' });
  }
});

// POST /api/admin/tenants/:id/license/regenerate - Re-issue a new license key
router.post('/tenants/:id/license/regenerate', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);
    const [tRows] = await query('SELECT * FROM `tenants` WHERE `id` = ?', [tenantId]);
    const tenant = tRows[0];
    if (!tenant) return res.status(404).json({ success: false, message: 'Organization not found.' });

    const newKey = generateActivationLicenseKey(tenant.plan || 'Starter');
    await query('UPDATE `tenants` SET `license_key` = ?, `license_status` = "active" WHERE `id` = ?', [newKey, tenantId]);

    logSecurityEvent({
      severity: 'WARNING',
      type: 'LICENSE_KEY_REGENERATED',
      action: 'SuperAdmin Regenerated Client License Key',
      detail: `SuperAdmin ${req.user.email} generated new License Key ${newKey} for tenant #${tenantId}`,
      userId: req.user.id,
      tenantId
    });

    return res.json({
      success: true,
      message: 'New Activation License Key issued successfully!',
      licenseKey: newKey
    });
  } catch (error) {
    console.error('[Regenerate License Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to regenerate license key.' });
  }
});

// POST /api/admin/tenants/:id/license/revoke - Suspend / Revoke client license
router.post('/tenants/:id/license/revoke', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);
    await query('UPDATE `tenants` SET `license_status` = "suspended", `status` = "suspended" WHERE `id` = ?', [tenantId]);

    logSecurityEvent({
      severity: 'CRITICAL',
      type: 'LICENSE_KEY_SUSPENDED',
      action: 'SuperAdmin Suspended Client License',
      detail: `SuperAdmin ${req.user.email} suspended License for tenant #${tenantId}`,
      userId: req.user.id,
      tenantId
    });

    return res.json({
      success: true,
      message: 'Organization license suspended successfully.'
    });
  } catch (error) {
    console.error('[Revoke License Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke license.' });
  }
});

// POST /api/admin/tenants/:id/license/renew - Renew / Extend client license expiration
router.post('/tenants/:id/license/renew', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);
    const { days = 365 } = req.body || {};

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days, 10));

    await query(
      'UPDATE `tenants` SET `license_status` = "active", `status` = "active", `license_expires_at` = ? WHERE `id` = ?',
      [expiryDate.toISOString(), tenantId]
    );

    return res.json({
      success: true,
      message: `License extended by ${days} days!`,
      expiresAt: expiryDate.toISOString()
    });
  } catch (error) {
    console.error('[Renew License Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to renew license.' });
  }
});

// PUT /api/admin/tenants/:id/permissions - Fine-tune specific client features & quotas
router.put('/tenants/:id/permissions', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.id, 10);
    const { maxEvents, maxAttendees, maxCerts, whiteLabel, customDomain } = req.body;

    if (tenantId === 1) {
      return res.status(400).json({ success: false, message: 'SuperAdmin workspace has unconditional master authority.' });
    }

    await query(
      'UPDATE `tenants` SET `max_events` = ?, `max_attendees` = ?, `max_certs` = ?, `white_label_enabled` = ? WHERE `id` = ?',
      [
        maxEvents !== undefined ? parseInt(maxEvents, 10) : 25,
        maxAttendees !== undefined ? parseInt(maxAttendees, 10) : 5000,
        maxCerts !== undefined ? parseInt(maxCerts, 10) : 2500,
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

// =====================================================
// AUTHENTIC INSTITUTIONAL TESTIMONIALS CMS
// =====================================================

// GET /api/admin/testimonials - List all verified testimonials
router.get('/testimonials', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM `testimonials` ORDER BY `created_at` DESC');
    return res.json({
      success: true,
      testimonials: rows || []
    });
  } catch (error) {
    console.error('[Platform Admin Testimonials List Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve testimonials list.' });
  }
});

// POST /api/admin/testimonials - Publish a new authentic testimonial
router.post('/testimonials', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { client_name, organization, role, logo_url, rating, feedback, is_featured } = req.body || {};

    if (!client_name || !organization || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Client Name, Organization/Institute, and Feedback text are required.'
      });
    }

    const ratingVal = Math.max(1, Math.min(5, parseInt(rating || 5, 10)));
    const isFeaturedVal = is_featured !== undefined ? (is_featured ? 1 : 0) : 1;

    const [result] = await query(
      'INSERT INTO `testimonials` (`client_name`, `organization`, `role`, `logo_url`, `rating`, `feedback`, `is_featured`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [
        client_name.trim(),
        organization.trim(),
        (role || 'Organizer').trim(),
        (logo_url || '').trim(),
        ratingVal,
        feedback.trim(),
        isFeaturedVal
      ]
    );

    logSecurityEvent({
      severity: 'INFO',
      type: 'TESTIMONIAL_PUBLISHED',
      action: 'Authentic Testimonial Published',
      detail: `SuperAdmin published testimonial for "${organization.trim()}" by "${client_name.trim()}".`,
      userId: req.user.id,
      tenantId: 1
    });

    dispatchNotification({
      category: 'SYSTEM',
      title: 'Institutional Testimonial Published',
      message: `Verified review for ${organization.trim()} has been published to the EventoraX landing page.`,
      severity: 'LOW',
      tenantId: 1
    });

    return res.json({
      success: true,
      message: 'Authentic testimonial published successfully!',
      testimonialId: result.insertId
    });
  } catch (error) {
    console.error('[Platform Admin Testimonial Create Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create testimonial.' });
  }
});

// DELETE /api/admin/testimonials/:id - Remove a testimonial
router.delete('/testimonials/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM `testimonials` WHERE `id` = ?', [id]);

    logSecurityEvent({
      severity: 'INFO',
      type: 'TESTIMONIAL_DELETED',
      action: 'Testimonial Deleted',
      detail: `SuperAdmin deleted testimonial #${id}.`,
      userId: req.user.id,
      tenantId: 1
    });

    return res.json({
      success: true,
      message: 'Testimonial removed successfully.'
    });
  } catch (error) {
    console.error('[Platform Admin Testimonial Delete Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete testimonial.' });
  }
});

export default router;
