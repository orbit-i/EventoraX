import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';

const router = express.Router();

// GET /api/activity - Get activity logs for current tenant
// Strictly isolates client organizations from SuperAdmin actions & identities
router.get('/', verifyToken, resolveTenant, async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    const tenantId = req.tenantId || 1;
    const isSuperAdmin = req.user?.role === 'admin' && tenantId === 1;

    let sql = 'SELECT * FROM `activity_logs` WHERE `tenant_id` = ?';
    const params = [tenantId];

    if (!isSuperAdmin) {
      // Client Organizations must NEVER see SuperAdmin or Master Authority activities
      sql += ' AND (`user_id` != 1 AND `user_name` NOT LIKE ? AND `user_name` NOT LIKE ? AND `type` NOT IN (?, ?, ?))';
      params.push('%superadmin%', '%master%', 'superadmin', 'platform', 'security_master');
    }

    if (type && type !== 'All') {
      sql += ' AND `type` = ?';
      params.push(type.toLowerCase());
    }

    sql += ' ORDER BY `created_at` DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const [rows] = await query(sql, params);

    // Filter and sanitize rows in memory as double-layer security guarantee
    const sanitized = (rows || []).filter(r => {
      if (isSuperAdmin) return true;
      if (r.user_id === 1) return false;
      const uname = String(r.user_name || '').toLowerCase();
      if (uname.includes('superadmin') || uname.includes('master authority') || uname.includes('platform architect') || uname.includes('orbit-i admin')) {
        return false;
      }
      const atype = String(r.type || '').toLowerCase();
      if (atype === 'superadmin' || atype === 'platform' || atype === 'security_master') {
        return false;
      }
      return true;
    }).map(r => {
      if (!isSuperAdmin) {
        // Obfuscate raw email to keep team member privacy clean
        if (r.user_name && r.user_name.includes('@')) {
          const parts = r.user_name.split('@');
          return {
            ...r,
            user_name: parts[0] ? parts[0] : 'Team Member'
          };
        }
      }
      return r;
    });

    return res.json({ success: true, activities: sanitized });
  } catch (error) {
    console.error('[Get Activity Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve activity logs.' });
  }
});

// POST /api/activity - Add custom activity
router.post('/', verifyToken, resolveTenant, async (req, res) => {
  try {
    const { type, action, detail } = req.body;
    const tenantId = req.tenantId || 1;

    if (!type || !action || !detail) {
      return res.status(400).json({ success: false, message: 'Type, action, and detail are required.' });
    }

    const [result] = await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, req.user.id, req.user.email, type, action, detail]
    );

    return res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('[Create Activity Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create activity log.' });
  }
});

export default router;
