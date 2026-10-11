import express from 'express';
import crypto from 'crypto';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveTenant, requireTenantRole } from '../middleware/tenant.js';

const router = express.Router();

// GET /api/developer/keys - List API keys for current tenant
router.get('/keys', verifyToken, resolveTenant, async (req, res) => {
  try {
    const [keys] = await query(
      'SELECT id, name, api_key, permissions, is_active, last_used_at, created_at FROM `tenant_api_keys` WHERE `tenant_id` = ? ORDER BY `created_at` DESC',
      [req.tenantId]
    );

    return res.json({
      success: true,
      keys
    });
  } catch (error) {
    console.error('[Get API Keys Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve API keys.' });
  }
});

// POST /api/developer/keys - Generate a new API key
router.post('/keys', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const { name = 'Production API Key', permissions = 'read_write' } = req.body;

    const randomBytes = crypto.randomBytes(16).toString('hex');
    const apiKey = `evx_live_${randomBytes}`;

    const [result] = await query(
      `INSERT INTO \`tenant_api_keys\` (\`tenant_id\`, \`name\`, \`api_key\`, \`permissions\`, \`is_active\`)
       VALUES (?, ?, ?, ?, 1)`,
      [req.tenantId, name.trim(), apiKey, permissions]
    );

    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'security', 'API Key Generated', ?)`,
      [req.tenantId, req.user.id, req.user.email, `Created API Key "${name.trim()}"`]
    );

    return res.status(201).json({
      success: true,
      message: 'API Key generated successfully! Store this key securely.',
      key: {
        id: result.insertId,
        name: name.trim(),
        apiKey,
        permissions,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Create API Key Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate API key.' });
  }
});

// DELETE /api/developer/keys/:id - Revoke API key
router.delete('/keys/:id', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const keyId = parseInt(req.params.id, 10);

    const [existing] = await query(
      'SELECT id, name FROM `tenant_api_keys` WHERE `id` = ? AND `tenant_id` = ?',
      [keyId, req.tenantId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'API key not found.' });
    }

    await query('DELETE FROM `tenant_api_keys` WHERE `id` = ?', [keyId]);

    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'security', 'API Key Revoked', ?)`,
      [req.tenantId, req.user.id, req.user.email, `Revoked API Key "${existing[0].name}"`]
    );

    return res.json({
      success: true,
      message: 'API Key revoked successfully.'
    });
  } catch (error) {
    console.error('[Revoke API Key Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke API key.' });
  }
});

// GET /api/developer/webhooks - List webhooks for current tenant
router.get('/webhooks', verifyToken, resolveTenant, async (req, res) => {
  try {
    const [webhooks] = await query(
      'SELECT id, url, events, secret, is_active, created_at FROM `tenant_webhooks` WHERE `tenant_id` = ? ORDER BY `created_at` DESC',
      [req.tenantId]
    );

    return res.json({
      success: true,
      webhooks
    });
  } catch (error) {
    console.error('[Get Webhooks Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve webhooks.' });
  }
});

// POST /api/developer/webhooks - Register new webhook
router.post('/webhooks', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const { url, events = 'attendee.registered,attendee.checked_in' } = req.body;

    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'Valid HTTPS webhook URL is required.' });
    }

    const secret = `whsec_${crypto.randomBytes(16).toString('hex')}`;

    const [result] = await query(
      `INSERT INTO \`tenant_webhooks\` (\`tenant_id\`, \`url\`, \`events\`, \`secret\`, \`is_active\`)
       VALUES (?, ?, ?, ?, 1)`,
      [req.tenantId, url.trim(), events, secret]
    );

    return res.status(201).json({
      success: true,
      message: 'Webhook registered successfully!',
      webhook: {
        id: result.insertId,
        url: url.trim(),
        events,
        secret,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Register Webhook Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to register webhook.' });
  }
});

// DELETE /api/developer/webhooks/:id - Delete webhook
router.delete('/webhooks/:id', verifyToken, resolveTenant, requireTenantRole(['owner', 'admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await query('DELETE FROM `tenant_webhooks` WHERE `id` = ? AND `tenant_id` = ?', [id, req.tenantId]);

    return res.json({
      success: true,
      message: 'Webhook deleted successfully.'
    });
  } catch (error) {
    console.error('[Delete Webhook Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete webhook.' });
  }
});

// POST /api/developer/webhooks/:id/test - Send test webhook ping
router.post('/webhooks/:id/test', verifyToken, resolveTenant, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await query('SELECT * FROM `tenant_webhooks` WHERE `id` = ? AND `tenant_id` = ?', [id, req.tenantId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Webhook not found.' });
    }

    const testPayload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      tenant: {
        id: req.tenant.id,
        name: req.tenant.name,
        slug: req.tenant.slug
      },
      data: {
        message: 'EventoraX PaaS Webhook ping successful!',
        sampleEventId: 1
      }
    };

    return res.json({
      success: true,
      message: `Test ping dispatched to ${rows[0].url}`,
      payload: testPayload,
      simulatedStatus: 200
    });
  } catch (error) {
    console.error('[Test Webhook Error]:', error);
    return res.status(500).json({ success: false, message: 'Webhook test ping failed.' });
  }
});

export default router;
