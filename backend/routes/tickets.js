// routes/tickets.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { generateQrCodeBuffer } = require('../utils/qrCode');
const { saveTicket, readAll, findByTicketCode, updateTicket } = require('../data/ticketsDb');
const archiver = require('archiver');

const router = express.Router();
const QR_DIR = path.join(__dirname, '..', 'uploads', 'tickets');
fs.mkdirSync(QR_DIR, { recursive: true });

// POST /api/v1/tickets/generate
// Matches the exact contract sent to Hasan: he calls this right after
// creating a registration, with these 4 fields.
router.post('/generate', async (req, res) => {
  try {
    const { registrationId, eventId, attendeeName, attendeeEmail } = req.body;

    if (!registrationId || !eventId || !attendeeName || !attendeeEmail) {
      return res.status(400).json({
        data: null,
        error: { code: 'BAD_REQUEST', message: 'registrationId, eventId, attendeeName, and attendeeEmail are required' },
      });
    }

    const ticketId = uuidv4();
    // A short code encoded INTO the QR image — this is what scanning reveals.
    const ticketCode = `TKT-${ticketId.slice(0, 8).toUpperCase()}`;

    const qrBuffer = await generateQrCodeBuffer(ticketCode);
    const qrFilePath = path.join(QR_DIR, `${ticketId}.png`);
    fs.writeFileSync(qrFilePath, qrBuffer);

    const record = {
      id: ticketId,
      ticketCode,
      registrationId,
      eventId,
      attendeeName,
      attendeeEmail,
      used: false,
      usedAt: null,
      qrCodeUrl: `/uploads/tickets/${ticketId}.png`,
      createdAt: new Date().toISOString(),
    };
    saveTicket(record);

    // Matches the {data, error} envelope used across your team's APIs.
    return res.status(201).json({
      data: { ticketId: record.id, qrCodeUrl: record.qrCodeUrl },
      error: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate ticket' } });
  }
});

// GET /api/v1/tickets/scan/:ticketCode
// Used by the QR scanner page at event entrances — looks up a ticket
// by the code encoded in its QR image, without marking it used yet.
router.get('/scan/:ticketCode', (req, res) => {
  try {
    const ticket = findByTicketCode(req.params.ticketCode);
    if (!ticket) {
      return res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }
    return res.json({ data: ticket, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to scan ticket' } });
  }
});

// PATCH /api/v1/tickets/:id/use
// Marks a ticket as used, once scanning confirms it's valid.
router.patch('/:id/use', (req, res) => {
  try {
    const ticket = readAll().find((t) => t.id === req.params.id);
    if (!ticket) {
      return res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }
    if (ticket.used) {
      return res.status(409).json({ data: null, error: { code: 'ALREADY_USED', message: 'This ticket has already been used' } });
    }
    const updated = updateTicket(req.params.id, { used: true, usedAt: new Date().toISOString() });
    return res.json({ data: updated, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to mark ticket used' } });
  }
});

// POST /api/v1/tickets/:id/send
// PLACEHOLDER: logs to console instead of sending a real email —
// same pattern as certificate email, swap for nodemailer later.
router.post('/:id/send', (req, res) => {
  try {
    const ticket = readAll().find((t) => t.id === req.params.id);
    if (!ticket) {
      return res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    console.log(`📧 [PLACEHOLDER EMAIL] To: ${ticket.attendeeEmail}`);
    console.log(`   Subject: Your event ticket — ${ticket.ticketCode}`);
    console.log(`   QR code: ${ticket.qrCodeUrl}`);

    return res.json({ data: { sent: true, to: ticket.attendeeEmail }, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to send ticket' } });
  }
});

// GET /api/v1/tickets/bulk-download?eventId=X
// Streams a ZIP file containing every ticket's QR code image for one event.
router.get('/bulk-download', (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ data: null, error: { code: 'BAD_REQUEST', message: 'eventId query param is required' } });
    }

    const tickets = readAll().filter((t) => t.eventId === eventId);
    if (tickets.length === 0) {
      return res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'No tickets found for this event' } });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="tickets-${eventId}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      console.error(err);
      res.status(500).end();
    });
    archive.pipe(res);

    for (const ticket of tickets) {
      const qrFilePath = path.join(__dirname, '..', 'uploads', 'tickets', `${ticket.id}.png`);
      if (fs.existsSync(qrFilePath)) {
        const safeName = ticket.attendeeName.replace(/\s+/g, '_');
        archive.file(qrFilePath, { name: `${safeName}_${ticket.ticketCode}.png` });
      }
    }

    archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to create ZIP' } });
  }
});


module.exports = router;
