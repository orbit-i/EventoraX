# 5. Services, PDFs and background jobs

Paths are relative to `backend/src/`.

## Services (`services/`)

Business logic used by more than one controller or job. Services take the scoped client (`ScopedPrisma`) as a parameter
when they work inside one organization, so they stay tenant-safe.

### `certificates.ts`

| Export | Purpose |
|---|---|
| `normaliseVerifyCode(input)` | Accepts what people type (lower case, spaces, no dashes) → `EVX-XXXX-XXXX`. Used by verify endpoints and link previews. |
| `verifyUrl(code)` | `${FRONTEND_URL}/verify/<code>` (printed in the QR and emails). |
| `certificateHash(facts)` | SHA-256 of a canonical JSON of the facts frozen at issue time: code, recipient name and lower-cased email, type, category, event id, org id, `issuedAt`. If anyone edits those columns in the DB later, verification reports `TAMPERED`. |
| `certificateData(org, event, cert)` | Builds the renderer input (branding, signatory, event facts, verify URL). |
| `chooseTemplate(explicit, event)` | Template key: explicit → event's `certTemplateId` → `certificates.defaultTemplate` setting → `classic-royal`. |
| `issueCertificate(db, org, event, registration, { type, templateKey, issuedAt? })` | Creates the row (verify code, hash, private PDF key), renders the PDF and stores it in `private-files`. If rendering fails the row is deleted (never a certificate without a PDF). Retries up to 3 times on a verify-code collision; a duplicate `(registration, type)` throws a unique error for the caller. `issuedAt` is truncated to whole seconds so the hash survives the DB round trip. |
| `certificatePdf(org, event, cert)` | The stored PDF, or re-renders and re-stores it if the file is missing (e.g. after moving servers without `private-files/`). |
| `certificateFileName(cert)` | `Name-EVX-XXXX-XXXX.pdf`. |
| `emailCertificate(db, org, event, cert)` | Sends the Certificate template with the PDF, sets `emailedAt`. |
| `EVENT_FOR_CERT` | The Prisma `select` every caller uses for the event. |
| `autoIssueForAttended(db, org, eventId, registrationIds)` | The attendance hook. If the event has `autoIssueCert`, gives each ATTENDED registration without one a Participation certificate and emails it. Called (in the background) by status changes, bulk actions, check-in and the REST API. |

### `tickets.ts`

| Export | Purpose |
|---|---|
| `TICKET_INCLUDE` | Prisma include for a ticket with its registration and event. |
| `ticketPdf(org, ticket)` | Renders on demand (tickets aren't stored, so time/venue changes are always current). |
| `ticketFileName(ticket)` | `Name-TKT-XXXXXXXXXX.pdf`. |
| `emailTicket(db, org, ticket)` | Ticket template + PDF, sets `emailedAt`. |
| `parseScanned(input)` | Scanner/typed input → `{ qrCode }` (from `EVXT:<32 hex>` or bare 32 hex) or `{ ticketNo }` (from `TKT-XXXXXXXXXX`, with or without the dash) or `null`. |

### `orgNotifications.ts`

Alerts to an organization's active admins, as a bell notification **and** an email (`sendNotice`), controlled by
`organizations.notificationPrefs` (each defaults to on; suspended orgs get nothing).

| Export | Pref | Triggered by |
|---|---|---|
| `notifyNewRegistration(orgId, { name, email, eventTitle, eventId })` | `newRegistration` | public self-registration |
| `notifyCertificatesSent(orgId, { sent, failed, eventTitle, eventId })` | `certificate` | end of a background certificate email batch |
| `notifyAttendanceSummary(orgId, { eventId, title, registered, attended, absent, notMarked })` | `attendance` | `attendance-summaries` job |

Each notification has a `link` to the relevant dashboard page; the bell opens it.

### `announcements.ts`

| Export | Purpose |
|---|---|
| `audienceWhere(targetPlanId)` | Organizations reached: trial, active and expired (not suspended), optionally one plan. |
| `deliverAnnouncement(id)` | **Claims** the announcement first (`updateMany` where status is DRAFT/SCHEDULED → SENT), so a scheduled run and a "Send now" click can never both send it. Then creates a notification row per active user of each org (in-app) and, if chosen, emails each org's admins in the background (plain text → escaped paragraphs inside the Announcement template). Stores `orgCount` and `emailCount`. |
| `sendDueAnnouncements()` | Delivers every SCHEDULED announcement whose time has come (used by the job). |

## PDF engines (`pdf/`)

All PDFs are drawn with **pdfkit** (no HTML-to-PDF, no headless browser), so they render fast and identically on any server.

### `assets.ts`

- `FONTS` and `registerFonts(doc)`: Playfair Display (serif, regular/bold), Great Vibes (script, recipient names), Inter
  (sans, regular/semibold) loaded from the `@fontsource/*` packages' WOFF files, plus built-in Courier. That's why knip is
  told to ignore `@fontsource/great-vibes` and `@fontsource/playfair-display` (they're used by file path, not imported).
- `loadImage(url)`: reads `/uploads/...` from disk or fetches an `http(s)` URL (5 s timeout, 5 MB max); returns `null` for
  anything that isn't PNG/JPEG (pdfkit can't embed WEBP), so a bad logo never breaks a PDF.
- `toBuffer(doc)`: finishes a document into a `Buffer`.

### `certificate.ts`

- `LAYOUTS` (10): classic, modern, elegant, minimal, ribbon, bold, academic, geometric, wave, framed.
- `VARIANTS` (5): royal, navy, emerald, crimson, charcoal (primary + gold-ish accent), plus `brand` (the organization's
  primary/accent colours) → 60 template keys `<layout>-<variant>`. `DEFAULT_TEMPLATE = "classic-royal"`.
- `listTemplates()`, `isTemplateKey(key)`, `CertificateData`, `CertType`.
- `renderCertificate(templateKey, data)`: A4 landscape. Each layout draws its decoration (borders, bands, ribbons, waves…),
  then a shared text stack (org name, "Certificate of <type>", recipient in script, event, date/place) measured and
  centred to fit, signatory block (signature image, name, title), QR to the verify URL with the verify code, and the
  issue date. `data.sample = true` adds the diagonal SAMPLE watermark for previews. Wording per type is in `TYPE_TEXT`
  (Speaker and Organizer certificates are titled "Certificate of Appreciation" with their own line, e.g. "is thanked for
  speaking at").

### `ticket.ts`

- `TICKET_QR_PREFIX = "EVXT:"` and `ticketQrValue(qrCode)`: the QR content. The prefix lets the scanner ignore unrelated QR codes.
- `renderTicket(data)`: A6 portrait. Header in the org colour with logo and name, event title, date/time (Asia/Karachi),
  where (online events: the meeting link; others: the venue), attendee, category, QR (`qrcode` package, error correction M),
  ticket and registration numbers.

### `idcard.ts`

- `IDCARD_TEMPLATES` (classic, sidebar, minimal, bold), `IDCARD_FIELDS` (category, department, rollNo, email, qr),
  defaults, `IdCardOptions` (`template`, `fields`, `logo`, `layout: sheet | single`).
- `renderIdCards(people, event, options, { sample })`: CR80 cards (54 × 85.6 mm). `single` = one card-sized page per person;
  `sheet` = 3 × 3 cards per A4 page with crop marks. Names shrink (down to 9 pt, then wrap to 2 lines); detail lines tighten
  and the least important are dropped if space runs out; text colour adapts to the background (`readableOn`). The QR is
  the ticket's, so badges work with the check-in scanner. Initials in a circle replace a photo.
- `SAMPLE_PEOPLE` for previews.

### `report.ts` (ReportKit)

A small toolkit for A4 reports, reused by the organization analytics report and the superadmin platform report:

| Method | Draws |
|---|---|
| `newReport(title, author)` | a new A4 document with fonts and page buffering (for "Page X of Y") |
| `new ReportKit(doc, brandColour)` | the cursor-based kit (`y` moves down; `ensure(height)` adds a page when needed) |
| `header({ title, subtitle, orgName, logo, generatedBy })` | report header with logo |
| `section(title, description?)` | section heading |
| `kpis(items)` | a row of KPI tiles |
| `barChart(items, opts)` | vertical bars (monthly series) |
| `hBars(items, opts)` | horizontal bars (breakdowns, attendance rates) |
| `table(columns, rows)` | tables that continue on the next page with the header repeated |
| `columns(left, right)` | two blocks side by side |
| `note(text)`, `footer(text)` | small text, page footers |

`renderAnalyticsReport(data, { orgName, logoUrl, primaryColor, generatedBy })` builds the 2-page organization report; `controllers/superadmin/analytics-controller.ts`
builds the platform one with the same kit. `monthLabel("2026-03") → "Mar"`.

## Background jobs (`jobs/`)

### `scheduler.ts`

A minimal in-process scheduler:

- `registerJob({ name, label, description, intervalMs, run })`: `run` returns a short summary string.
- `startScheduler()`: called once after `listen`. First runs are staggered (5 s, 7 s, 9 s… after start), then each job
  runs on its own `setInterval`.
- `runJob(name)`: runs now unless it's already running; records `lastRunAt`, duration, result or error (errors also go to
  `error_logs`). Used by the interval and by **Maintenance → Run now**.
- `jobStatuses()`: what the Maintenance page shows.

State lives in memory: after a restart the "last run" information starts empty. One API process = one runner; running
several processes would run every job several times (see Operations).

### `index.ts` (the jobs)

| Name | Every | What it does | Run-once guard |
|---|---|---|---|
| `expire-orgs` | 10 min | `expireOverdueOrgs()`: trial/active orgs past their end date → expired | idempotent |
| `expiry-reminders` | 6 h | Orgs (trial/active) ending within 3 days: Plan expiring soon email to admins + org email | an `activity_logs` row `billing.expiry.reminder` with `entityId = <end date ISO>`, so each end date is reminded once (a renewal gives a new end date and a new reminder) |
| `announcements` | 1 min | `sendDueAnnouncements()` | the claim in `deliverAnnouncement` |
| `attendance-summaries` | 30 min | Events (public statuses) that ended in the last 2 days: counts by status → `notifyAttendanceSummary` | an `activity_logs` row `event.attendance.summary` per event, written even when the org's pref is off (switching it on later doesn't flood old events) |

**Adding a job:** `registerJob({...})` in `jobs/index.ts`; make it idempotent (use a marker row or an atomic claim), return
a readable summary. It appears on the Maintenance page automatically.
