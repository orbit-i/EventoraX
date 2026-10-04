import express from 'express';
import { query } from '../db/db.js';

const router = express.Router();

// POST /api/contact - Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, org = '', message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    const [result] = await query(
      `INSERT INTO \`contact_messages\` (\`name\`, \`email\`, \`organization\`, \`message\`, \`status\`)
       VALUES (?, ?, ?, ?, 'new')`,
      [name.trim(), email.toLowerCase().trim(), org.trim(), message.trim()]
    );

    // Also add to activity logs
    await query(
      `INSERT INTO \`activity_logs\` (\`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, 'email', 'New contact inquiry', ?)`,
      [name, `Inquiry received from ${email}: "${message.slice(0, 60)}..."`]
    );

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received. Our team will contact you shortly.',
      id: result.insertId
    });
  } catch (error) {
    console.error('[Contact Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
});

// GET /api/contact - Retrieve inquiries (for admin)
router.get('/', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM `contact_messages` ORDER BY `created_at` DESC');
    return res.json({ success: true, messages: rows });
  } catch (error) {
    console.error('[Get Contact Messages Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
});

export default router;
