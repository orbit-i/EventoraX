import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/db.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, orgName, email, password, phone } = req.body;

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

    // Create default subscription
    await query(
      `INSERT INTO \`subscriptions\` (\`user_id\`, \`plan\`, \`price\`, \`billing_cycle\`, \`attendees_limit\`, \`status\`)
       VALUES (?, 'Starter', 0.00, 'monthly', 500, 'active')`,
      [userId]
    );

    // Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'user', 'Account created', 'Registered new organizer account')`,
      [userId, fullName]
    );

    const user = {
      id: userId,
      fullName: fullName.trim(),
      orgName: orgName || '',
      email: email.toLowerCase().trim(),
      phone: phone || '',
      role: 'organizer',
      plan: 'Starter'
    };

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again later.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

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

    // Log login activity
    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'login', 'User logged in', ?)`,
      [userRow.id, userRow.full_name, `Successful login from ${req.ip || 'web client'}`]
    );

    const user = {
      id: userRow.id,
      fullName: userRow.full_name,
      orgName: userRow.org_name,
      email: userRow.email,
      phone: userRow.phone,
      role: userRow.role,
      bio: userRow.bio,
      timezone: userRow.timezone,
      language: userRow.language,
      notificationsEnabled: !!userRow.notifications_enabled,
      marketingEmailsEnabled: !!userRow.marketing_emails_enabled,
      twoFactorEnabled: !!userRow.two_factor_enabled,
      plan: userRow.plan
    };

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user
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
    const user = {
      id: userRow.id,
      fullName: userRow.full_name,
      orgName: userRow.org_name,
      email: userRow.email,
      phone: userRow.phone,
      role: userRow.role,
      bio: userRow.bio,
      timezone: userRow.timezone,
      language: userRow.language,
      notificationsEnabled: !!userRow.notifications_enabled,
      marketingEmailsEnabled: !!userRow.marketing_emails_enabled,
      twoFactorEnabled: !!userRow.two_factor_enabled,
      plan: userRow.plan
    };

    return res.json({ success: true, user });
  } catch (error) {
    console.error('[Auth Me Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
});

// PUT /api/users/profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { fullName, orgName, phone, bio, timezone, language, notificationsEnabled, marketingEmailsEnabled, twoFactorEnabled } = req.body;

    await query(
      `UPDATE \`users\`
       SET \`full_name\` = COALESCE(?, \`full_name\`),
           \`org_name\` = COALESCE(?, \`org_name\`),
           \`phone\` = COALESCE(?, \`phone\`),
           \`bio\` = COALESCE(?, \`bio\`),
           \`timezone\` = COALESCE(?, \`timezone\`),
           \`language\` = COALESCE(?, \`language\`),
           \`notifications_enabled\` = COALESCE(?, \`notifications_enabled\`),
           \`marketing_emails_enabled\` = COALESCE(?, \`marketing_emails_enabled\`),
           \`two_factor_enabled\` = COALESCE(?, \`two_factor_enabled\`)
       WHERE \`id\` = ?`,
      [
        fullName, orgName, phone, bio, timezone, language,
        notificationsEnabled !== undefined ? (notificationsEnabled ? 1 : 0) : null,
        marketingEmailsEnabled !== undefined ? (marketingEmailsEnabled ? 1 : 0) : null,
        twoFactorEnabled !== undefined ? (twoFactorEnabled ? 1 : 0) : null,
        req.user.id
      ]
    );

    // Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'settings', 'Profile updated', 'Updated profile information and preferences')`,
      [req.user.id, fullName || 'User']
    );

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

    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'security', 'Password changed', 'Successfully changed account password')`,
      [req.user.id, rows[0].full_name]
    );

    return res.json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    console.error('[Change Password Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

export default router;
