// routes/analytics.js
const express = require('express');
const PDFDocument = require('pdfkit');

const { getAllRegistrations } = require('../data/mockRegistrations');
const { getAllEvents } = require('../data/mockEvents');
const { readAll: readAllCertificates } = require('../data/certificatesDb');

const router = express.Router();

// GET /api/v1/analytics/overview
router.get('/overview', (req, res) => {
  try {
    const events = getAllEvents();
    const registrations = getAllRegistrations();
    const certificates = readAllCertificates();
    const attendedCount = registrations.filter((r) => r.status === 'ATTENDED').length;

    return res.json({
      data: {
        totalEvents: events.length,
        totalRegistrations: registrations.length,
        totalCertificates: certificates.length,
        totalAttended: attendedCount,
      },
      error: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to load overview' } });
  }
});

// GET /api/v1/analytics/monthly-registrations
router.get('/monthly-registrations', (req, res) => {
  try {
    const registrations = getAllRegistrations();
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, count: 0 });
    }

    for (const reg of registrations) {
      const d = new Date(reg.registrationDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.count += 1;
    }

    return res.json({ data: months, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to load monthly data' } });
  }
});

// GET /api/v1/analytics/events-by-status
router.get('/events-by-status', (req, res) => {
  try {
    const events = getAllEvents();
    const counts = {};
    for (const e of events) {
      counts[e.status] = (counts[e.status] || 0) + 1;
    }
    return res.json({ data: counts, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to load status breakdown' } });
  }
});

// GET /api/v1/analytics/attendance-rate
router.get('/attendance-rate', (req, res) => {
  try {
    const events = getAllEvents();
    const registrations = getAllRegistrations();

    const data = events.map((event) => {
      const eventRegs = registrations.filter((r) => r.eventId === event.id);
      const attended = eventRegs.filter((r) => r.status === 'ATTENDED').length;
      const rate = eventRegs.length > 0 ? Math.round((attended / eventRegs.length) * 100) : 0;
      return { eventId: event.id, eventTitle: event.title, totalRegistrations: eventRegs.length, attended, attendanceRate: rate };
    });

    return res.json({ data, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to calculate attendance rate' } });
  }
});

// GET /api/v1/analytics/export
router.get('/export', async (req, res) => {
  try {
    const events = getAllEvents();
    const registrations = getAllRegistrations();
    const certificates = readAllCertificates();
    const attendedCount = registrations.filter((r) => r.status === 'ATTENDED').length;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.pdf"');
    doc.pipe(res);

    doc.fontSize(22).font('Helvetica-Bold').text('EventoraX Analytics Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Generated on ${new Date().toISOString().slice(0, 10)}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Overview');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total Events: ${events.length}`);
    doc.text(`Total Registrations: ${registrations.length}`);
    doc.text(`Total Certificates Issued: ${certificates.length}`);
    doc.text(`Total Attended: ${attendedCount}`);
    doc.moveDown(1.5);

    doc.fontSize(14).font('Helvetica-Bold').text('Attendance Rate by Event');
    doc.fontSize(11).font('Helvetica');
    for (const event of events) {
      const eventRegs = registrations.filter((r) => r.eventId === event.id);
      const attended = eventRegs.filter((r) => r.status === 'ATTENDED').length;
      const rate = eventRegs.length > 0 ? Math.round((attended / eventRegs.length) * 100) : 0;
      doc.text(`${event.title}: ${attended}/${eventRegs.length} attended (${rate}%)`);
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Failed to export report' } });
  }
});

module.exports = router;