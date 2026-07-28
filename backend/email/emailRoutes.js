import express from 'express';
import {
    sendWelcomeEmail,
    sendRegistrationEmail,
    sendCertificateEmail,
    sendRenewalEmail
} from './emailSender.js';

const router = express.Router();

// Test Welcome Email
router.post('/test/welcome', async (req, res) => {
    try {
        const { to, name, orgName } = req.body;
        await sendWelcomeEmail(to, name, orgName);
        res.json({ success: true, message: 'Welcome email sent' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Test Registration Email
router.post('/test/registration', async (req, res) => {
    try {
        const { to, name, eventTitle, eventDate, refNo } = req.body;
        await sendRegistrationEmail(to, name, eventTitle, eventDate, refNo);
        res.json({ success: true, message: 'Registration email sent' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Test Certificate Email
router.post('/test/certificate', async (req, res) => {
    try {
        const { to, name, eventTitle, verifyCode } = req.body;
        await sendCertificateEmail(to, name, eventTitle, verifyCode);
        res.json({ success: true, message: 'Certificate email sent' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Test Renewal Email
router.post('/test/renewal', async (req, res) => {
    try {
        const { to, name, orgName, expiryDate } = req.body;
        await sendRenewalEmail(to, name, orgName, expiryDate);
        res.json({ success: true, message: 'Renewal email sent' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
