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

    return res.json({
      success: true,
      tenant: {
        ...tenant,
        metrics: {
          totalEvents: eventCount[0]?.total_events || 0,
          totalAttendees: eventCount[0]?.total_attendees || 0,
          memberCount: teamCount[0]?.member_count || 1,
          eventsQuota: tenant.max_events || 100,
          attendeesQuota: tenant.max_attendees || 50000,
        }
      }
    });
  } catch (error) {
    console.error('[Get Current Tenant Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load organization profile.' });
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
