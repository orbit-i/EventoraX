# Testing & QA

All endpoints were manually tested with curl from a local terminal,
during development. No automated test suite exists yet.

## Certificates
- Generate single certificate — passed
- Bulk generate — passed
- List, search, filter — passed
- Get single certificate, including not-found case — passed
- Revoke with and without reason — passed
- Send certificate email (placeholder) — passed

## Public Verify
- Verify real code — passed
- Verify fake code — passed

## ID Cards
- Generate single ID card — bug found (PDFKit margins cut off content),
  fixed, retested and passed
- Bulk generate — passed

## QR Tickets
- Generate ticket — passed, matches contract with Hasan
- Scan ticket — passed
- Mark ticket used, and block reuse — passed
- Send ticket email (placeholder) — passed
- Bulk download as ZIP — bug found (archiver version incompatibility),
  fixed, retested and passed

## Analytics
- Overview, monthly registrations, events by status, attendance rate — all passed
- Export as PDF — passed

## Known testing gaps

No automated tests exist yet. No testing yet against Hasan's real
Events/Registrations API since it isn't live.