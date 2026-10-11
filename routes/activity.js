import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';

const router = express.Router();

// GET /api/activity - Get activity logs for current tenant
router.get('/', verifyToken, resolveTenant, async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    const tenantId = req.tenantId || 1;

    let sql = 'SELECT * FROM `activity_logs` WHERE `tenant_id` = ?';
    const params = [tenantId];

    if (type && type !== 'All') {
      sql += ' AND `type` = ?';
      params.push(type.toLowerCase());
    }

    sql += ' ORDER BY `created_at` DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const [rows] = await query(sql, params);
    return res.json({ success: true, activities: rows });
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
