# Tech Stack — This Module

## Confirmed and in use

- Runtime: Node.js
- Web framework: Express.js
- PDF generation: pdfkit (certificates, ID cards, analytics export)
- QR code generation: qrcode
- ZIP file creation: archiver (must use v6, newer versions break)
- Unique IDs: uuid (must use v9, newer versions break)
- Rate limiting: express-rate-limit (used on public verify endpoint)
- Hashing: Node's built-in crypto module

## Data storage

Currently flat JSON files on disk, as a placeholder until the real
MySQL database schema is finalized by Mehwish.

## Not yet decided (outside this module's control)

- Email sending library (nodemailer is the tentative pick, not wired up yet)
- Authentication mechanism (Shahid's module, not ready)
- Hosting/deployment platform