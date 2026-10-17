import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/db.js';
import { generateToken, verifyToken } from '../middleware/auth.js';
import { dispatchNotification } from '../services/notificationsService.js';

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

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, orgName, email, password, phone } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check if email already registered
    const [existing] = await query('SELECT id FROM `users` WHERE `email` = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await query(
      `INSERT INTO \`users\` (\`full_name\`, \`org_name\`, \`email\`, \`password\`, \`phone\`, \`role\`, \`plan\`)
       VALUES (?, ?, ?, ?, ?, 'organizer', 'Starter')`,
      [fullName.trim(), orgName ? orgName.trim() : '', email.toLowerCase().trim(), hashedPassword, phone ? phone.trim() : '']
    );

    const userId = result.insertId;

    // 1. Create Dedicated Multi-Tenant Organization for the User
    const workspaceName = orgName && orgName.trim().length > 0 ? orgName.trim() : `${fullName.trim()}'s Workspace`;
    let tenantSlug = slugify(workspaceName);
    if (!tenantSlug) tenantSlug = `tenant-${userId}`;
    tenantSlug = `${tenantSlug}-${Math.floor(100 + Math.random() * 900)}`;

    const [tenantResult] = await query(
      `INSERT INTO \`tenants\` (\`name\`, \`slug\`, \`custom_domain\`, \`logo_url\`, \`primary_color\`, \`secondary_color\`, \`owner_id\`, \`plan\`, \`status\`, \`license_status\`)
       VALUES (?, ?, '', '', '#7c3aed', '#6d28d9', ?, 'Starter', 'pending_approval', 'pending')`,
      [workspaceName, tenantSlug, userId]
    );
    const tenantId = tenantResult.insertId;

    // 2. Assign User as Owner in tenant_members
    await query(
      `INSERT INTO \`tenant_members\` (\`tenant_id\`, \`user_id\`, \`role\`, \`status\`)
       VALUES (?, ?, 'owner', 'active')`,
      [tenantId, userId]
    );

    // 3. Generate initial PaaS API key for developer access
    const apiKey = `evx_live_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    await query(
      `INSERT INTO \`tenant_api_keys\` (\`tenant_id\`, \`name\`, \`api_key\`, \`permissions\`, \`is_active\`)
       VALUES (?, 'Default API Key', ?, 'read_write', 1)`,
      [tenantId, apiKey]
    );

    // 4. Create default subscription for this tenant in pending_approval state
    const regTrx = `REG-${Date.now().toString(36).toUpperCase()}`;
    await query(
      `INSERT INTO \`subscriptions\` (\`tenant_id\`, \`user_id\`, \`plan\`, \`price\`, \`billing_cycle\`, \`attendees_limit\`, \`status\`, \`payment_method\`, \`transaction_ref\`)
       VALUES (?, ?, 'Starter', 0.00, 'monthly', 500, 'pending_approval', 'starter_tier', ?)`,
      [tenantId, userId, regTrx]
    );

    // 5. Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'user', 'Account & Organization created', 'Registered new organizer tenant - pending SuperAdmin approval')`,
      [tenantId, userId, fullName]
    );

    await dispatchNotification({
      title: 'New Client Organization Awaiting Plan Approval',
      message: `${workspaceName} registered by ${fullName.trim()} (${email.toLowerCase().trim()}). Awaiting SuperAdmin license activation.`,
      category: 'tenant',
      severity: 'warning',
      metadata: { tenantId, userId, workspaceName, email: email.toLowerCase().trim(), transactionRef: regTrx }
    });

    const user = {
      id: userId,
      fullName: fullName.trim(),
      orgName: orgName || '',
      email: email.toLowerCase().trim(),
      phone: phone || '',
      role: 'organizer',
      plan: 'Starter'
    };

    const activeTenant = {
      id: tenantId,
      name: workspaceName,
      slug: tenantSlug,
      plan: 'Starter',
      status: 'pending_approval',
      license_status: 'pending',
      license_key: null,
      userRole: 'owner'
    };

    const token = generateToken({ id: user.id, email: user.email, role: user.role, tenantId });

    return res.status(201).json({
      success: true,
      message: 'Account registered! Your organization workspace is pending SuperAdmin approval & license activation.',
      token,
      user,
      tenant: activeTenant,
      tenants: [activeTenant],
      orderRef: regTrx
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again later.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const [rows] = await query('SELECT * FROM `users` WHERE `email` = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userRow = rows[0];
    const isMatch = await bcrypt.compare(password, userRow.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // STRICT ISOLATION: SuperAdmin (ORBIT-I) CANNOT log in through public client portal!
    if (userRow.role === 'admin') {
      return res.status(403).json({
        success: false,
        code: 'SUPERADMIN_PORTAL_REQUIRED',
        message: 'Platform SuperAdmin (ORBIT-I) authentication must be performed exclusively via the private Master Gateway URL.'
      });
    }

    // Get user's tenants
    let userTenants = [];
    const [myTenants] = await query(
      `SELECT t.*, tm.role as user_role 
       FROM \`tenants\` t 
       LEFT JOIN \`tenant_members\` tm ON t.id = tm.tenant_id 
       WHERE t.owner_id = ? OR tm.user_id = ? 
       GROUP BY t.id`,
      [userRow.id, userRow.id]
    );
    userTenants = (myTenants || []).filter(t => t.id !== 1 && t.slug !== 'eventrye-hq');

    let activeTenant = userTenants[0];
    if (!activeTenant) {
      if (userRow.role === 'admin') {
        const [hq] = await query('SELECT * FROM `tenants` WHERE `id` = 1');
        activeTenant = hq[0] || { id: 1, name: 'Eventrye HQ', slug: 'eventrye-hq', plan: 'Enterprise' };
      } else {
        const workspaceName = userRow.org_name || `${userRow.full_name}'s Workspace`;
        let tenantSlug = slugify(workspaceName) || `client-${userRow.id}`;
        tenantSlug = `${tenantSlug}-${Math.floor(100 + Math.random() * 900)}`;

        const [tResult] = await query(
          'INSERT INTO `tenants` (`name`, `slug`, `owner_id`, `plan`, `status`, `primary_color`, `secondary_color`) VALUES (?, ?, ?, "Starter", "active", "#7c3aed", "#6d28d9")',
          [workspaceName, tenantSlug, userRow.id]
        );
        const newId = tResult.insertId;
        await query(
          'INSERT INTO `tenant_members` (`tenant_id`, `user_id`, `role`, `status`) VALUES (?, ?, "owner", "active")',
          [newId, userRow.id]
        );
        const [newT] = await query('SELECT * FROM `tenants` WHERE `id` = ?', [newId]);
        activeTenant = newT[0];
        userTenants = [activeTenant];
      }
    }

    // Log login activity
    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'login', 'User logged in', ?)`,
      [activeTenant.id, userRow.id, userRow.full_name, `Successful login from ${req.ip || 'web client'}`]
    );

    const user = {
      id: userRow.id,
      fullName: userRow.full_name,
      orgName: userRow.org_name,
      email: userRow.email,
      phone: userRow.phone,
      role: userRow.role,
      avatarUrl: userRow.avatar_url || '',
      bio: userRow.bio,
      timezone: userRow.timezone,
      language: userRow.language,
      notificationsEnabled: !!userRow.notifications_enabled,
      marketingEmailsEnabled: !!userRow.marketing_emails_enabled,
      twoFactorEnabled: !!userRow.two_factor_enabled,
      plan: userRow.plan
    };

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: activeTenant.id
    });

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user,
      tenant: activeTenant,
      tenants: userTenants
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error during login. Please try again later.' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM `users` WHERE `id` = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userRow = rows[0];

    // Fetch user tenants
    let userTenants = [];
    if (userRow.role === 'admin') {
      const [allTenants] = await query('SELECT * FROM `tenants` ORDER BY `created_at` ASC');
      userTenants = allTenants;
    } else {
      const [myTenants] = await query(
        `SELECT t.*, tm.role as user_role 
         FROM \`tenants\` t 
         LEFT JOIN \`tenant_members\` tm ON t.id = tm.tenant_id 
         WHERE t.owner_id = ? OR tm.user_id = ? 
         GROUP BY t.id`,
        [userRow.id, userRow.id]
      );
      // Strict isolation: Client organizations can NEVER hold tenant #1 (Eventrye HQ)
      userTenants = (myTenants || []).filter(t => t.id !== 1 && t.slug !== 'eventrye-hq');
    }

    let activeTenant = userTenants[0];
    if (!activeTenant) {
      if (userRow.role === 'admin') {
        const [hq] = await query('SELECT * FROM `tenants` WHERE `id` = 1');
        activeTenant = hq[0] || { id: 1, name: 'Eventrye HQ', slug: 'eventrye-hq', plan: 'Platform Authority' };
        userTenants = [activeTenant];
      } else {
        const workspaceName = userRow.org_name || `${userRow.full_name}'s Workspace`;
        let tenantSlug = slugify(workspaceName) || `client-${userRow.id}`;
        tenantSlug = `${tenantSlug}-${Math.floor(100 + Math.random() * 900)}`;

        const [tResult] = await query(
          'INSERT INTO `tenants` (`name`, `slug`, `owner_id`, `plan`, `status`, `primary_color`, `secondary_color`) VALUES (?, ?, ?, "Starter", "active", "#7c3aed", "#6d28d9")',
          [workspaceName, tenantSlug, userRow.id]
        );
        const newId = tResult.insertId;
        const [newT] = await query('SELECT * FROM `tenants` WHERE `id` = ?', [newId]);
        activeTenant = newT[0];
        userTenants = [activeTenant];
      }
    }

    const user = {
      id: userRow.id,
      fullName: userRow.full_name,
      orgName: userRow.org_name,
      email: userRow.email,
      phone: userRow.phone,
      role: userRow.role,
      avatarUrl: userRow.avatar_url || '',
      bio: userRow.bio,
      timezone: userRow.timezone,
      language: userRow.language,
      notificationsEnabled: !!userRow.notifications_enabled,
      marketingEmailsEnabled: !!userRow.marketing_emails_enabled,
      twoFactorEnabled: !!userRow.two_factor_enabled,
      plan: userRow.plan
    };

    return res.json({
      success: true,
      user,
      tenant: activeTenant,
      tenants: userTenants
    });
  } catch (error) {
    console.error('[Auth Me Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
});

// PUT /api/users/profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { fullName, orgName, phone, bio, avatarUrl, avatar_url, timezone, language, notificationsEnabled, marketingEmailsEnabled, twoFactorEnabled } = req.body;
    const finalAvatar = avatarUrl !== undefined ? avatarUrl : (avatar_url !== undefined ? avatar_url : null);

    await query(
      `UPDATE \`users\`
       SET \`full_name\` = COALESCE(?, \`full_name\`),
           \`org_name\` = COALESCE(?, \`org_name\`),
           \`phone\` = COALESCE(?, \`phone\`),
           \`bio\` = COALESCE(?, \`bio\`),
           \`avatar_url\` = COALESCE(?, \`avatar_url\`),
           \`timezone\` = COALESCE(?, \`timezone\`),
           \`language\` = COALESCE(?, \`language\`),
           \`notifications_enabled\` = COALESCE(?, \`notifications_enabled\`),
           \`marketing_emails_enabled\` = COALESCE(?, \`marketing_emails_enabled\`),
           \`two_factor_enabled\` = COALESCE(?, \`two_factor_enabled\`)
       WHERE \`id\` = ?`,
      [
        fullName, orgName, phone, bio, finalAvatar, timezone, language,
        notificationsEnabled !== undefined ? (notificationsEnabled ? 1 : 0) : null,
        marketingEmailsEnabled !== undefined ? (marketingEmailsEnabled ? 1 : 0) : null,
        twoFactorEnabled !== undefined ? (twoFactorEnabled ? 1 : 0) : null,
        req.user.id
      ]
    );

    // If orgName updated, update tenant name as well
    if (orgName) {
      await query('UPDATE `tenants` SET `name` = ? WHERE `owner_id` = ? LIMIT 1', [orgName.trim(), req.user.id]);
    }

    const [rows] = await query('SELECT * FROM `users` WHERE `id` = ?', [req.user.id]);
    const u = rows[0];

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: u.id,
        fullName: u.full_name,
        orgName: u.org_name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatarUrl: u.avatar_url || finalAvatar || '',
        bio: u.bio,
        timezone: u.timezone,
        language: u.language,
        notificationsEnabled: !!u.notifications_enabled,
        marketingEmailsEnabled: !!u.marketing_emails_enabled,
        twoFactorEnabled: !!u.two_factor_enabled,
        plan: u.plan
      }
    });
  } catch (error) {
    console.error('[Profile Update Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// PUT /api/users/change-password
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new password.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const [rows] = await query('SELECT `password`, `full_name` FROM `users` WHERE `id` = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await query('UPDATE `users` SET `password` = ? WHERE `id` = ?', [hashedPassword, req.user.id]);

    return res.json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    console.error('[Change Password Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

export default router;
