# Database

## Current status: placeholder, not the final database

This module currently stores data in flat JSON files instead of a real
database, to stay unblocked while waiting on the real MySQL schema.

## Certificate record

id, recipientName, recipientEmail, eventId, eventName, templateId,
verifyCode, hash, issueDate, status (issued/revoked), pdfUrl

## Ticket record

id, ticketCode, registrationId, eventId, attendeeName, attendeeEmail,
used, usedAt, qrCodeUrl, createdAt

## ID Card record

id, attendeeName, attendeeEmail, eventId, eventName, templateId, pdfUrl

## Placeholder event data

Matches Hasan's real Event API field names: id, tenantId, title,
organizer, mode, startDateTime, endDateTime, status, certTemplateId,
autoIssueCert

## Placeholder registration data

Matches Hasan's real Registrations field names: id, tenantId, eventId,
category (nested object, not fixed enum), name, email, status
(REGISTERED/ATTENDED/ABSENT/CANCELLED)

## Important notes from Hasan

- No checkedInAt timestamp exists yet, only status
- Field is called tenantId, not organizationId