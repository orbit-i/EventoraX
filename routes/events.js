import express from 'express';
import { query } from '../db/db.js';
import { verifyToken } from '../middleware/auth.js';

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

// GET /api/events - List events (Public with optional filters)
router.get('/', async (req, res) => {
  try {
    const { search, category, status, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM `events` WHERE 1=1';
    const params = [];

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

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM `events` WHERE 1=1';
    const countParams = [];
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
      total: countRows[0].total
    });
  } catch (error) {
    console.error('[Events List Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve events.' });
  }
});

// GET /api/events/:id - Get event by ID or slug
router.get('/:id', async (req, res) => {
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

// POST /api/events - Create new event (Protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      title,
      category = 'Conference',
      description = '',
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
      bannerImage = ''
    } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({ success: false, message: 'Event title and start date are required.' });
    }

    const slug = createSlug(title);

    const [result] = await query(
      `INSERT INTO \`events\` (
        \`title\`, \`slug\`, \`category\`, \`description\`, \`event_type\`,
        \`venue_name\`, \`venue_address\`, \`virtual_link\`, \`start_date\`,
        \`start_time\`, \`end_date\`, \`end_time\`, \`price\`, \`capacity\`,
        \`registered_count\`, \`status\`, \`banner_image\`, \`organizer_id\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'upcoming', ?, ?)`,
      [
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
        endDate || null,
        endTime,
        parseFloat(price) || 0,
        parseInt(capacity, 10) || 500,
        bannerImage,
        req.user.id
      ]
    );

    const eventId = result.insertId;

    // Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'event', 'Event created', ?)`,
      [req.user.id, req.user.email, `Created event "${title}" scheduled for ${startDate}`]
    );

    const [newEvent] = await query('SELECT * FROM `events` WHERE `id` = ?', [eventId]);

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

// PUT /api/events/:id - Update event (Protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const {
      title,
      category,
      description,
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
      status,
      bannerImage
    } = req.body;

    const [existing] = await query('SELECT * FROM `events` WHERE `id` = ?', [eventId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    await query(
      `UPDATE \`events\` SET
        \`title\` = COALESCE(?, \`title\`),
        \`category\` = COALESCE(?, \`category\`),
        \`description\` = COALESCE(?, \`description\`),
        \`event_type\` = COALESCE(?, \`event_type\`),
        \`venue_name\` = COALESCE(?, \`venue_name\`),
        \`venue_address\` = COALESCE(?, \`venue_address\`),
        \`virtual_link\` = COALESCE(?, \`virtual_link\`),
        \`start_date\` = COALESCE(?, \`start_date\`),
        \`start_time\` = COALESCE(?, \`start_time\`),
        \`end_date\` = COALESCE(?, \`end_date\`),
        \`end_time\` = COALESCE(?, \`end_time\`),
        \`price\` = COALESCE(?, \`price\`),
        \`capacity\` = COALESCE(?, \`capacity\`),
        \`status\` = COALESCE(?, \`status\`),
        \`banner_image\` = COALESCE(?, \`banner_image\`)
       WHERE \`id\` = ?`,
      [
        title,
        category,
        description,
        eventType,
        venueName,
        venueAddress,
        virtualLink,
        startDate,
        startTime,
        endDate,
        endTime,
        price !== undefined ? parseFloat(price) : null,
        capacity !== undefined ? parseInt(capacity, 10) : null,
        status,
        bannerImage,
        eventId
      ]
    );

    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'event', 'Event updated', ?)`,
      [req.user.id, req.user.email, `Updated event #${eventId} details`]
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

// DELETE /api/events/:id - Delete event (Protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const [existing] = await query('SELECT `title` FROM `events` WHERE `id` = ?', [eventId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    await query('DELETE FROM `events` WHERE `id` = ?', [eventId]);

    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'event', 'Event deleted', ?)`,
      [req.user.id, req.user.email, `Deleted event "${existing[0].title}"`]
    );

    return res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('[Delete Event Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
});

// POST /api/events/:id/register - Register attendee / Buy ticket
router.post('/:id/register', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const { name, email, phone = '', ticketType = 'General Admission', userId = null } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Attendee name and email are required.' });
    }

    const [events] = await query('SELECT * FROM `events` WHERE `id` = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = events[0];
    if (event.registered_count >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is fully booked! No more tickets available.' });
    }

    // Generate unique ticket code
    const ticketCode = `EVX-${eventId}-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const [result] = await query(
      `INSERT INTO \`event_attendees\` (\`event_id\`, \`user_id\`, \`name\`, \`email\`, \`phone\`, \`ticket_code\`, \`ticket_type\`, \`status\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [eventId, userId, name.trim(), email.toLowerCase().trim(), phone.trim(), ticketCode, ticketType]
    );

    // Update event registered count
    await query('UPDATE `events` SET `registered_count` = `registered_count` + 1 WHERE `id` = ?', [eventId]);

    // Log activity
    await query(
      `INSERT INTO \`activity_logs\` (\`user_id\`, \`user_name\`, \`type\`, \`action\`, \`detail\`)
       VALUES (?, ?, 'event', 'Attendee registered', ?)`,
      [userId, name, `Registered for event "${event.title}" (Ticket: ${ticketCode})`]
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Your digital ticket has been confirmed.',
      registration: {
        id: result.insertId,
        eventId,
        eventTitle: event.title,
        attendeeName: name,
        attendeeEmail: email,
        ticketCode,
        ticketType,
        status: 'confirmed'
      }
    });
  } catch (error) {
    console.error('[Event Registration Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process event registration.' });
  }
});

// GET /api/events/:id/attendees - View event attendees (Protected)
router.get('/:id/attendees', verifyToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const [attendees] = await query(
      'SELECT * FROM `event_attendees` WHERE `event_id` = ? ORDER BY `registered_at` DESC',
      [eventId]
    );

    return res.json({ success: true, attendees });
  } catch (error) {
    console.error('[Get Attendees Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve attendees.' });
  }
});

export default router;
