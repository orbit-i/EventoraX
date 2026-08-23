x# Backend — Folder & File Reference

## Folder structure

backend/
  server.js — application entry point
  routes/
    certificates.js
    verify.js
    idcards.js
    tickets.js
    analytics.js
  utils/
    hash.js
    verifyCode.js
    pdfGenerator.js
    idCardGenerator.js
    qrCode.js
  data/
    mockEvents.js
    mockRegistrations.js
    certificatesDb.js / .json
    ticketsDb.js / .json
    idCardsDb.js / .json
  uploads/
    certificates/
    idcards/
    tickets/

## What each layer does

- routes/ — receives requests, validates input, calls utils and data, sends responses
- utils/ — pure logic, no knowledge of HTTP or storage
- data/ — reads/writes stored records, currently JSON files
- uploads/ — static file storage for generated PDFs/QR images

## Dependency notes

- uuid must be pinned to v9 (npm install uuid@9)
- archiver must be pinned to v6 (npm install archiver@6)

## Known bug fixed during development

PDFKit's default page margins caused ID card PDFs to overflow onto
hidden extra pages, cutting off attendee name/email. Fixed by setting
margins to 0 for the small custom page size.