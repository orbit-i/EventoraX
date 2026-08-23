# Final Product Spec — Certificate / QR / ID Card / Analytics Module

## Certificates (/dashboard/certificates)
- List columns: Name, Event, Verify Code, Type, Issued Date, Downloads, Status
- Generate single certificate: pick attendee, generates immediately
- Bulk generate: select event, generates for all attendees marked Attended
- Send certificate via email (includes public verify link)
- Download certificate as PDF
- Revoke certificate (with a reason)
- Every certificate shows its verify code and SHA-256 hash

## Public Verify Page (/verify — no login required)
- Search input: enter a verify code
- Result card shows: Name, Event, Organization, Date, Category
- Green VERIFIED badge or red INVALID badge
- SHA-256 hash displayed

## QR Tickets (/dashboard/tickets)
- A ticket is auto-generated every time someone registers for an event
- List columns: Ticket No, Attendee Name, Event, Type, Used/Unused, Issued Date
- QR scanner page marks tickets as used
- Bulk download all tickets as a ZIP
- Send a ticket via email

## ID Cards (/dashboard/idcards)
- Select an event, and specific attendees or all of them
- Choose 1 of 4 ID card templates
- Generate & download as PDF, one at a time or in bulk

## Analytics (/dashboard/analytics)
- Overall stats: total events, registrations, certificates, attended count
- Monthly registrations chart (last 12 months)
- Events-by-status pie chart
- Attendance rate per event
- Export the whole analytics view as a PDF report