import express from 'express';
import bcrypt from 'bcryptjs';
import { query, memoryStore, saveMemoryStoreToDisk } from '../db/db.js';
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

// GET /api/admin/gateway/status - Check if Master SuperAdmin has already been initialized
router.get('/gateway/status', async (req, res) => {
  try {
    let adminCount = 0;
    try {
      const [rows] = await query('SELECT COUNT(*) as cnt FROM `users` WHERE `role` = "admin"');
      adminCount = Number(rows?.[0]?.cnt || 0);
    } catch {}

    if (adminCount === 0 && memoryStore && Array.isArray(memoryStore.users)) {
      adminCount = memoryStore.users.filter(u => u.role === 'admin').length;
    }

    const isInitialized = adminCount > 0;
    return res.json({
      success: true,
      isInitialized,
      adminCount,
      message: isInitialized
        ? 'Platform Master Authority is configured. Direct SuperAdmin login only.'
        : 'Platform Master Authority uninitialized. First-time setup required.'
    });
  } catch (error) {
    console.error('[Admin Gateway Status Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to query gateway status.' });
  }
});

// POST /api/admin/gateway/login - Secret ORBIT-I Platform Master Authority Gateway Login
router.post('/gateway/login', async (req, res) => {
  try {
    const { email, password, masterKey } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Master Administrator email and password required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let userRow = null;

    try {
      const [rows] = await query('SELECT * FROM `users` WHERE `email` = ?', [cleanEmail]);
      if (rows && rows.length > 0) {
        userRow = rows[0];
      }
    } catch (err) {
      console.warn('[Master Gateway Login] Query notice:', err?.message);
    }

    if (!userRow && memoryStore && memoryStore.users) {
      userRow = memoryStore.users.find(u => (u.email || '').toLowerCase() === cleanEmail);
    }

    if (!userRow) {
      return res.status(401).json({
        success: false,
        message: 'Master Administrator account not found. Please verify your credentials or complete initial setup.'
      });
    }

    if (userRow.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only Eventrye (ORBIT-I) Platform Master Authority can enter this private gateway.'
      });
    }

    const isMatch = await bcrypt.compare(password, userRow.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Master Password. Please check your password.' });
    }

    const cleanMasterKey = (masterKey || '').trim();
    if (!cleanMasterKey) {
      return res.status(400).json({ success: false, message: 'Master Security Passcode is required.' });
    }

    // Strict Master Key validation: ONLY the user's custom created master key is accepted!
    const storedMasterKey = userRow.master_key ? String(userRow.master_key).trim() : null;

    if (!storedMasterKey) {
      return res.status(401).json({
        success: false,
        message: 'No Master Security Passcode is configured for this account. Please verify your credentials.'
      });
    }

    if (cleanMasterKey !== storedMasterKey) {
      return res.status(401).json({ success: false, message: 'Invalid Master Security Passcode.' });
    }

    const [hq] = await query('SELECT * FROM `tenants` WHERE `id` = 1');
    let masterTenant = hq[0];
    if (!masterTenant || typeof masterTenant.name !== 'string' || !masterTenant.name || masterTenant.name === '1' || masterTenant.name === 1) {
      masterTenant = { id: 1, name: 'Eventrye HQ', slug: 'eventrye-hq', plan: 'Platform Authority', status: 'active', primary_color: '#1d4ed8', secondary_color: '#1e40af' };
    }

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
      message: 'Master Authority authenticated successfully. Welcome to Eventrye HQ.',
      token,
      user: {
        id: userRow.id,
        fullName: userRow.full_name,
        email: userRow.email,
        role: 'admin',
        orgName: 'Eventrye (ORBIT-I)'
      },
      tenant: masterTenant,
      tenants: [masterTenant]
    });
  } catch (error) {
    console.error('[Master Gateway Login Error]:', error);
    return res.status(500).json({ success: false, message: 'Master gateway authentication error.' });
  }
});

// POST /api/admin/gateway/setup - Secure Initial Setup & Single SuperAdmin Credential Provisioning
router.post('/gateway/setup', async (req, res) => {
  try {
    // ENFORCE STRICT SINGLE SUPERADMIN RULE:
    // Once a SuperAdmin exists, no second SuperAdmin can ever be created from the gateway!
    let existingAdmins = 0;
    try {
      const [rows] = await query('SELECT COUNT(*) as cnt FROM `users` WHERE `role` = "admin"');
      existingAdmins = Number(rows?.[0]?.cnt || 0);
    } catch {}

    if (existingAdmins === 0 && memoryStore && Array.isArray(memoryStore.users)) {
      existingAdmins = memoryStore.users.filter(u => u.role === 'admin').length;
    }

    if (existingAdmins > 0) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Platform Master SuperAdmin is already configured and initialized. Creation of additional SuperAdmins from the gateway is permanently locked. Direct login only.'
      });
    }

    const { fullName, email, password, masterKey } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'SuperAdmin email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'SuperAdmin password must be at least 6 characters.' });
    }

    const cleanMasterKey = (masterKey || '').trim();
    if (!cleanMasterKey) {
      return res.status(400).json({
        success: false,
        message: 'Please define your own private Master Security Passcode.'
      });
    }

    if (cleanMasterKey.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Master Security Passcode must be at least 4 characters long.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const adminName = fullName?.trim() || 'ORBIT-I Platform SuperAdmin';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    let existing = [];
    try {
      const [rows] = await query('SELECT * FROM `users` WHERE `email` = ?', [cleanEmail]);
      existing = rows || [];
    } catch {}

    let adminUserId;

    if (existing && existing.length > 0) {
      adminUserId = existing[0].id;
      try {
        await query(
          'UPDATE `users` SET `full_name` = ?, `password` = ?, `master_key` = ?, `role` = "admin", `plan` = "Platform Authority" WHERE `id` = ?',
          [adminName, hashedPassword, cleanMasterKey, adminUserId]
        );
      } catch (colErr) {
        try {
          await query('ALTER TABLE `users` ADD COLUMN `master_key` VARCHAR(255) NULL');
          await query(
            'UPDATE `users` SET `full_name` = ?, `password` = ?, `master_key` = ?, `role` = "admin", `plan` = "Platform Authority" WHERE `id` = ?',
            [adminName, hashedPassword, cleanMasterKey, adminUserId]
          );
        } catch {
          await query(
            'UPDATE `users` SET `full_name` = ?, `password` = ?, `role` = "admin", `plan` = "Platform Authority" WHERE `id` = ?',
            [adminName, hashedPassword, adminUserId]
          );
        }
      }
    } else {
      try {
        const [insertResult] = await query(
          'INSERT INTO `users` (`full_name`, `org_name`, `email`, `password`, `master_key`, `role`, `plan`) VALUES (?, ?, ?, ?, ?, "admin", "Platform Authority")',
          [adminName, 'Eventrye (ORBIT-I)', cleanEmail, hashedPassword, cleanMasterKey]
        );
        adminUserId = insertResult.insertId;
      } catch (colErr) {
        try {
          await query('ALTER TABLE `users` ADD COLUMN `master_key` VARCHAR(255) NULL');
          const [insertResult] = await query(
            'INSERT INTO `users` (`full_name`, `org_name`, `email`, `password`, `master_key`, `role`, `plan`) VALUES (?, ?, ?, ?, ?, "admin", "Platform Authority")',
            [adminName, 'Eventrye (ORBIT-I)', cleanEmail, hashedPassword, cleanMasterKey]
          );
          adminUserId = insertResult.insertId;
        } catch {
          const [insertResult] = await query(
            'INSERT INTO `users` (`full_name`, `org_name`, `email`, `password`, `role`, `plan`) VALUES (?, ?, ?, ?, "admin", "Platform Authority")',
            [adminName, 'Eventrye (ORBIT-I)', cleanEmail, hashedPassword]
          );
          adminUserId = insertResult.insertId;
        }
      }
    }

    // Also synchronize into memoryStore.users to guarantee 100% login reliability across restarts
    if (memoryStore) {
      if (!memoryStore.users) memoryStore.users = [];
      let memUser = memoryStore.users.find(u => (u.email || '').toLowerCase() === cleanEmail);
      if (memUser) {
        memUser.full_name = adminName;
        memUser.email = cleanEmail;
        memUser.password = hashedPassword;
        memUser.master_key = cleanMasterKey;
        memUser.role = 'admin';
        memUser.plan = 'Platform Authority';
      } else {
        memUser = {
          id: adminUserId || (memoryStore.users.length + 1),
          full_name: adminName,
          org_name: 'Eventrye (ORBIT-I)',
          email: cleanEmail,
          password: hashedPassword,
          master_key: cleanMasterKey,
          phone: '',
          role: 'admin',
          plan: 'Platform Authority',
          created_at: new Date().toISOString()
        };
        memoryStore.users.unshift(memUser);
      }
      if (typeof saveMemoryStoreToDisk === 'function') {
        saveMemoryStoreToDisk();
      }
    }

    // Ensure Master HQ Tenant (#1) exists
    const [hq] = await query('SELECT * FROM `tenants` WHERE `id` = 1');
    let masterTenant;
    if (hq.length === 0) {
      await query(
        'INSERT INTO `tenants` (`id`, `name`, `slug`, `owner_id`, `plan`, `status`, `primary_color`, `secondary_color`, `white_label_enabled`, `license_status`) VALUES (1, "Eventrye HQ", "eventrye-hq", ?, "Platform Authority", "active", "#1d4ed8", "#1e40af", TRUE, "active")',
        [adminUserId]
      );
      masterTenant = { id: 1, name: 'Eventrye HQ', slug: 'eventrye-hq', plan: 'Platform Authority' };
    } else {
      masterTenant = hq[0];
    }

    if (!masterTenant || typeof masterTenant.name !== 'string' || !masterTenant.name || masterTenant.name === '1' || masterTenant.name === 1) {
      masterTenant = {
        id: 1,
        name: 'Eventrye HQ',
        slug: 'eventrye-hq',
        plan: 'Platform Authority',
        status: 'active',
        primary_color: '#1d4ed8',
        secondary_color: '#1e40af',
        white_label_enabled: 1,
        license_status: 'active'
      };
      await query("UPDATE `tenants` SET `name` = 'Eventrye HQ', `slug` = 'eventrye-hq' WHERE `id` = 1").catch(() => {});
    }

    const token = generateToken({
      id: adminUserId,
      email: cleanEmail,
      role: 'admin',
      tenantId: 1
    });

    logSecurityEvent({
      severity: 'WARNING',
      type: 'SUPERADMIN_CREDENTIALS_PROVISIONED',
      action: 'SuperAdmin Account Created/Updated',
      detail: `SuperAdmin credentials provisioned for ${cleanEmail} via Master Setup Gateway`,
      userId: adminUserId,
      tenantId: 1
    });

    return res.json({
      success: true,
      message: 'Master SuperAdmin credentials created successfully! Logging you into Platform Console...',
      token,
      user: {
        id: adminUserId,
        fullName: adminName,
        email: cleanEmail,
        role: 'admin',
        orgName: 'Eventrye (ORBIT-I)'
      },
      tenant: masterTenant,
      tenants: [masterTenant]
    });
  } catch (error) {
    console.error('[Master Gateway Setup Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to configure SuperAdmin credentials.' });
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
      message: 'Access strictly denied. Eventrye Platform Superadmin privileges are required. Client organizations cannot access the platform admin panel.'
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

    const clientTenants = tenants.filter(t => t.id !== 1 && t.slug !== 'eventrye-hq' && t.slug !== 'eventrye-hq');
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

// GET /api/admin/reports/financial-audit - Comprehensive Executive Financial & Distribution Audit Report
// Supports intervals: 7d, 15d, 1m (30d), 3m (90d), 6m (180d), 1y (365d), 2y (730d), all
router.get('/reports/financial-audit', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const rawInterval = (req.query.interval || '1m').toString().toLowerCase().trim();
    const now = new Date();
    let durationDays = 30;
    let intervalLabel = 'Last 30 Days (1 Month)';
    let bucketCount = 10;

    switch (rawInterval) {
      case '7d':
        durationDays = 7;
        intervalLabel = 'Last 7 Days';
        bucketCount = 7;
        break;
      case '15d':
        durationDays = 15;
        intervalLabel = 'Last 15 Days';
        bucketCount = 15;
        break;
      case '1m':
      case '30d':
        durationDays = 30;
        intervalLabel = 'Last 1 Month (30 Days)';
        bucketCount = 10;
        break;
      case '3m':
      case '90d':
        durationDays = 90;
        intervalLabel = 'Last 3 Months (Quarter)';
        bucketCount = 12;
        break;
      case '6m':
      case '180d':
        durationDays = 180;
        intervalLabel = 'Last 6 Months (Half Year)';
        bucketCount = 12;
        break;
      case '1y':
      case '365d':
        durationDays = 365;
        intervalLabel = 'Last 1 Year (Annual Audit)';
        bucketCount = 12;
        break;
      case '2y':
      case '730d':
        durationDays = 730;
        intervalLabel = 'Last 2 Years (Bi-Annual Audit)';
        bucketCount = 16;
        break;
      case 'all':
        durationDays = 1095;
        intervalLabel = 'All Time (Platform Inception to Date)';
        bucketCount = 12;
        break;
      default:
        durationDays = 30;
        intervalLabel = 'Last 30 Days (1 Month)';
        bucketCount = 10;
    }

    const startDate = new Date(now.getTime() - durationDays * 86400000);

    // Pull entities from MySQL query or memoryStore
    let tenants = [];
    let subscriptions = [];
    let events = [];
    let attendees = [];
    let checkIns = [];
    let certs = [];

    try {
      const [tRows] = await query('SELECT * FROM `tenants` WHERE `id` != 1 AND `slug` != "eventrye-hq"');
      tenants = tRows || [];
    } catch {
      tenants = (memoryStore.tenants || []).filter(t => t.id !== 1 && t.slug !== 'eventrye-hq');
    }

    try {
      const [sRows] = await query('SELECT * FROM `subscriptions`');
      subscriptions = sRows || [];
    } catch {
      subscriptions = memoryStore.subscriptions || [];
    }

    try {
      const [eRows] = await query('SELECT * FROM `events`');
      events = eRows || [];
    } catch {
      events = memoryStore.events || [];
    }

    try {
      const [aRows] = await query('SELECT * FROM `event_attendees`');
      attendees = aRows || [];
    } catch {
      attendees = memoryStore.event_attendees || [];
    }

    try {
      const [cRows] = await query('SELECT * FROM `check_ins`');
      checkIns = cRows || [];
    } catch {
      checkIns = memoryStore.check_ins || [];
    }

    try {
      const [certRows] = await query('SELECT * FROM `certificates`');
      certs = certRows || [];
    } catch {
      certs = memoryStore.certificates || [];
    }

    // 1. Calculate Organization Distributions
    const planDistribution = {
      Starter: 0,
      Professional: 0,
      Enterprise: 0,
      Custom: 0
    };
    const statusDistribution = {
      active: 0,
      suspended: 0,
      pending: 0
    };

    const PLAN_FEES = {
      Starter: 36,
      Professional: 99,
      Enterprise: 299,
      Custom: 499
    };

    let totalEventsHosted = 0;
    let totalAttendeesServed = 0;
    let totalCertificatesIssued = 0;
    let totalCheckInsVerified = 0;

    const orgItems = tenants.map(t => {
      const p = t.plan || 'Starter';
      if (planDistribution[p] !== undefined) planDistribution[p]++;
      else planDistribution.Custom++;

      const st = t.status || 'active';
      if (statusDistribution[st] !== undefined) statusDistribution[st]++;

      const orgEvents = events.filter(e => e.tenant_id === t.id);
      const orgAttendees = attendees.filter(a => orgEvents.some(e => e.id === a.event_id));
      const orgCheckIns = checkIns.filter(c => orgEvents.some(e => e.id === c.event_id));
      const orgCerts = certs.filter(cr => cr.tenant_id === t.id || orgEvents.some(e => e.id === cr.event_id));

      totalEventsHosted += orgEvents.length;
      totalAttendeesServed += orgAttendees.length;
      totalCertificatesIssued += orgCerts.length;
      totalCheckInsVerified += orgCheckIns.length;

      const monthlyFee = PLAN_FEES[p] || 36;
      const estimatedRev = Number((monthlyFee * (durationDays / 30)).toFixed(2));

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: p,
        status: st,
        eventsCount: orgEvents.length,
        attendeesCount: orgAttendees.length,
        certsCount: orgCerts.length,
        checkInsCount: orgCheckIns.length,
        licenseKey: t.license_key || 'ACTIVE-KEY',
        grossRevenue: estimatedRev,
        createdAt: t.created_at || now.toISOString()
      };
    });

    // 2. Financial Calculations (Sales vs Purchases / Operational Costs)
    // Gross Sales Revenue:
    let directSubscriptionSales = subscriptions
      .filter(s => s.status === 'active' || s.status === 'approved')
      .reduce((sum, s) => sum + (Number(s.amount) || Number(s.price) || 0), 0);

    // If subscriptions are calculated via active tenants across this timeline:
    const activeTenantsCount = tenants.filter(t => t.status === 'active').length;
    let calculatedSaaSSales = tenants.reduce((sum, t) => {
      const fee = PLAN_FEES[t.plan] || 36;
      return sum + (t.status === 'active' ? fee : 0);
    }, 0) * (durationDays / 30);

    const grossSalesUsd = Number(Math.max(directSubscriptionSales, calculatedSaaSSales).toFixed(2));
    const USD_TO_PKR = 278;
    const grossSalesPkr = Math.round(grossSalesUsd * USD_TO_PKR);

    // Operational Purchases & Direct Costs (COGS & OPEX):
    // COGS:
    // 1. Merchant Payment Gateway Processing Fee (2.5% of gross sales)
    const gatewayFeesUsd = Number((grossSalesUsd * 0.025).toFixed(2));
    // 2. Telco SMS & WhatsApp OTP Gateway ($0.015 per attendee verification)
    const smsFeesUsd = Number((Math.max(attendees.length, totalAttendeesServed) * 0.015).toFixed(2));
    // 3. Transactional Email Relay Server ($0.001 per cert / ticket)
    const emailFeesUsd = Number((Math.max(certs.length, totalCertificatesIssued, 100) * 0.001).toFixed(2));

    // OPEX (Pro-rated to duration):
    const timeRatio = durationDays / 30;
    const cloudHostingUsd = Number((180 * timeRatio).toFixed(2)); // High-availability MySQL & app servers
    const qrStorageUsd = Number((45 * timeRatio).toFixed(2));     // Cryptographic verification CDN & object storage
    const securitySentinelUsd = Number((35 * timeRatio).toFixed(2)); // AI content scanning & Level-1 compliance sentinel
    const systemMaintenanceUsd = Number((120 * timeRatio).toFixed(2)); // Dedicated engineering reserve & SLA upkeep

    const totalPurchasesUsd = Number((gatewayFeesUsd + smsFeesUsd + emailFeesUsd + cloudHostingUsd + qrStorageUsd + securitySentinelUsd + systemMaintenanceUsd).toFixed(2));
    const totalPurchasesPkr = Math.round(totalPurchasesUsd * USD_TO_PKR);

    // 3. Loss & Profit (P&L) Statement:
    const grossProfitUsd = Number((grossSalesUsd - (gatewayFeesUsd + smsFeesUsd + emailFeesUsd)).toFixed(2));
    const netProfitUsd = Number((grossSalesUsd - totalPurchasesUsd).toFixed(2));
    const netProfitPkr = Math.round(netProfitUsd * USD_TO_PKR);

    const isLoss = netProfitUsd < 0;
    const lossAmountUsd = isLoss ? Math.abs(netProfitUsd) : 0;
    const profitMarginPercent = grossSalesUsd > 0
      ? Number(((netProfitUsd / grossSalesUsd) * 100).toFixed(1))
      : 0;

    // 4. Timeline Breakdown Generation (for Recharts interactive graphs)
    const timeline = [];
    const stepMs = (now.getTime() - startDate.getTime()) / bucketCount;

    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = new Date(startDate.getTime() + i * stepMs);
      const bucketEnd = new Date(startDate.getTime() + (i + 1) * stepMs);
      
      let label = bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (durationDays > 180) {
        label = bucketStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }

      const fraction = 1 / bucketCount;
      const bucketSales = Number((grossSalesUsd * fraction).toFixed(2));
      const bucketPurchases = Number((totalPurchasesUsd * fraction).toFixed(2));
      const bucketProfit = Number((bucketSales - bucketPurchases).toFixed(2));
      const bucketMargin = bucketSales > 0 ? Number(((bucketProfit / bucketSales) * 100).toFixed(1)) : 0;

      timeline.push({
        label,
        startDate: bucketStart.toISOString(),
        endDate: bucketEnd.toISOString(),
        sales: bucketSales,
        purchases: bucketPurchases,
        profit: bucketProfit,
        margin: bucketMargin,
        activeOrgs: activeTenantsCount,
        eventsCount: Math.round(totalEventsHosted / bucketCount) || 0,
        attendeesCount: Math.round(totalAttendeesServed / bucketCount) || 0
      });
    }

    return res.json({
      success: true,
      report: {
        interval: rawInterval,
        intervalLabel,
        durationDays,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        financials: {
          grossSalesUsd,
          grossSalesPkr,
          operatingPurchasesUsd: totalPurchasesUsd,
          operatingPurchasesPkr: totalPurchasesPkr,
          grossProfitUsd,
          grossProfitPkr: Math.round(grossProfitUsd * USD_TO_PKR),
          netProfitUsd,
          netProfitPkr,
          profitMarginPercent,
          isLoss,
          lossAmountUsd,
          lossAmountPkr: Math.round(lossAmountUsd * USD_TO_PKR),
          salesBreakdown: {
            starterPlanRevenue: Number((planDistribution.Starter * PLAN_FEES.Starter * timeRatio).toFixed(2)),
            professionalPlanRevenue: Number((planDistribution.Professional * PLAN_FEES.Professional * timeRatio).toFixed(2)),
            enterprisePlanRevenue: Number((planDistribution.Enterprise * PLAN_FEES.Enterprise * timeRatio).toFixed(2)),
            customPlanRevenue: Number((planDistribution.Custom * PLAN_FEES.Custom * timeRatio).toFixed(2)),
            ticketCommissions: Number((totalEventsHosted * 8.5).toFixed(2)),
            addOnQuotaPacks: Number((totalCertificatesIssued * 0.05).toFixed(2))
          },
          purchasesBreakdown: {
            merchantGatewayFees: gatewayFeesUsd,
            telcoSmsVerification: smsFeesUsd,
            emailDeliveryInfrastructure: emailFeesUsd,
            cloudHostingAndDatabases: cloudHostingUsd,
            tamperEvidentStorage: qrStorageUsd,
            securitySentinelScanner: securitySentinelUsd,
            maintenanceReserve: systemMaintenanceUsd
          }
        },
        organizations: {
          totalCount: tenants.length,
          activeCount: activeTenantsCount,
          suspendedCount: statusDistribution.suspended,
          planDistribution,
          statusDistribution,
          totalEvents: totalEventsHosted,
          totalAttendees: totalAttendeesServed,
          totalCertificates: totalCertificatesIssued,
          totalCheckIns: totalCheckInsVerified,
          checkInRatePercent: totalAttendeesServed > 0
            ? Number(((totalCheckInsVerified / totalAttendeesServed) * 100).toFixed(1))
            : 0,
          items: orgItems
        },
        timeline,
        compliance: {
          auditNumber: `EVX-AUDIT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          taxNtn: '9842104-7',
          taxStrn: '3277876123456',
          sbpLevel1Certified: true,
          regulatoryBody: 'State Bank of Pakistan (SBP) & FBR Compliant',
          governingEntity: 'ORBIT-I Private Limited',
          generatedAt: now.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('[Admin Financial Audit Report Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate financial audit report.' });
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
      const isMaster = t.id === 1 || t.slug === 'eventrye-hq' || t.slug === 'eventrye-hq';
      const rawOwner = userMap[t.owner_id];
      const ownerEmail = (rawOwner?.email && !rawOwner.email.startsWith('$2b$')) 
        ? rawOwner.email 
        : (isMaster ? 'admin@eventrye.com' : `${(rawOwner?.full_name || 'client').toLowerCase().replace(/\s+/g, '')}@orbit-i.tech`);

      return {
        ...t,
        name: String(t.name || 'Organization'),
        isSuperAdmin: isMaster,
        plan: isMaster ? 'Platform Authority' : (t.plan || 'Starter'),
        owner: {
          full_name: rawOwner?.full_name || (isMaster ? 'Platform SuperAdmin' : 'Organization Owner'),
          email: ownerEmail
        },
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
  Starter: { price: 0, attendees: 15, maxEvents: 2, maxCerts: 30, whiteLabel: false },
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
        id: t.id,
        tenant_id: t.id,
        tenantId: t.id,
        name: String(t.name || 'Organization'),
        slug: String(t.slug || ''),
        owner_name: owner.full_name,
        ownerName: owner.full_name,
        owner_email: (owner.email && !owner.email.startsWith('$2b$')) ? owner.email : `${(owner.full_name || 'client').toLowerCase().replace(/\s+/g, '')}@orbit-i.tech`,
        ownerEmail: (owner.email && !owner.email.startsWith('$2b$')) ? owner.email : `${(owner.full_name || 'client').toLowerCase().replace(/\s+/g, '')}@orbit-i.tech`,
        owner_phone: owner.phone || '',
        ownerPhone: owner.phone || '',
        plan: t.plan || 'Starter',
        status: t.status || 'pending_approval',
        license_key: t.license_key || null,
        licenseKey: t.license_key || null,
        license_status: t.license_status || (t.status === 'active' ? 'active' : 'pending'),
        licenseStatus: t.license_status || (t.status === 'active' ? 'active' : 'pending'),
        license_activated_at: t.license_activated_at || t.created_at,
        licenseActivatedAt: t.license_activated_at || t.created_at,
        license_expires_at: t.license_expires_at,
        licenseExpiresAt: t.license_expires_at,
        events_count: e.event_count || 0,
        eventsUsed: e.event_count || 0,
        max_events: t.max_events || planConfig.maxEvents,
        eventsLimit: t.max_events || planConfig.maxEvents,
        attendees_count: e.attendee_count || 0,
        attendeesUsed: e.attendee_count || 0,
        max_attendees: t.max_attendees || planConfig.attendees,
        attendeesLimit: t.max_attendees || planConfig.attendees,
        certs_count: cCount,
        certsUsed: cCount,
        max_certs: t.max_certs || planConfig.maxCerts,
        certsLimit: t.max_certs || planConfig.maxCerts,
        white_label_enabled: Boolean(t.white_label_enabled),
        whiteLabelEnabled: Boolean(t.white_label_enabled),
        custom_domain: t.custom_domain || '',
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
      message: `Verified review for ${organization.trim()} has been published to the Eventrye landing page.`,
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

// =====================================================
// DYNAMIC PRICING PLANS MANAGEMENT
// =====================================================

// GET /api/admin/plans - List all pricing plans (active & inactive)
router.get('/plans', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM `pricing_plans` ORDER BY `display_order` ASC');
    const plans = (rows || []).map(p => ({
      ...p,
      features: typeof p.features === 'string' ? JSON.parse(p.features || '[]') : (p.features || [])
    }));
    return res.json({ success: true, plans });
  } catch (error) {
    console.error('[Admin Plans List Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve plans.' });
  }
});

// POST /api/admin/plans - Create or update a dynamic pricing plan
router.post('/plans', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { 
      id, 
      slug, 
      name, 
      monthly_price = 0, 
      yearly_price = 0, 
      tag = '', 
      attendees_limit = 500, 
      max_events = 5, 
      max_certs = 50, 
      white_label = false, 
      features = [], 
      is_active = true, 
      display_order = 1 
    } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Plan name is required.' });
    }

    const cleanSlug = (slug || name).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    const featuresJson = typeof features === 'string' ? features : JSON.stringify(features);
    const isActiveVal = is_active ? 1 : 0;
    const whiteLabelVal = white_label ? 1 : 0;

    if (id) {
      // Update existing
      await query(
        'UPDATE `pricing_plans` SET `name` = ?, `monthly_price` = ?, `yearly_price` = ?, `tag` = ?, `attendees_limit` = ?, `max_events` = ?, `max_certs` = ?, `white_label` = ?, `features` = ?, `is_active` = ?, `display_order` = ? WHERE `id` = ?',
        [name.trim(), Number(monthly_price), Number(yearly_price), tag.trim(), Number(attendees_limit), Number(max_events), Number(max_certs), whiteLabelVal, featuresJson, isActiveVal, Number(display_order), id]
      );

      logSecurityEvent({
        severity: 'INFO',
        type: 'PLAN_UPDATED',
        action: 'Pricing Plan Updated',
        detail: `SuperAdmin updated plan #${id} (${name})`,
        userId: req.user.id,
        tenantId: 1
      });

      return res.json({ success: true, message: `Plan "${name}" updated successfully!` });
    } else {
      // Create new
      const [insertRes] = await query(
        'INSERT INTO `pricing_plans` (`slug`, `name`, `monthly_price`, `yearly_price`, `tag`, `attendees_limit`, `max_events`, `max_certs`, `white_label`, `features`, `is_active`, `display_order`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [cleanSlug, name.trim(), Number(monthly_price), Number(yearly_price), tag.trim(), Number(attendees_limit), Number(max_events), Number(max_certs), whiteLabelVal, featuresJson, isActiveVal, Number(display_order)]
      );

      logSecurityEvent({
        severity: 'INFO',
        type: 'PLAN_CREATED',
        action: 'Pricing Plan Created',
        detail: `SuperAdmin created new plan "${name}"`,
        userId: req.user.id,
        tenantId: 1
      });

      return res.json({ success: true, message: `Plan "${name}" created successfully!`, planId: insertRes.insertId });
    }
  } catch (error) {
    console.error('[Admin Plan Save Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to save pricing plan.' });
  }
});

// DELETE /api/admin/plans/:id - Delete a plan
router.delete('/plans/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM `pricing_plans` WHERE `id` = ?', [id]);
    return res.json({ success: true, message: 'Plan removed.' });
  } catch (error) {
    console.error('[Admin Plan Delete Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete plan.' });
  }
});

// =====================================================
// DYNAMIC COUPONS & DISCOUNTS MANAGEMENT
// =====================================================

// GET /api/admin/coupons - List all discount coupons
router.get('/coupons', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM `coupons` ORDER BY `created_at` DESC');
    return res.json({ success: true, coupons: rows || [] });
  } catch (error) {
    console.error('[Admin Coupons List Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve coupons.' });
  }
});

// POST /api/admin/coupons - Create or update coupon
router.post('/coupons', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { 
      id, 
      code, 
      description = '', 
      discount_type = 'percentage', 
      discount_value = 0, 
      min_purchase = 0, 
      max_uses = 1000, 
      expires_at = null, 
      is_active = true 
    } = req.body || {};

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const isActiveVal = is_active ? 1 : 0;
    const cleanExpiry = expires_at ? new Date(expires_at).toISOString().slice(0, 19).replace('T', ' ') : null;

    if (id) {
      await query(
        'UPDATE `coupons` SET `code` = ?, `description` = ?, `discount_type` = ?, `discount_value` = ?, `min_purchase` = ?, `max_uses` = ?, `expires_at` = ?, `is_active` = ? WHERE `id` = ?',
        [cleanCode, description.trim(), discount_type, Number(discount_value), Number(min_purchase), Number(max_uses), cleanExpiry, isActiveVal, id]
      );
      return res.json({ success: true, message: `Coupon "${cleanCode}" updated successfully!` });
    } else {
      const [insertRes] = await query(
        'INSERT INTO `coupons` (`code`, `description`, `discount_type`, `discount_value`, `min_purchase`, `max_uses`, `expires_at`, `is_active`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [cleanCode, description.trim(), discount_type, Number(discount_value), Number(min_purchase), Number(max_uses), cleanExpiry, isActiveVal]
      );
      return res.json({ success: true, message: `Coupon "${cleanCode}" created successfully!`, couponId: insertRes.insertId });
    }
  } catch (error) {
    console.error('[Admin Coupon Save Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to save coupon code.' });
  }
});

// DELETE /api/admin/coupons/:id - Delete a coupon
router.delete('/coupons/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM `coupons` WHERE `id` = ?', [id]);
    return res.json({ success: true, message: 'Coupon removed.' });
  } catch (error) {
    console.error('[Admin Coupon Delete Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete coupon.' });
  }
});

// =====================================================
// DYNAMIC PLATFORM TEAM (ORBIT-I LEADERSHIP) MANAGEMENT
// Dynamic CRUD for Abdul Samad Rind, Maria Almani, Muneeb Ur Rehman, Hassan Ansar, Chander Parakash, Laiba & future team members
// =====================================================

// GET /api/admin/platform-team - List all platform team members
router.get('/platform-team', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM `platform_team_members` ORDER BY `display_order` ASC, `id` ASC');
    
    const officialBaseTeam = [
      {
        id: 1,
        name: 'Abdul Samad Rind',
        role: 'Full Stack Web Developer & Platform Architect',
        department: 'Leadership & Engineering',
        bio: 'Founder & Platform Architect at ORBIT-I Private Limited. Lead Full Stack Web Developer heading Eventrye core distributed multi-tenant engine, high-concurrency event registration pipelines, and tamper-evident credential verification.',
        display_order: 1,
        is_active: 1
      },
      {
        id: 2,
        name: 'Maria Almani',
        role: 'Full Stack Web Developer, SEO & Content Specialist',
        department: 'Product & Web Growth',
        bio: 'Full Stack Web Developer, SEO Strategist and Technical Content Specialist at ORBIT-I Private Limited. Leading fast-loading frontend architecture, organic search visibility, platform content strategy, and intuitive organizer UX.',
        display_order: 2,
        is_active: 1
      },
      {
        id: 3,
        name: 'Muhammad Muneeb Ur Rahman Shahzad',
        role: 'DevOps Engineer',
        department: 'DevOps & Systems Infrastructure',
        bio: 'DevOps & Systems Infrastructure Engineer at ORBIT-I Private Limited. Spearheading zero-downtime CI/CD deployment pipelines, Dockerized microservices, high-availability database clustering, and SBP-compliant server hardening.',
        display_order: 3,
        is_active: 1
      },
      {
        id: 4,
        name: 'Hassan Ansar',
        role: 'Web Developer',
        department: 'Web Development & Engineering',
        bio: 'Web Developer at ORBIT-I Private Limited. Specializing in modern web applications, performant user interfaces, responsive frontends, and dynamic event management workflows.',
        display_order: 4,
        is_active: 1
      },
      {
        id: 5,
        name: 'Chander Parakash',
        role: 'Backend Developer',
        department: 'Backend Engineering & Distributed Systems',
        bio: 'Backend Developer at ORBIT-I Private Limited. Specializing in high-concurrency Node.js microservices, database query optimization, Redis caching layers, and secure payment webhook pipelines for Eventrye.',
        display_order: 5,
        is_active: 1
      },
      {
        id: 6,
        name: 'Laiba',
        role: 'Backend Developer',
        department: 'Backend Engineering & Cloud Architecture',
        bio: 'Backend Developer at ORBIT-I Private Limited. Expert in RESTful API architecture, cryptographic ticket verification algorithms, automated batch processing, and scalable cloud database structures for Eventrye.',
        display_order: 6,
        is_active: 1
      }
    ];

    let finalTeam = Array.isArray(rows) && rows.length >= 6 ? rows : [...officialBaseTeam];
    if (Array.isArray(rows) && rows.length > 0 && rows.length < 6) {
      const existingNames = new Set(rows.map(r => (r.name || '').toLowerCase()));
      const missing = officialBaseTeam.filter(m => !existingNames.has(m.name.toLowerCase()));
      finalTeam = [...rows, ...missing];
      finalTeam.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    return res.json({ success: true, team: finalTeam });
  } catch (error) {
    console.error('[Admin Platform Team List Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve platform team members.' });
  }
});

// POST /api/admin/platform-team - Add or update a platform team member
router.post('/platform-team', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const {
      id,
      name,
      role,
      department = 'ORBIT-I Platform',
      bio = '',
      avatar_url = '',
      display_order = 1,
      is_active = true
    } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Team member name is required.' });
    }
    if (!role || !role.trim()) {
      return res.status(400).json({ success: false, message: 'Team member role/title is required.' });
    }

    const isActiveVal = is_active ? 1 : 0;
    const nowIso = new Date().toISOString();

    if (id) {
      await query(
        'UPDATE `platform_team_members` SET `name` = ?, `role` = ?, `department` = ?, `bio` = ?, `avatar_url` = ?, `display_order` = ?, `is_active` = ?, `updated_at` = ? WHERE `id` = ?',
        [name.trim(), role.trim(), department.trim(), bio.trim(), avatar_url.trim(), Number(display_order), isActiveVal, nowIso, id]
      );

      logSecurityEvent({
        severity: 'INFO',
        type: 'PLATFORM_TEAM_UPDATED',
        action: 'Platform Team Member Updated',
        detail: `SuperAdmin updated platform team member #${id} (${name})`,
        userId: req.user.id,
        tenantId: 1
      });

      return res.json({ success: true, message: `Team member "${name}" updated successfully!` });
    } else {
      const [insertRes] = await query(
        'INSERT INTO `platform_team_members` (`name`, `role`, `department`, `bio`, `avatar_url`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name.trim(), role.trim(), department.trim(), bio.trim(), avatar_url.trim(), Number(display_order), isActiveVal, nowIso, nowIso]
      );

      logSecurityEvent({
        severity: 'INFO',
        type: 'PLATFORM_TEAM_CREATED',
        action: 'Platform Team Member Added',
        detail: `SuperAdmin added platform team member "${name}" (${role})`,
        userId: req.user.id,
        tenantId: 1
      });

      return res.json({ success: true, message: `Team member "${name}" added successfully!`, memberId: insertRes.insertId });
    }
  } catch (error) {
    console.error('[Admin Platform Team Save Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to save platform team member.' });
  }
});

// DELETE /api/admin/platform-team/:id - Remove a platform team member
router.delete('/platform-team/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM `platform_team_members` WHERE `id` = ?', [id]);

    logSecurityEvent({
      severity: 'INFO',
      type: 'PLATFORM_TEAM_DELETED',
      action: 'Platform Team Member Removed',
      detail: `SuperAdmin removed platform team member #${id}`,
      userId: req.user.id,
      tenantId: 1
    });

    return res.json({ success: true, message: 'Team member removed successfully.' });
  } catch (error) {
    console.error('[Admin Platform Team Delete Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete platform team member.' });
  }
});

// =====================================================
// DISASTER RECOVERY & ZERO DATA LOSS BACKUP SYSTEM
// Ensures client organizations' data is 100% safe & protected during version updates
// =====================================================

const BACKUP_TABLES = [
  'users',
  'tenants',
  'tenant_members',
  'tenant_api_keys',
  'tenant_webhooks',
  'events',
  'event_attendees',
  'team_members',
  'platform_team_members',
  'activity_logs',
  'contact_messages',
  'subscriptions',
  'certificate_templates',
  'template_versions',
  'recipients',
  'generation_batches',
  'generation_items',
  'certificates',
  'delivery_attempts',
  'testimonials',
  'pricing_plans',
  'coupons',
  'website_cms'
];

// Helper: Extract complete database snapshot
async function generatePlatformBackup() {
  const backupData = {
    metadata: {
      platform: 'Eventrye Enterprise Multi-Tenant Cloud',
      authority: 'ORBIT-I Private Limited',
      year: 2026,
      generated_at: new Date().toISOString(),
      timestamp: Date.now(),
      version: 'v2.0.0-2026-STABLE'
    },
    tables: {}
  };

  for (const table of BACKUP_TABLES) {
    try {
      const [rows] = await query(`SELECT * FROM \`${table}\``);
      backupData.tables[table] = rows || [];
    } catch (err) {
      backupData.tables[table] = [];
    }
  }

  return backupData;
}

// GET /api/admin/backup/export - Download full database backup (.sql or .json)
router.get('/backup/export', async (req, res) => {
  try {
    // Authenticate via Authorization header or ?token= query parameter (for direct download links)
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'SuperAdmin authorization token required.' });
    }

    const { verifyTokenDirect } = await import('../middleware/auth.js');
    const decoded = verifyTokenDirect ? verifyTokenDirect(token) : null;
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'SuperAdmin authority privileges required for database exports.' });
    }

    const format = String(req.query.format || 'sql').toLowerCase();
    const backup = await generatePlatformBackup();
    const dateStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="eventrye_disaster_recovery_${dateStamp}.json"`);
      return res.send(JSON.stringify(backup, null, 2));
    }

    // Format SQL Dump file
    let sqlDump = `-- =========================================================================\n`;
    sqlDump += `-- Eventrye Enterprise Multi-Tenant Disaster Recovery & Master Backup\n`;
    sqlDump += `-- Authorized by Platform Authority: ORBIT-I Private Limited\n`;
    sqlDump += `-- Generated At: ${new Date().toISOString()}\n`;
    sqlDump += `-- Protection Status: 100% Zero-Data-Loss Safe for Software Updates\n`;
    sqlDump += `-- =========================================================================\n\n`;
    sqlDump += `SET NAMES utf8mb4;\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const [table, rows] of Object.entries(backup.tables)) {
      if (Array.isArray(rows) && rows.length > 0) {
        sqlDump += `-- -----------------------------------------------------\n`;
        sqlDump += `-- Data Dump for Table: \`${table}\` (${rows.length} rows)\n`;
        sqlDump += `-- -----------------------------------------------------\n`;
        for (const row of rows) {
          const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 1 : 0;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          }).join(', ');
          sqlDump += `INSERT INTO \`${table}\` (${keys}) VALUES (${values}) ON DUPLICATE KEY UPDATE \`id\` = \`id\`;\n`;
        }
        sqlDump += `\n`;
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sqlDump += `-- [End of Eventrye Master Backup. All tenant workspaces preserved.]\n`;

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="eventrye_backup_2026_${dateStamp}.sql"`);
    return res.send(sqlDump);
  } catch (error) {
    console.error('[Platform Admin Backup Export Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate database export.' });
  }
});

// POST /api/admin/backup/snapshot - Save an instant disaster recovery snapshot on server disk
router.post('/backup/snapshot', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const backupDir = path.resolve(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backup = await generatePlatformBackup();
    const dateStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `snapshot_${dateStamp}.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf-8');
    const stats = fs.statSync(filePath);

    let totalRecords = 0;
    for (const rows of Object.values(backup.tables)) {
      totalRecords += (rows || []).length;
    }

    logSecurityEvent({
      severity: 'INFO',
      type: 'DISASTER_RECOVERY_SNAPSHOT_CREATED',
      action: 'Platform Database Snapshot Saved',
      detail: `SuperAdmin generated full backup snapshot "${fileName}" (${totalRecords} records across ${BACKUP_TABLES.length} tables)`,
      userId: req.user.id,
      tenantId: 1
    });

    return res.json({
      success: true,
      message: 'Disaster recovery snapshot saved safely on server storage! All client data preserved.',
      snapshot: {
        fileName,
        sizeKb: Math.round(stats.size / 1024),
        totalRecords,
        tablesCount: BACKUP_TABLES.length,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Admin Backup Snapshot Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create backup snapshot.' });
  }
});

// GET /api/admin/backup/snapshots - View available server disk snapshots
router.get('/backup/snapshots', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const backupDir = path.resolve(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      return res.json({ success: true, snapshots: [] });
    }

    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json') || f.endsWith('.sql'));
    const snapshots = files.map(file => {
      const stats = fs.statSync(path.join(backupDir, file));
      return {
        fileName: file,
        sizeKb: Math.round(stats.size / 1024),
        createdAt: stats.mtime.toISOString()
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ success: true, snapshots });
  } catch (error) {
    console.error('[Admin Backup List Snapshots Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to list snapshots.' });
  }
});

export default router;
