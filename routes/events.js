import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import { contentPolicyGuard } from '../middleware/securityScanner.js';
import { dispatchNotification } from '../services/notificationsService.js';

const router = express.Router();

function createSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${randomSuffix}`;
}

// GET /api/events - List events (Public or Tenant-scoped)
router.get('/', resolveTenant, async (req, res) => {
  try {
    const { search, category, status, limit = 50, offset = 0, tenantOnly = 'false' } = req.query;

    let sql = 'SELECT * FROM `events` WHERE 1=1';
    const params = [];

    // If tenantOnly is requested or tenant is explicitly supplied via header
    const hasExplicitTenant = req.headers['x-tenant-id'] || req.headers['x-tenant-slug'] || tenantOnly === 'true';
    if (hasExplicitTenant && req.tenantId) {
      sql += ' AND `tenant_id` = ?';
      params.push(req.tenantId);
    }

    if (search) {
      sql += ' AND (`title` LIKE ? OR `description` LIKE ? OR `venue_name` LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category && category !== 'All') {
      sql += ' AND `category` = ?';
      params.push(category);
    }

    if (status && status !== 'All') {
      sql += ' AND `status` = ?';
      params.push(status);
    }

    sql += ' ORDER BY `start_date` ASC, `created_at` DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await query(sql, params);

    // Count
    let countSql = 'SELECT COUNT(*) as total FROM `events` WHERE 1=1';
    const countParams = [];
    if (hasExplicitTenant && req.tenantId) {
      countSql += ' AND `tenant_id` = ?';
      countParams.push(req.tenantId);
    }
    if (search) {
      countSql += ' AND (`title` LIKE ? OR `description` LIKE ? OR `venue_name` LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category && category !== 'All') {
      countSql += ' AND `category` = ?';
      countParams.push(category);
    }
    if (status && status !== 'All') {
      countSql += ' AND `status` = ?';
      countParams.push(status);
    }
    const [countRows] = await query(countSql, countParams);

    return res.json({
      success: true,
      events: rows,
      total: countRows[0]?.total || rows.length,
      tenantId: req.tenantId
    });
  } catch (error) {
    console.error('[Events List Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve events.' });
  }
});

// GET /api/events/:id - Get event by ID or slug
router.get('/:id', resolveTenant, async (req, res) => {
  try {
    const param = req.params.id;
    let sql, params;

    if (!isNaN(param)) {
      sql = 'SELECT * FROM `events` WHERE `id` = ?';
      params = [parseInt(param, 10)];
    } else {
      sql = 'SELECT * FROM `events` WHERE `slug` = ?';
      params = [param];
    }

    const [rows] = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    return res.json({ success: true, event: rows[0] });
  } catch (error) {
    console.error('[Get Event Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve event.' });
  }
});

// POST /api/events - Create new event (Protected, scoped to active tenant)
router.post('/', verifyToken, resolveTenant, contentPolicyGuard, async (req, res) => {
  try {
    const {
      title,
      category,
      eventType,
      venueName,
      venueAddress,
      virtualLink,
      startDate,
      startTime,
      endDate,
      endTime,
      price,
      capacity,
      description,
      bannerImage
    } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({ success: false, message: 'Title and Start Date are required.' });
    }

    const tenantId = req.tenantId || 1;
    const isMasterAuthority = req.user?.role === 'admin' || tenantId === 1;

    // Strict Plan Limit Enforcement (Starter: 2 events, 15 attendees max)
    if (!isMasterAuthority) {
      const [tenantRows] = await query('SELECT plan, max_events FROM `tenants` WHERE `id` = ?', [tenantId]);
      const currentPlan = tenantRows[0]?.plan || req.user?.plan || 'Starter';
      const [eventCountRows] = await query('SELECT COUNT(*) as cnt FROM `events` WHERE `tenant_id` = ?', [tenantId]);
      const currentEventsCount = eventCountRows[0]?.cnt || 0;

      const allowedEvents = currentPlan === 'Enterprise' ? 500 : currentPlan === 'Professional' ? 25 : 2;
      if (currentEventsCount >= allowedEvents) {
        return res.status(403).json({
          success: false,
          message: `Event creation limit reached: The ${currentPlan} plan permits up to ${allowedEvents} event(s). Upgrade your plan to publish more events.`
        });
      }
    }

    const effectiveCapacity = (!isMasterAuthority && (!req.tenant?.plan || req.tenant?.plan === 'Starter'))
      ? Math.min(parseInt(capacity, 10) || 15, 15)
      : (parseInt(capacity, 10) || 500);

    const slug = createSlug(title);

    const [result] = await query(
      `INSERT INTO \`events\` 
       (\`tenant_id\`, \`title\`, \`slug\`, \`category\`, \`description\`, \`event_type\`, \`venue_name\`, \`venue_address\`, \`virtual_link\`, \`start_date\`, \`start_time\`, \`end_date\`, \`end_time\`, \`price\`, \`capacity\`, \`status\`, \`banner_image\`, \`organizer_id\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, ?)`,
      [
        tenantId,
        title.trim(),
        slug,
        category || 'General',
        description || '',
        eventType || 'in-person',
        venueName || '',
        venueAddress || '',
        virtualLink || '',
        startDate,
        startTime || '09:00',
        endDate || startDate,
        endTime || '17:00',
        parseFloat(price) || 0,
        effectiveCapacity,
        bannerImage || '',
        req.user.id
      ]
    );

    // Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'event', 'Event created', ?)`,
      [tenantId, req.user.id, req.user.email, `Created event: "${title.trim()}"`]
    );

    await dispatchNotification({
      title: 'New Event Published',
      message: `Event "${title.trim()}" (${category || 'General'}) published by Tenant #${tenantId}`,
      category: 'event',
      severity: 'info',
      metadata: { eventId: result.insertId, tenantId, title: title.trim(), category }
    });

    const [newEvent] = await query('SELECT * FROM `events` WHERE `id` = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event: newEvent[0]
    });
  } catch (error) {
    console.error('[Create Event Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create event.' });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', verifyToken, resolveTenant, contentPolicyGuard, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const tenantId = req.tenantId || 1;
    const isSuperAdmin = req.user.role === 'admin';

    // Verify ownership
    let checkSql = 'SELECT * FROM `events` WHERE `id` = ?';
    let checkParams = [eventId];
    if (!isSuperAdmin) {
      checkSql += ' AND `tenant_id` = ?';
      checkParams.push(tenantId);
    }

    const [existing] = await query(checkSql, checkParams);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found or access denied.' });
    }

    const ev = existing[0];
    const {
      title = ev.title,
      category = ev.category,
      eventType = ev.event_type,
      venueName = ev.venue_name,
      venueAddress = ev.venue_address,
      virtualLink = ev.virtual_link,
      startDate = ev.start_date,
      startTime = ev.start_time,
      endDate = ev.end_date,
      endTime = ev.end_time,
      price = ev.price,
      capacity = ev.capacity,
      status = ev.status,
      description = ev.description,
      bannerImage = ev.banner_image
    } = req.body;

    await query(
      `UPDATE \`events\`
       SET \`title\` = ?, \`category\` = ?, \`event_type\` = ?, \`venue_name\` = ?, \`venue_address\` = ?, \`virtual_link\` = ?, \`start_date\` = ?, \`start_time\` = ?, \`end_date\` = ?, \`end_time\` = ?, \`price\` = ?, \`capacity\` = ?, \`status\` = ?, \`description\` = ?, \`banner_image\` = ?
       WHERE \`id\` = ?`,
      [
        title,
        category,
        eventType,
        venueName,
        venueAddress,
        virtualLink,
        startDate,
        startTime,
        endDate,
        endTime,
        parseFloat(price) || 0,
        parseInt(capacity, 10) || 500,
        status,
        description,
        bannerImage,
        eventId
      ]
    );

    const [updated] = await query('SELECT * FROM `events` WHERE `id` = ?', [eventId]);

    return res.json({
      success: true,
      message: 'Event updated successfully!',
      event: updated[0]
    });
  } catch (error) {
    console.error('[Update Event Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', verifyToken, resolveTenant, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const tenantId = req.tenantId || 1;
    const isSuperAdmin = req.user.role === 'admin';

    let checkSql = 'SELECT * FROM `events` WHERE `id` = ?';
    let checkParams = [eventId];
    if (!isSuperAdmin) {
      checkSql += ' AND `tenant_id` = ?';
      checkParams.push(tenantId);
    }

    const [existing] = await query(checkSql, checkParams);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found or access denied.' });
    }

    await query('DELETE FROM `events` WHERE `id` = ?', [eventId]);

    await query(
      `INSERT INTO \`activity_logs\` (\`tenant_id\`, \`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, ?, 'event', 'Event deleted', ?)`,
      [tenantId, req.user.id, req.user.email, `Deleted event "${existing[0].title}"`]
    );

    return res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('[Delete Event Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
});

// GET /api/events/:id/attendees - Get event attendees
router.get('/:id/attendees', verifyToken, resolveTenant, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const [attendees] = await query(
      'SELECT * FROM `event_attendees` WHERE `event_id` = ? ORDER BY `registered_at` DESC',
      [eventId]
    );

    return res.json({
      success: true,
      attendees
    });
  } catch (error) {
    console.error('[Get Attendees Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve attendees.' });
  }
});

// GET /api/events/public/:slug - Public view of single event by slug
router.get('/public/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const [rows] = await query('SELECT * FROM `events` WHERE `slug` = ?', [slug]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    const ev = rows[0];
    return res.json({
      success: true,
      event: ev
    });
  } catch (error) {
    console.error('[Public Event Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve public event.' });
  }
});

// POST /api/events/:id/register - Public event attendee registration
router.post('/:id/register', contentPolicyGuard, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { 
      name, 
      email, 
      phone = '', 
      ticketType = 'General Admission',
      organization = '',
      designation = '',
      currency = 'USD',
      paymentMethod = 'free'
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const [events] = await query('SELECT * FROM `events` WHERE `id` = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const ev = events[0];
    const ticketCode = `EVX-${eventId}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const [result] = await query(
      `INSERT INTO \`event_attendees\` (\`tenant_id\`, \`event_id\`, \`name\`, \`email\`, \`phone\`, \`ticket_code\`, \`ticket_type\`, \`status\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [ev.tenant_id || 1, eventId, name.trim(), email.toLowerCase().trim(), phone.trim(), ticketCode, ticketType]
    );

    await query('UPDATE `events` SET `registered_count` = `registered_count` + 1 WHERE `id` = ?', [eventId]);

    await dispatchNotification({
      title: 'New Attendee Registered',
      message: `${name.trim()} booked ${ticketType || 'Pass'} for "${ev.title}" (Code: ${ticketCode})`,
      category: 'attendee',
      severity: 'success',
      metadata: { eventId, attendeeId: result.insertId, name: name.trim(), ticketCode, ticketType }
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      registration: {
        id: result.insertId,
        ticketCode,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        designation: designation.trim(),
        eventTitle: ev.title,
        ticketType,
        currency,
        paymentMethod,
        event: {
          id: ev.id,
          title: ev.title,
          start_date: ev.start_date,
          start_time: ev.start_time,
          venue_name: ev.venue_name,
          venue_address: ev.venue_address,
          city: ev.city,
          country: ev.country,
          event_type: ev.event_type
        }
      }
    });
  } catch (error) {
    console.error('[Register Attendee Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process registration.' });
  }
});

// POST /api/events/check-in - QR Code scanner ticket validation
router.post('/check-in', async (req, res) => {
  try {
    const ticketCode = req.body.ticketCode || req.body.ticket_code;
    const eventId = req.body.eventId || req.body.event_id;
    if (!ticketCode) {
      return res.status(400).json({ success: false, message: 'Ticket code is required for check-in.' });
    }

    const cleanCode = String(ticketCode).trim().toUpperCase();
    let sql = 'SELECT * FROM `event_attendees` WHERE UPPER(`ticket_code`) = ?';
    let params = [cleanCode];

    if (eventId) {
      sql += ' AND `event_id` = ?';
      params.push(parseInt(eventId, 10));
    }

    const [attendees] = await query(sql, params);
    if (!attendees || attendees.length === 0) {
      return res.status(404).json({
        success: false,
        status: 'invalid',
        message: 'Invalid QR Ticket! No attendee found with this ticket code.'
      });
    }

    const attendee = attendees[0];

    // Already checked in check
    if (attendee.status === 'checked_in') {
      return res.status(200).json({
        success: false,
        status: 'already_checked_in',
        message: `Already Checked In! Pass was verified on ${attendee.checked_in_at ? new Date(attendee.checked_in_at).toLocaleTimeString() : 'earlier today'}.`,
        attendee
      });
    }

    // Mark as checked in
    await query(
      'UPDATE `event_attendees` SET `status` = ?, `checked_in_at` = ? WHERE `id` = ?',
      ['checked_in', new Date().toISOString(), attendee.id]
    );

    const [updated] = await query('SELECT * FROM `event_attendees` WHERE `id` = ?', [attendee.id]);

    return res.json({
      success: true,
      status: 'valid',
      message: `Verified! Welcome ${attendee.name} to the event.`,
      attendee: updated[0] || { ...attendee, status: 'checked_in', checked_in_at: new Date().toISOString() }
    });
  } catch (error) {
    console.error('[Check-in Error]:', error);
    return res.status(500).json({ success: false, message: 'Server error verifying ticket.' });
  }
});

// PATCH /api/events/:id/attendees/:attendeeId/check-in - Toggle manual check-in
router.patch('/:id/attendees/:attendeeId/check-in', verifyToken, resolveTenant, async (req, res) => {
  try {
    const attendeeId = parseInt(req.params.attendeeId, 10);
    const [rows] = await query('SELECT * FROM `event_attendees` WHERE `id` = ?', [attendeeId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attendee not found.' });
    }

    const current = rows[0];
    const newStatus = current.status === 'checked_in' ? 'confirmed' : 'checked_in';
    const checkedInAt = newStatus === 'checked_in' ? new Date().toISOString() : null;

    await query(
      'UPDATE `event_attendees` SET `status` = ?, `checked_in_at` = ? WHERE `id` = ?',
      [newStatus, checkedInAt, attendeeId]
    );

    const [updated] = await query('SELECT * FROM `event_attendees` WHERE `id` = ?', [attendeeId]);

    return res.json({
      success: true,
      message: newStatus === 'checked_in' ? 'Attendee checked in successfully!' : 'Attendee check-in status reverted.',
      attendee: updated[0]
    });
  } catch (error) {
    console.error('[Toggle Check-in Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update check-in status.' });
  }
});

export default router;
