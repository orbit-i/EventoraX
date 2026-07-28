import transporter from './emailConfig.js';
import {
    welcomeTemplate,
    registrationTemplate,
    certificateTemplate,
    renewalTemplate
} from './emailTemplates.js';
import 'dotenv/config';

const FROM = process.env.EMAIL_FROM || 'EventoraX <no-reply@eventoraX.com>';

// Send Welcome Email
export const sendWelcomeEmail = async (to, name, orgName) => {
    const { subject, html } = welcomeTemplate(name, orgName);
    return transporter.sendMail({ from: FROM, to, subject, html });
};

// Send Registration Confirmation Email
export const sendRegistrationEmail = async (to, name, eventTitle, eventDate, refNo) => {
    const { subject, html } = registrationTemplate(name, eventTitle, eventDate, refNo);
    return transporter.sendMail({ from: FROM, to, subject, html });
};

// Send Certificate Email
export const sendCertificateEmail = async (to, name, eventTitle, verifyCode) => {
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify/${verifyCode}`;
    const { subject, html } = certificateTemplate(name, eventTitle, verifyCode, verifyUrl);
    return transporter.sendMail({ from: FROM, to, subject, html });
};

// Send Renewal Warning Email
export const sendRenewalEmail = async (to, name, orgName, expiryDate) => {
    const renewUrl = `${process.env.APP_URL || 'http://localhost:5173'}/billing`;
    const { subject, html } = renewalTemplate(name, orgName, expiryDate, renewUrl);
    return transporter.sendMail({ from: FROM, to, subject, html });
};
