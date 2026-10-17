import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveTenant, requireTenantRole } from '../middleware/tenant.js';

const router = express.Router();

// GET /api/team - Get team members for current tenant
router.get('/', verifyToken, resolveTenant, async (req, res) => {
  try {
    const tenantId = req.tenantId || 1;
    const [rows] = await query(
      'SELECT * FROM `team_members` WHERE `tenant_id` = ? ORDER BY `created_at` DESC',
      [tenantId]
    );

    return res.json({
      success: true,
      team: rows,
      tenantId
    });
  } catch (error) {
    console.error('[Get Team Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve team members.' });
  }
});

// POST /api/team/invite - Invite / Add team member to tenant
router.post('/invite', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const { name, email, role, status = 'active' } = req.body;
    const tenantId = req.tenantId || 1;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
    }

    const initials = name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const [result] = await query(
      `INSERT INTO \`team_members\` (\`tenant_id\`, \`organizer_id\`, \`name\`, \`email\`, \`role\`, \`status\`, \`initials\`)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, req.user.id, name.trim(), email.toLowerCase().trim(), role.trim(), status, initials]
    );

    // Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'user', 'Team member invited', ?)`,
      [tenantId, req.user.id, req.user.email, `Invited ${name} (${email}) as ${role}`]
    );

    const [newMember] = await query('SELECT * FROM `team_members` WHERE `id` = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Team member added successfully!',
      member: newMember[0]
    });
  } catch (error) {
    console.error('[Invite Team Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to add team member.' });
  }
});

// DELETE /api/team/:id - Remove team member from tenant
router.delete('/:id', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const tenantId = req.tenantId || 1;

    let [rows] = await query(
      'SELECT `name`, `tenant_id` FROM `team_members` WHERE `id` = ? AND `tenant_id` = ?',
      [memberId, tenantId]
    );

    if (rows.length === 0) {
      const [anyRows] = await query('SELECT `name`, `tenant_id` FROM `team_members` WHERE `id` = ?', [memberId]);
      if (anyRows.length > 0) {
        rows = anyRows;
      }
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team member not found in this organization.' });
    }

    await query('DELETE FROM `team_members` WHERE `id` = ?', [memberId]);

    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'user', 'Team member removed', ?)`,
      [tenantId, req.user.id, req.user.email, `Removed ${rows[0].name} from organization team`]
    );

    return res.json({ success: true, message: 'Team member removed successfully.' });
  } catch (error) {
    console.error('[Delete Team Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove team member.' });
  }
});

// PUT /api/team/:id - Update team member
router.put('/:id', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const tenantId = req.tenantId || 1;
    const { name, email, role, status = 'active', phone = '', avatar_url = '' } = req.body;

    let [rows] = await query(
      'SELECT * FROM `team_members` WHERE `id` = ? AND `tenant_id` = ?',
      [memberId, tenantId]
    );

    if (rows.length === 0) {
      const [anyRows] = await query('SELECT * FROM `team_members` WHERE `id` = ?', [memberId]);
      if (anyRows.length > 0) {
        rows = anyRows;
      }
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team member not found.' });
    }

    const current = rows[0];
    const newName = name !== undefined ? name.trim() : current.name;
    const newEmail = email !== undefined ? email.toLowerCase().trim() : current.email;
    const newRole = role !== undefined ? role.trim() : current.role;
    const newStatus = status !== undefined ? status : current.status;
    const newPhone = phone !== undefined ? phone.trim() : (current.phone || '');
    const newAvatar = avatar_url !== undefined ? avatar_url : (current.avatar_url || '');

    const initials = newName
      ? newName
          .split(' ')
          .map((part) => part[0] || '')
          .filter(Boolean)
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'TM';

    try {
      await query(
        `UPDATE \`team_members\`
         SET \`name\` = ?, \`email\` = ?, \`role\` = ?, \`status\` = ?, \`phone\` = ?, \`avatar_url\` = ?, \`initials\` = ?
         WHERE \`id\` = ?`,
        [newName, newEmail, newRole, newStatus, newPhone, newAvatar, initials, memberId]
      );
    } catch {
      await query(
        `UPDATE \`team_members\`
         SET \`name\` = ?, \`email\` = ?, \`role\` = ?, \`status\` = ?, \`initials\` = ?
         WHERE \`id\` = ?`,
        [newName, newEmail, newRole, newStatus, initials, memberId]
      );
    }

    // Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'user', 'Team member updated', ?)`,
      [tenantId, req.user.id, req.user.email, `Updated team member ${newName} (${newRole})`]
    );

    const [updated] = await query('SELECT * FROM `team_members` WHERE `id` = ?', [memberId]);

    return res.json({
      success: true,
      message: 'Team member updated successfully!',
      member: updated[0]
    });
  } catch (error) {
    console.error('[Update Team Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update team member.' });
  }
});

export default router;
