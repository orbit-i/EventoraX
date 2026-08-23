# System Architecture

This describes the architecture of the Certificate/QR/ID Card/Analytics
backend module only.

## Layers

Request
   |
   v
routes/   - receives HTTP requests, validates input, sends responses
   |
   v
utils/    - pure logic: hashing, PDF generation, QR generation, verify codes
   |
   v
data/     - reads/writes stored records (currently JSON files)
   |
   v
uploads/  - generated PDF/PNG/ZIP files, served as static files

## Request flow example — generating a certificate

1. POST /api/v1/certificates/generate hits routes/certificates.js
2. Route validates the request body
3. Route calls utils/hash.js and utils/verifyCode.js
4. Route calls utils/pdfGenerator.js to build the PDF
5. Route calls data/certificatesDb.js to save the record
6. PDF file is written to uploads/certificates/
7. Route returns the certificate ID, verify code, hash, and PDF URL

## Cross-module dependency

This module depends on data from other teammates' modules:
- Event details — owned by Hasan, currently a placeholder (mockEvents.js)
- Registration data — owned by Hasan, currently a placeholder (mockRegistrations.js)
- Auth/tenant identity — owned by Shahid, not implemented anywhere yet