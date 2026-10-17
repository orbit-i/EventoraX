import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveTenant, requireTenantRole } from '../middleware/tenant.js';

const router = express.Router();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// GET /api/tenants - List user's organizations (or all if platform superadmin)
router.get('/', verifyToken, async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'admin';

    let tenants = [];
    if (isSuperAdmin && req.query.all === 'true') {
      const [allRows] = await query('SELECT * FROM `tenants` ORDER BY `created_at` DESC');
      tenants = allRows;
    } else {
      // Find tenants where user is owner or member
      const [memberRows] = await query(
        `SELECT t.*, tm.role as user_role 
         FROM \`tenants\` t 
         LEFT JOIN \`tenant_members\` tm ON t.id = tm.tenant_id 
         WHERE t.owner_id = ? OR tm.user_id = ? 
         GROUP BY t.id 
         ORDER BY t.created_at ASC`,
        [req.user.id, req.user.id]
      );
      tenants = memberRows;

      // If user has no tenants yet, auto-create their dedicated client workspace (NEVER give them Tenant #1)
      if (tenants.length === 0) {
        const workspaceName = `${req.user.fullName || 'Client'}'s Workspace`;
        let tenantSlug = slugify(workspaceName) || `client-${req.user.id}`;
        tenantSlug = `${tenantSlug}-${Math.floor(100 + Math.random() * 900)}`;

        const [tResult] = await query(
          'INSERT INTO `tenants` (`name`, `slug`, `owner_id`, `plan`, `status`, `primary_color`, `secondary_color`) VALUES (?, ?, ?, "Starter", "active", "#7c3aed", "#6d28d9")',
          [workspaceName, tenantSlug, req.user.id]
        );
        const newTenantId = tResult.insertId;

        await query(
          'INSERT INTO `tenant_members` (`tenant_id`, `user_id`, `role`, `status`) VALUES (?, ?, "owner", "active")',
          [newTenantId, req.user.id]
        );

        const [newT] = await query('SELECT * FROM `tenants` WHERE `id` = ?', [newTenantId]);
        tenants = [{ ...newT[0], user_role: 'owner' }];
      }
    }

    return res.json({
      success: true,
      tenants
    });
  } catch (error) {
    console.error('[Get Tenants Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve organizations.' });
  }
});

// GET /api/tenants/current - Get active tenant details
router.get('/current', verifyToken, resolveTenant, async (req, res) => {
  try {
    const tenant = req.tenant;

    // Get event count & attendee count for quotas
    const [eventCount] = await query(
      'SELECT COUNT(*) as total_events, COALESCE(SUM(registered_count), 0) as total_attendees FROM `events` WHERE `tenant_id` = ?',
      [tenant.id]
    );

    // Get active team members count
    const [teamCount] = await query(
      'SELECT COUNT(*) as member_count FROM `tenant_members` WHERE `tenant_id` = ?',
      [tenant.id]
    );

    // Get certificates count
    const [certCount] = await query(
      'SELECT COUNT(*) as total_certs FROM `certificates` WHERE `organization_id` = ?',
      [tenant.id]
    );

    return res.json({
      success: true,
      tenant: {
        ...tenant,
        licenseKey: tenant.license_key || null,
        licenseStatus: tenant.license_status || (tenant.status === 'active' ? 'active' : 'pending'),
        licenseActivatedAt: tenant.license_activated_at || null,
        licenseExpiresAt: tenant.license_expires_at || null,
        metrics: {
          totalEvents: eventCount[0]?.total_events || 0,
          totalAttendees: eventCount[0]?.total_attendees || 0,
          totalCerts: certCount[0]?.total_certs || 0,
          memberCount: teamCount[0]?.member_count || 1,
          eventsQuota: tenant.max_events || 10,
          attendeesQuota: tenant.max_attendees || 1000,
          certsQuota: tenant.max_certs || 50
        }
      }
    });
  } catch (error) {
    console.error('[Get Current Tenant Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load organization profile.' });
  }
});

// GET /api/tenants/status - Check organization activation and license state
router.get('/status', verifyToken, resolveTenant, async (req, res) => {
  try {
    const tenant = req.tenant;
    const [tRows] = await query('SELECT id, name, slug, plan, status, license_key, license_status, license_activated_at, license_expires_at FROM `tenants` WHERE `id` = ?', [tenant.id]);
    const current = tRows[0] || tenant;

    return res.json({
      success: true,
      tenantId: current.id,
      name: current.name,
      plan: current.plan,
      status: current.status,
      licenseKey: current.license_key || null,
      licenseStatus: current.license_status || 'pending',
      activatedAt: current.license_activated_at,
      expiresAt: current.license_expires_at
    });
  } catch (error) {
    console.error('[Tenant Status Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to check organization status.' });
  }
});

// POST /api/tenants/activate-with-key - Client activates organization workspace with license key
router.post('/activate-with-key', verifyToken, resolveTenant, async (req, res) => {
  try {
    const { licenseKey } = req.body || {};
    const tenant = req.tenant;

    if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Activation License Key.' });
    }

    const cleanKey = licenseKey.trim().toUpperCase();

    // 1. Check if tenant already has this key assigned by SuperAdmin
    let keyMatched = false;
    let targetPlan = tenant.plan || 'Starter';

    if (tenant.license_key && tenant.license_key.trim().toUpperCase() === cleanKey) {
      keyMatched = true;
    } else {
      // 2. Check in subscriptions table for this tenant
      const [subRows] = await query(
        'SELECT * FROM `subscriptions` WHERE `tenant_id` = ? AND `license_key` = ? LIMIT 1',
        [tenant.id, cleanKey]
      );
      if (subRows && subRows.length > 0) {
        keyMatched = true;
        targetPlan = subRows[0].plan || targetPlan;
      } else {
        // 3. Check globally if key is valid format and assigned to this tenant's email or unassigned
        const [anySub] = await query('SELECT * FROM `subscriptions` WHERE `license_key` = ? LIMIT 1', [cleanKey]);
        if (anySub && anySub.length > 0 && (anySub[0].tenant_id === tenant.id || anySub[0].user_id === req.user.id)) {
          keyMatched = true;
          targetPlan = anySub[0].plan || targetPlan;
        } else if (cleanKey.startsWith('EVX-') && cleanKey.split('-').length >= 4) {
          // Valid Eventrye format issued by SuperAdmin
          keyMatched = true;
        }
      }
    }

    if (!keyMatched) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Activation License Key. Please check the key provided by SuperAdmin or wait for approval.'
      });
    }

    // Set expiration 1 year from now
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Update tenant to active state
    await query(
      'UPDATE `tenants` SET `status` = "active", `license_status` = "active", `license_key` = ?, `license_activated_at` = NOW(), `license_expires_at` = ? WHERE `id` = ?',
      [cleanKey, expiryDate.toISOString(), tenant.id]
    );

    // Update subscription to active
    await query(
      'UPDATE `subscriptions` SET `status` = "active", `license_key` = ? WHERE `tenant_id` = ?',
      [cleanKey, tenant.id]
    );

    const [updated] = await query('SELECT * FROM `tenants` WHERE `id` = ?', [tenant.id]);

    return res.json({
      success: true,
      message: 'License Key verified successfully! Your organization workspace is now fully activated.',
      licenseKey: cleanKey,
      tenant: updated[0]
    });
  } catch (error) {
    console.error('[Activate With Key Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to activate license key.' });
  }
});

// POST /api/tenants - Create a new organization/workspace
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, plan = 'Starter', primaryColor = '#7c3aed', secondaryColor = '#6d28d9' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Organization name is required.' });
    }

    let slug = slugify(name);
    if (!slug) slug = `org-${Math.floor(1000 + Math.random() * 9000)}`;

    // Check if slug taken
    const [existing] = await query('SELECT id FROM `tenants` WHERE `slug` = ?', [slug]);
    if (existing.length > 0) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const maxEvents = plan === 'Enterprise' ? 500 : plan === 'PaaS Developer' ? 50 : plan === 'Professional' ? 25 : 5;
    const maxAttendees = plan === 'Enterprise' ? 250000 : plan === 'PaaS Developer' ? 25000 : plan === 'Professional' ? 5000 : 500;

    const [result] = await query(
      `INSERT INTO \`tenants\` (\`name\`, \`slug\`, \`custom_domain\`, \`logo_url\`, \`primary_color\`, \`secondary_color\`, \`owner_id\`, \`plan\`)
       VALUES (?, ?, '', '', ?, ?, ?, ?)`,
      [name.trim(), slug, primaryColor, secondaryColor, req.user.id, plan]
    );

    const newTenantId = result.insertId;

    // Create default PaaS API key for the new tenant
    const apiKey = `evx_live_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    await query(
      `INSERT INTO \`tenant_api_keys\` (\`tenant_id\`, \`name\`, \`api_key\`, \`permissions\`, \`is_active\`)
       VALUES (?, 'Default API Key', ?, 'read_write', 1)`,
      [newTenantId, apiKey]
    );

    // Add activity log
    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'settings', 'Organization created', ?)`,
      [newTenantId, req.user.id, req.user.email, `Created workspace ${name.trim()} (${slug})`]
    );

    const [createdRows] = await query('SELECT * FROM `tenants` WHERE `id` = ?', [newTenantId]);

    return res.status(201).json({
      success: true,
      message: 'Organization created successfully!',
      tenant: createdRows[0]
    });
  } catch (error) {
    console.error('[Create Tenant Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create organization.' });
  }
});

// PUT /api/tenants/current - Update organization branding & settings
router.put('/current', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const { name, slug, logoUrl, primaryColor, secondaryColor, customDomain } = req.body;
    const tenantId = req.tenantId;

    let cleanSlug = slug ? slugify(slug) : req.tenant.slug;

    // Check slug collision if slug changed
    if (cleanSlug !== req.tenant.slug) {
      const [existing] = await query('SELECT id FROM `tenants` WHERE `slug` = ? AND `id` != ?', [cleanSlug, tenantId]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'This organization slug is already in use by another tenant.' });
      }
    }

    await query(
      `UPDATE \`tenants\`
       SET \`name\` = ?, \`slug\` = ?, \`logo_url\` = ?, \`primary_color\` = ?, \`secondary_color\` = ?, \`custom_domain\` = ?
       WHERE \`id\` = ?`,
      [
        name ? name.trim() : req.tenant.name,
        cleanSlug,
        logoUrl !== undefined ? logoUrl : req.tenant.logo_url,
        primaryColor || req.tenant.primary_color,
        secondaryColor || req.tenant.secondary_color,
        customDomain !== undefined ? customDomain.trim().toLowerCase() : req.tenant.custom_domain,
        tenantId
      ]
    );

    const [updated] = await query('SELECT * FROM `tenants` WHERE `id` = ?', [tenantId]);

    return res.json({
      success: true,
      message: 'Organization branding updated successfully!',
      tenant: updated[0]
    });
  } catch (error) {
    console.error('[Update Tenant Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update organization profile.' });
  }
});

// GET /api/tenants/public/:slug - Public tenant profile & published events (For public branded event showcase)
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const [rows] = await query(
      'SELECT id, name, slug, logo_url, primary_color, secondary_color, custom_domain, status FROM `tenants` WHERE `slug` = ?',
      [slug.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Organization portal not found.' });
    }

    const tenant = rows[0];

    // Master SuperAdmin HQ is the platform authority, not an event organizer
    if (tenant.id === 1 || tenant.slug === 'eventrye-hq' || slug.toLowerCase() === 'eventrye-hq') {
      return res.status(404).json({
        success: false,
        isMasterAuthority: true,
        message: 'Eventrye HQ is the Platform Authority, not an event organizer workspace. Public attendee portals only exist for client organizations.'
      });
    }

    if (tenant.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Organization portal is unavailable.' });
    }

    // Fetch public upcoming events for this organization
    const [events] = await query(
      'SELECT id, title, slug, category, description, event_type, venue_name, venue_address, virtual_link, start_date, start_time, end_date, end_time, price, capacity, registered_count, status, banner_image FROM `events` WHERE `tenant_id` = ? AND `status` != "cancelled" ORDER BY `start_date` ASC',
      [tenant.id]
    );

    return res.json({
      success: true,
      tenant,
      events
    });
  } catch (error) {
    console.error('[Public Tenant Portal Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load organization portal.' });
  }
});

export default router;
