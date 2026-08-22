// routes/verify.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { findByVerifyCode } = require('../data/certificatesDb');

const router = express.Router();

// Basic protection: max 20 requests per minute per IP address.
// This is a public, no-login endpoint, so it needs a limit to prevent abuse.
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please try again in a minute.' },
});

// GET /api/v1/verify/:code
// Public endpoint — no login required.
router.get('/:code', verifyLimiter, (req, res) => {
  try {
    const { code } = req.params;
    const certificate = findByVerifyCode(code);

    if (!certificate) {
      return res.json({ valid: false, reason: 'not_found' });
    }

    if (certificate.status === 'revoked') {
      return res.json({
        valid: false,
        reason: 'revoked',
        recipientName: certificate.recipientName,
        eventName: certificate.eventName,
      });
    }

    // Only return what's needed for public display — not internal fields.
    return res.json({
      valid: true,
      recipientName: certificate.recipientName,
      eventName: certificate.eventName,
      issueDate: certificate.issueDate,
      hash: certificate.hash,
      verifyCode: certificate.verifyCode,
    });
  } catch (err) {
    console.error(err);
    // Never leak internal error details on a public endpoint.
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;