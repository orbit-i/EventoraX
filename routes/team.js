import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/team - Get team members
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM `team_members` ORDER BY `created_at` DESC');
    return res.json({ success: true, team: rows });
  } catch (error) {
    console.error('[Get Team Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve team members.' });
  }
});

// POST /api/team/invite - Invite / Add team member
router.post('/invite', verifyToken, async (req, res) => {
  try {
    const { name, email, role, status = 'active' } = req.body;

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
      `INSERT INTO \`team_members\` (\`organizer_id\`, \`name\`, \`email\`, \`role\`, \`status\`, \`initials\`)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, name.trim(), email.toLowerCase().trim(), role.trim(), status, initials]
    );

    // Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'user', 'Team member invited', ?)`,
      [req.user.id, req.user.email, `Invited ${name} (${email}) as ${role}`]
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

// DELETE /api/team/:id - Remove team member
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const [rows] = await query('SELECT `name` FROM `team_members` WHERE `id` = ?', [memberId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team member not found.' });
    }

    await query('DELETE FROM `team_members` WHERE `id` = ?', [memberId]);

    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'user', 'Team member removed', ?)`,
      [req.user.id, req.user.email, `Removed ${rows[0].name} from team`]
    );

    return res.json({ success: true, message: 'Team member removed successfully.' });
  } catch (error) {
    console.error('[Delete Team Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove team member.' });
  }
});

export default router;
