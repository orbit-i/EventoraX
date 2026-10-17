import { query } from '../db/db.js';

/**
 * Multi-Tenant Context Resolver Middleware
 * Resolves the tenant context using multiple discovery strategies:
 * 1. Subdomain: e.g. `acme.eventrye.com` -> slug: 'acme'
 * 2. Header: `x-tenant-id` or `x-tenant-slug`
 * 3. Query string / Route param: `tenantId` or `tenantSlug`
 * 4. User's primary/active tenant from authentication (JWT / user session)
 * 5. Fallback to default platform tenant (ID: 1)
 */
export async function resolveTenant(req, res, next) {
  try {
    let tenantId = null;
    let tenantSlug = null;

    // Strategy 1: Header resolution
    if (req.headers['x-tenant-id']) {
      tenantId = parseInt(req.headers['x-tenant-id'], 10);
    } else if (req.headers['x-tenant-slug']) {
      tenantSlug = String(req.headers['x-tenant-slug']).toLowerCase().trim();
    }

    // Strategy 2: Query param
    if (!tenantId && !tenantSlug && req.query.tenantId) {
      tenantId = parseInt(req.query.tenantId, 10);
    }
    if (!tenantId && !tenantSlug && req.query.tenantSlug) {
      tenantSlug = String(req.query.tenantSlug).toLowerCase().trim();
    }

    // Strategy 3: Host / Subdomain extraction (e.g. org1.eventrye.com or custom domain)
    if (!tenantId && !tenantSlug && req.headers.host) {
      const host = req.headers.host.split(':')[0].toLowerCase();
      // Ignore localhost, IP addresses, or apex domain
      if (
        !host.includes('localhost') &&
        !host.match(/^\d+\.\d+\.\d+\.\d+$/) &&
        host.includes('.')
      ) {
        const parts = host.split('.');
        if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api' && parts[0] !== 'app') {
          tenantSlug = parts[0];
        } else {
          // Check for custom domain match
          const [domainMatches] = await query(
            'SELECT id, slug FROM `tenants` WHERE `custom_domain` = ? LIMIT 1',
            [host]
          );
          if (domainMatches && domainMatches.length > 0) {
            tenantId = domainMatches[0].id;
          }
        }
      }
    }

    // Strategy 4: If user is authenticated, check user's assigned/selected tenant
    if (!tenantId && !tenantSlug && req.user) {
      if (req.user.tenantId) {
        tenantId = req.user.tenantId;
      } else {
        // Query user's owned or membership tenant
        const [memberships] = await query(
          'SELECT tenant_id FROM `tenant_members` WHERE `user_id` = ? ORDER BY `created_at` ASC LIMIT 1',
          [req.user.id]
        );
        if (memberships && memberships.length > 0) {
          tenantId = memberships[0].tenant_id;
        } else {
          // Check if owner in tenants
          const [ownedTenants] = await query(
            'SELECT id FROM `tenants` WHERE `owner_id` = ? LIMIT 1',
            [req.user.id]
          );
          if (ownedTenants && ownedTenants.length > 0) {
            tenantId = ownedTenants[0].id;
          }
        }
      }
    }

    // Fallback: Default system tenant
    if (!tenantId && !tenantSlug) {
      tenantId = 1;
    }

    // Fetch tenant details
    let tenantRow = null;
    if (tenantId) {
      const [rows] = await query('SELECT * FROM `tenants` WHERE `id` = ?', [tenantId]);
      if (rows && rows.length > 0) tenantRow = rows[0];
    } else if (tenantSlug) {
      const [rows] = await query('SELECT * FROM `tenants` WHERE `slug` = ?', [tenantSlug]);
      if (rows && rows.length > 0) tenantRow = rows[0];
    }

    // If tenant not found, fallback to tenant #1
    if (!tenantRow) {
      const [defaultRows] = await query('SELECT * FROM `tenants` WHERE `id` = 1');
      tenantRow = defaultRows && defaultRows.length > 0 ? defaultRows[0] : {
        id: 1,
        name: 'Eventrye Global',
        slug: 'default',
        plan: 'Enterprise',
        status: 'active',
        primary_color: '#7c3aed',
        secondary_color: '#6d28d9',
        logo_url: '',
        owner_id: 1
      };
    }

    // Tenant status check
    if (tenantRow.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This organization account is currently suspended. Please contact platform support.',
        tenantStatus: 'suspended'
      });
    }

    // Strict Tenant Isolation & Anti-IDOR Authorization Check (PRD Section 7)
    // Never trust x-tenant-id without validating that req.user is authorized
    if (req.user && req.user.role !== 'admin') {
      const isOwner = tenantRow.owner_id === req.user.id;
      let isMember = false;
      if (!isOwner) {
        const [membershipCheck] = await query(
          'SELECT role FROM `tenant_members` WHERE `tenant_id` = ? AND `user_id` = ? LIMIT 1',
          [tenantRow.id, req.user.id]
        );
        isMember = Boolean(membershipCheck && membershipCheck.length > 0);
      }

      if (!isOwner && !isMember) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cross-tenant access denied',
          message: 'You are not authorized to access or modify resources belonging to this organization.'
        });
      }
    }

    // Attach to request
    req.tenant = tenantRow;
    req.tenantId = tenantRow.id;

    // Set tenant header on response for client synchronization
    res.setHeader('X-Tenant-Id', tenantRow.id.toString());
    res.setHeader('X-Tenant-Slug', tenantRow.slug);

    next();
  } catch (error) {
    console.error('[Tenant Middleware Error]:', error);
    // Continue with default tenant to avoid breaking requests
    req.tenant = { id: 1, name: 'Eventrye Global', slug: 'default', plan: 'Enterprise' };
    req.tenantId = 1;
    next();
  }
}

/**
 * Multi-Tenant PaaS API Key Authenticator
 * Validates `x-api-key` header for developer/PaaS API requests
 */
export async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Missing API Key. Pass your secret or live key in the `x-api-key` header.'
      });
    }

    const [rows] = await query(
      'SELECT k.*, t.name as tenant_name, t.slug as tenant_slug, t.plan as tenant_plan, t.status as tenant_status FROM `tenant_api_keys` k JOIN `tenants` t ON k.tenant_id = t.id WHERE k.api_key = ? AND k.is_active = 1',
      [apiKey]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or revoked API key.'
      });
    }

    const keyRecord = rows[0];
    if (keyRecord.tenant_status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'The organization associated with this API key is currently suspended.'
      });
    }

    // Update last_used_at timestamp asynchronously
    query('UPDATE `tenant_api_keys` SET `last_used_at` = CURRENT_TIMESTAMP WHERE `id` = ?', [keyRecord.id]).catch(() => {});

    req.tenant = {
      id: keyRecord.tenant_id,
      name: keyRecord.tenant_name,
      slug: keyRecord.tenant_slug,
      plan: keyRecord.tenant_plan
    };
    req.tenantId = keyRecord.tenant_id;
    req.apiKey = keyRecord;
    req.authType = 'api_key';

    next();
  } catch (error) {
    console.error('[API Key Auth Error]:', error);
    return res.status(500).json({ success: false, error: 'Internal error during API key authentication.' });
  }
}

/**
 * Role-Based Access Control (RBAC) Checker for Tenant
 */
export function requireTenantRole(allowedRoles = ['owner', 'admin']) {
  return async (req, res, next) => {
    // Platform superadmin bypasses tenant role check
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Check if user is tenant owner
    if (req.tenant && req.tenant.owner_id === req.user.id) {
      return next();
    }

    // Check membership role
    const [memberships] = await query(
      'SELECT role FROM `tenant_members` WHERE `tenant_id` = ? AND `user_id` = ?',
      [req.tenantId, req.user.id]
    );

    if (memberships.length === 0 || !allowedRoles.includes(memberships[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have sufficient permissions in this organization to perform this action.'
      });
    }

    req.tenantRole = memberships[0].role;
    next();
  };
}

/**
 * Ensures that the tenant has been approved and activated by SuperAdmin
 */
export function requireActiveTenant(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  if (req.tenant && req.tenant.status === 'pending_approval') {
    return res.status(403).json({
      success: false,
      code: 'TENANT_PENDING_ACTIVATION',
      message: 'This organization workspace is pending SuperAdmin approval and license key activation.',
      tenantStatus: 'pending_approval'
    });
  }

  next();
}
