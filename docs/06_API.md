# API Reference

Base URL (local development): http://localhost:3000

## Certificates — /api/v1/certificates

POST /generate — generates one certificate (PDF + hash + verify code)
Body: recipientName, recipientEmail, eventId, templateId

POST /bulk-generate — generates certificates for a list of recipients
Body: eventId, templateId, recipients (array of name/email)

GET / — lists all certificates. Optional: ?query=, ?status=

GET /:id — returns one certificate's full details

PATCH /:id/revoke — marks a certificate revoked
Body: reason (required)

POST /:id/send — placeholder, logs to console instead of sending real email

## Public Verify — /api/v1/verify

GET /:code — public, no login, rate-limited to 20 requests/minute
Returns valid:true with details, or valid:false with a reason

## ID Cards — /api/v1/idcards

POST /generate — Body: attendeeName, attendeeEmail, eventId, templateId

POST /bulk-generate — Body: eventId, templateId, attendees (array)

## QR Tickets — /api/v1/tickets

POST /generate — Body: registrationId, eventId, attendeeName, attendeeEmail
Returns: data.ticketId, data.qrCodeUrl

GET /scan/:ticketCode — looks up a ticket, does not mark it used

PATCH /:id/use — marks a ticket used, blocks reuse with an error

POST /:id/send — placeholder email

GET /bulk-download?eventId=X — streams a ZIP of QR codes for one event

## Analytics — /api/v1/analytics

GET /overview — total events, registrations, certificates, attended count

GET /monthly-registrations — last 12 months of registration counts

GET /events-by-status — count of events per status

GET /attendance-rate — attendance percentage per event

GET /export — streams a PDF analytics report