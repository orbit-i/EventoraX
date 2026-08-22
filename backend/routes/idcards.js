// routes/idcards.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { generateIdCardPdf } = require('../utils/idCardGenerator');
const { saveIdCard } = require('../data/idCardsDb');
const { getEventById } = require('../data/mockEvents');

const router = express.Router();
const CARD_DIR = path.join(__dirname, '..', 'uploads', 'idcards');
fs.mkdirSync(CARD_DIR, { recursive: true });

// PLACEHOLDER: 4 templates, per spec ("Choose 1 of 4 ID card templates")
const TEMPLATES = ['tpl_classic', 'tpl_modern', 'tpl_bold', 'tpl_minimal'];

router.post('/generate', async (req, res) => {
  try {
    const { attendeeName, attendeeEmail, eventId, templateId } = req.body;
    if (!attendeeName || !attendeeEmail || !eventId || !templateId) {
      return res.status(400).json({ error: 'attendeeName, attendeeEmail, eventId, and templateId are required' });
    }
    if (!TEMPLATES.includes(templateId)) {
      return res.status(400).json({ error: `templateId must be one of: ${TEMPLATES.join(', ')}` });
    }

    const event = getEventById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const idCardId = uuidv4();
    const pdfBuffer = await generateIdCardPdf({
      attendeeName,
      eventName: event.title,
      attendeeEmail,
      idCardId,
    });

    const filePath = path.join(CARD_DIR, `${idCardId}.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);

    const record = {
      id: idCardId,
      attendeeName,
      attendeeEmail,
      eventId,
      eventName: event.title,
      templateId,
      pdfUrl: `/uploads/idcards/${idCardId}.pdf`,
      createdAt: new Date().toISOString(),
    };
    saveIdCard(record);

    return res.status(201).json(record);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate ID card' });
  }
});

router.post('/bulk-generate', async (req, res) => {
  try {
    const { eventId, templateId, attendees } = req.body;
    if (!eventId || !templateId || !Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ error: 'eventId, templateId, and a non-empty attendees array are required' });
    }
    if (!TEMPLATES.includes(templateId)) {
      return res.status(400).json({ error: `templateId must be one of: ${TEMPLATES.join(', ')}` });
    }

    const event = getEventById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const results = [];
    for (const a of attendees) {
      const { name, email } = a;
      if (!name || !email) continue;

      const idCardId = uuidv4();
      const pdfBuffer = await generateIdCardPdf({
        attendeeName: name,
        eventName: event.title,
        attendeeEmail: email,
        idCardId,
      });

      const filePath = path.join(CARD_DIR, `${idCardId}.pdf`);
      fs.writeFileSync(filePath, pdfBuffer);

      const record = {
        id: idCardId,
        attendeeName: name,
        attendeeEmail: email,
        eventId,
        eventName: event.title,
        templateId,
        pdfUrl: `/uploads/idcards/${idCardId}.pdf`,
        createdAt: new Date().toISOString(),
      };
      saveIdCard(record);
      results.push(record);
    }

    return res.status(201).json({ count: results.length, idCards: results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to bulk generate ID cards' });
  }
});

module.exports = router;