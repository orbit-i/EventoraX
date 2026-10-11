import express from 'express';
import { query } from '../db/db.js';
import { authenticateApiKey } from '../middleware/tenant.js';

const router = express.Router();

// Enforce API Key Authentication for all /api/v1 routes
router.use(authenticateApiKey);

function generateTicketCode(eventId) {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString().slice(-4);
  return `EVX-${eventId}-${rand}-${time}`;
}

// GET /api/v1/tenant - Get authenticated tenant metadata & quota status
router.get('/tenant', async (req, res) => {
  return res.json({
    success: true,
    tenant: {
      id: req.tenant.id,
      name: req.tenant.name,
      slug: req.tenant.slug,
      plan: req.tenant.plan,
      keyName: req.apiKey.name,
      permissions: req.apiKey.permissions,
    }
  });
});

// GET /api/v1/events - List tenant events
router.get('/events', async (req, res) => {
  try {
    const { category, status, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM `events` WHERE `tenant_id` = ?';
    const params = [req.tenantId];

    if (category && category !== 'All') {
      sql += ' AND `category` = ?';
      params.push(category);
    }

    if (status && status !== 'All') {
      sql += ' AND `status` = ?';
      params.push(status);
    }

    sql += ' ORDER BY `start_date` ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await query(sql, params);

    return res.json({
      success: true,
      events: rows,
      count: rows.length,
      tenantId: req.tenantId
    });
  } catch (error) {
    console.error('[PaaS v1 Events Error]:', error);
    return res.status(500).json({ success: false, error: 'Internal API error.' });
  }
});

// GET /api/v1/events/:id - Get single event
router.get('/events/:id', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT * FROM `events` WHERE `id` = ? AND `tenant_id` = ?',
      [parseInt(req.params.id, 10), req.tenantId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found in this organization.' });
    }

    return res.json({
      success: true,
      event: rows[0]
    });
  } catch (error) {
    console.error('[PaaS v1 Get Event Error]:', error);
    return res.status(500).json({ success: false, error: 'Internal API error.' });
  }
});

// POST /api/v1/events - Programmatically create event
router.post('/events', async (req, res) => {
  try {
    const {
      title,
      category = 'Conference',
      eventType = 'in-person',
      venueName = '',
      venueAddress = '',
      virtualLink = '',
      startDate,
      startTime = '09:00',
      endDate = null,
      endTime = '17:00',
      price = 0,
      capacity = 500,
      description = ''
    } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({ success: false, error: 'Both `title` and `startDate` (YYYY-MM-DD) are required.' });
    }

    const slug = `${title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [result] = await query(
      `INSERT INTO \`events\` 
       (\`tenant_id\`, \`title\`, \`slug\`, \`category\`, \`description\`, \`event_type\`, \`venue_name\`, \`venue_address\`, \`virtual_link\`, \`start_date\`, \`start_time\`, \`end_date\`, \`end_time\`, \`price\`, \`capacity\`, \`status\`, \`organizer_id\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', 1)`,
      [
        req.tenantId,
        title.trim(),
        slug,
        category,
        description,
        eventType,
        venueName,
        venueAddress,
        virtualLink,
        startDate,
        startTime,
        endDate || startDate,
        endTime,
        parseFloat(price) || 0,
        parseInt(capacity, 10) || 500
      ]
    );

    const [created] = await query('SELECT * FROM `events` WHERE `id` = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Event created via PaaS API',
      event: created[0]
    });
  } catch (error) {
    console.error('[PaaS v1 Create Event Error]:', error);
    return res.status(500).json({ success: false, error: 'Internal API error.' });
  }
});

// POST /api/v1/events/:id/attendees - Register attendee & generate ticket
router.post('/events/:id/attendees', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { name, email, phone = '', ticketType = 'General Admission' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Attendee `name` and `email` are required.' });
    }

    // Verify event belongs to tenant
    const [events] = await query(
      'SELECT id, title, capacity, registered_count FROM `events` WHERE `id` = ? AND `tenant_id` = ?',
      [eventId, req.tenantId]
    );

    if (events.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found in this organization.' });
    }

    const event = events[0];
    if (event.capacity && event.registered_count >= event.capacity) {
      return res.status(400).json({ success: false, error: 'Event is at maximum capacity.' });
    }

    const ticketCode = generateTicketCode(eventId);

    const [result] = await query(
      `INSERT INTO \`event_attendees\` (\`tenant_id\`, \`event_id\`, \`name\`, \`email\`, \`phone\`, \`ticket_code\`, \`ticket_type\`, \`status\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [req.tenantId, eventId, name.trim(), email.toLowerCase().trim(), phone, ticketCode, ticketType]
    );

    // Increment count
    await query('UPDATE `events` SET `registered_count` = `registered_count` + 1 WHERE `id` = ?', [eventId]);

    return res.status(201).json({
      success: true,
      message: 'Attendee registered and ticket generated.',
      ticket: {
        id: result.insertId,
        eventId,
        ticketCode,
        ticketType,
        attendeeName: name.trim(),
        attendeeEmail: email.toLowerCase().trim(),
        qrVerificationUrl: `https://eventorax.com/verify?code=${ticketCode}`,
        status: 'confirmed'
      }
    });
  } catch (error) {
    console.error('[PaaS v1 Register Attendee Error]:', error);
    return res.status(500).json({ success: false, error: 'Internal API error.' });
  }
});

// POST /api/v1/checkin - Verify and scan ticket QR code
router.post('/checkin', async (req, res) => {
  try {
    const { ticketCode } = req.body;

    if (!ticketCode) {
      return res.status(400).json({ success: false, error: '`ticketCode` is required.' });
    }

    const [rows] = await query(
      'SELECT a.*, e.title as event_title FROM `event_attendees` a JOIN `events` e ON a.event_id = e.id WHERE a.ticket_code = ? AND a.tenant_id = ?',
      [ticketCode.trim().toUpperCase(), req.tenantId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Invalid ticket code for this organization.'
      });
    }

    const attendee = rows[0];

    if (attendee.status === 'checked_in') {
      return res.status(200).json({
        success: true,
        valid: true,
        alreadyCheckedIn: true,
        checkedInAt: attendee.checked_in_at,
        attendee: {
          id: attendee.id,
          name: attendee.name,
          ticketCode: attendee.ticket_code,
          ticketType: attendee.ticket_type,
          eventTitle: attendee.event_title
        },
        message: 'Ticket already checked in previously.'
      });
    }

    // Mark as checked in
    await query(
      'UPDATE `event_attendees` SET `status` = "checked_in", `checked_in_at` = CURRENT_TIMESTAMP WHERE `id` = ?',
      [attendee.id]
    );

    return res.json({
      success: true,
      valid: true,
      alreadyCheckedIn: false,
      attendee: {
        id: attendee.id,
        name: attendee.name,
        ticketCode: attendee.ticket_code,
        ticketType: attendee.ticket_type,
        eventTitle: attendee.event_title
      },
      message: 'Ticket successfully verified and checked in! Access granted.'
    });
  } catch (error) {
    console.error('[PaaS v1 Checkin Error]:', error);
    return res.status(500).json({ success: false, error: 'Internal API error.' });
  }
});

// GET /api/v1/stats - Summary analytics for external dashboards
router.get('/stats', async (req, res) => {
  try {
    const [totals] = await query(
      'SELECT COUNT(*) as total_events, COALESCE(SUM(registered_count), 0) as total_attendees, COALESCE(SUM(registered_count * price), 0) as total_revenue FROM `events` WHERE `tenant_id` = ?',
      [req.tenantId]
    );

    return res.json({
      success: true,
      tenantId: req.tenantId,
      stats: {
        totalEvents: totals[0]?.total_events || 0,
        totalAttendees: totals[0]?.total_attendees || 0,
        totalRevenue: Math.round(totals[0]?.total_revenue || 0)
      }
    });
  } catch (error) {
    console.error('[PaaS v1 Stats Error]:', error);
    return res.status(500).json({ success: false, error: 'Internal API error.' });
  }
});

export default router;
