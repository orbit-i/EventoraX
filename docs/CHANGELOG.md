# Changelog

## Certificates
- Added hash.js, verifyCode.js, pdfGenerator.js
- Added mockEvents.js, certificatesDb.js
- Added generate, bulk-generate, list, get-by-id, revoke endpoints
- Added public verify endpoint (rate-limited)
- Added send certificate email (placeholder)
- Updated mockEvents.js field names to match Hasan's real Event API

## ID Cards
- Added idCardGenerator.js, idCardsDb.js
- Added generate and bulk-generate endpoints
- Bug found and fixed: PDFKit default margins cut off content on small
  ID card pages, fixed by setting margins to 0

## QR Tickets
- Added qrCode.js, mockRegistrations.js, ticketsDb.js
- Added generate endpoint, matching exact contract agreed with Hasan
- Added scan, mark-as-used (with duplicate protection), send email,
  bulk download as ZIP
- Bug found and fixed: archiver v8 is ESM-only and broke require(),
  fixed by pinning to archiver@6
- Decision: QR hook uses a simple synchronous fetch() call, not a webhook

## Analytics
- Added overview, monthly-registrations, events-by-status,
  attendance-rate, and PDF export endpoints

## Infrastructure
- Confirmed uuid v10+ and archiver v8+ break with require(), pinned to
  compatible versions (uuid@9, archiver@6)

## Git incident
- Backend work was temporarily inaccessible after switching branches.
  Recovered fully via git reflog and git checkout, no data lost.