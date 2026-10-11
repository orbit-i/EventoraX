# 4. Backend API

Every endpoint, grouped by router. All paths start with `/api/v1`. Paths are relative to `backend/src/`.

**How routes and controllers are split:** `routes/<area>-routes.ts` declares URLs and the middleware chain;
`controllers/<area>-controller.ts` holds the handlers (zod schema at the top of each section, then the handler).
The exception is `routes/auth-route.ts`, which contains its handlers inline (it predates the split).

**Route order rule:** fixed paths (`/stats`, `/export`, `/bulk`, `/zip`) are declared before `/:id`, otherwise Express
would treat `stats` as an id.

**Legend:** *any* = any member of the organization (viewers included), *write* = admin + manager (`canWrite`),
*admin* = organization admins, *expired ok* = still works when the plan has expired.

## Mounting (`index.ts`)

| Prefix | Router (file) | Auth |
|---|---|---|
| `/health` | inline | public |
| `/platform`, `/platform/website` | `controllers/superadmin/settings-controller.ts` | public |
| `/plans` | `controllers/superadmin/plans-controller.ts` → `publicPlans` | public |
| `/auth` | `routes/auth-route.ts` | mixed |
| `/org` | `routes/org-routes.ts` | member, expired ok |
| `/team` | `routes/team-routes.ts` | member |
| `/events`, `/categories` | `routes/events-routes.ts` | member |
| `/speakers`, `/sponsors`, `/sessions`, `/reorder` | `routes/program-routes.ts` | member |
| `/registrations` | `routes/registrations-routes.ts` | member |
| `/uploads` | `routes/uploads-routes.ts` | member, expired ok (some kinds) |
| `/certificates`, `/verify` | `routes/certificates-routes.ts` | member / public |
| `/tickets` | `routes/tickets-routes.ts` | member |
| `/idcards` | `routes/idcards-routes.ts` | member |
| `/dashboard`, `/analytics`, `/activity`, `/billing`, `/support`, `/contact` | `routes/dashboard-routes.ts` | mixed |
| `/notifications` | `routes/notifications-routes.ts` | member, expired ok |
| `/public` | `routes/public-routes.ts` | public |
| `/api-tokens`, `/ext` | `routes/api-routes.ts` | admin (Enterprise) / API token |
| `/superadmin` | `routes/superadmin-routes.ts` | superadmin |

---

## Auth (`routes/auth-route.ts`)

Plain JSON responses (no envelope): success `{ token, user, … }` or `{ message }`; errors `{ error, code?, fieldErrors? }`.
`publicUser()` is the shape returned for a user: `id, name, email, phone, role, organizationId, emailVerified, twoFactorEnabled`.

| Endpoint | Limiter | What it does |
|---|---|---|
| `POST /register` `{ fullName, organizationName, email, phone, password }` | 5/h | Validates (strong password, Pakistani phone via libphonenumber), creates in one transaction the organization (`status: trial`, plan Pro, `subscriptionEndsAt = now + trial.days`, unique slug from the name) + the admin user + an email-verification token (24 h). Sends verification and welcome emails. Returns a session token. |
| `GET /verify-email?token=` | 10/h | Marks the email verified (token hash lookup, single use). |
| `POST /resend-verification` (logged in) | 10/h | New verification token + email. |
| `POST /login` `{ email, password, remember? }` | 60/15 min | Lockout check (5 failures since the later of 15 min ago and the last success), bcrypt compare against a dummy hash when the email doesn't exist (equal timing), disabled users and suspended orgs refused (with reason). With 2FA: `{ twoFactorRequired, challengeToken }`. Otherwise records the attempt, sets `lastLoginAt`, logs `auth.login`, returns `{ token, user, organizationStatus }`. |
| `POST /login/2fa` `{ challengeToken, code }` | 15/15 min | Verifies the challenge, then a TOTP code or an unused recovery code (which is then removed). Failures count toward the lockout. Returns the session. |
| `POST /2fa/setup` (logged in) | | New secret (encrypted, stored but not active) + `otpauth://` URL for the QR. |
| `POST /2fa/enable` `{ code }` | 15/15 min | Confirms a code, sets `twoFactorEnabledAt`, returns 10 recovery codes (stored as hashes). |
| `POST /2fa/disable` `{ password }`, `POST /2fa/recovery-codes` `{ password }` | 5/15 min | Turn off / regenerate codes. Blocked while impersonating. |
| `POST /forgot-password` `{ email }` | 5/15 min | Always answers the same message; if the account exists, a 15-minute reset token is emailed. |
| `POST /reset-password` `{ token, newPassword }` | 5/15 min | Sets the password, bumps `tokenVersion` (logs out everywhere), deletes the user's reset tokens. |
| `GET /me` | | Current user + organization (with plan) + `impersonator` if impersonating. |
| `PATCH /me` `{ name?, phone? }` | | Edit own profile. |
| `POST /change-password` `{ currentPassword, newPassword }` | 5/15 min | Bumps `tokenVersion` and returns a fresh token so this tab stays logged in. Blocked while impersonating. |
| `POST /logout-all` | | Bumps `tokenVersion`. |
| `GET /invite/:token` | 20/h | Public: who invited you to which organization and role. |
| `POST /accept-invite` `{ token, name, password, phone? }` | 20/h | Creates the user in the inviting org with the invited role (the seat was already reserved: pending invites count toward the limit), marks the invite accepted, returns a session. |

## Organization (`routes/org-routes.ts`, `controllers/org-controller.ts`)

Chain: `requireAuth` + `checkOrgStatus({ allowExpired: true })` (no scoped client; the controller uses `req.org`).

| Endpoint | Who | What |
|---|---|---|
| `GET /org/me` | any | The organization with its plan. |
| `PATCH /org/me` | admin | Any subset of: name, email, phone, logoUrl, signatureUrl, primaryColor/accentColor (`#rrggbb`), signatoryName/Title, whiteLabelName, customDomain (hostname, unique), `notificationPrefs { newRegistration, attendance, certificate }`. Empty string clears a field. Replaced logo/signature files are deleted. |
| `POST /org/me/delete-data` `{ confirm, password }` | admin | `confirm` must equal the org name exactly and the password must match. Deletes every event (cascades to registrations, tickets, certificates, speakers, sponsors, sessions, categories) and the speaker/sponsor uploads and private files. |
| `POST /org/me/close` `{ confirm, password }` | admin | Deletes the organization (cascades to users and everything else) and all its files. Logged at platform level. |

Logo and signature are uploaded first with `POST /uploads/image?kind=logo|signature`, then saved with `PATCH /org/me`.

## Team (`routes/team-routes.ts`, `controllers/team-controller.ts`)

| Endpoint | Who | What |
|---|---|---|
| `GET /team` | any | Members (name, email, role, status, last login) + pending invites + seat usage per role. |
| `POST /team/invite` `{ email, role }` | admin | Refuses emails that already have an account (an email belongs to one account and one organization) or a pending invite; checks seat limits (`seatsUsed` counts members + valid invites); upserts the invitation with a hashed token valid 7 days; emails the link. |
| `POST /team/invites/:inviteId/resend` | admin | New token and 7 more days; the old link stops working. |
| `DELETE /team/invites/:inviteId` | admin | Cancels. |
| `PATCH /team/:userId/role` `{ role }` | admin | Not your own role; keeps at least one admin; checks the seat limit of the new role. Takes effect immediately (role is read from the DB per request). |
| `DELETE /team/:userId` | admin | Not yourself; keeps one admin; reassigns invites they sent to you; deletes the user. |

## Events and categories (`routes/events-routes.ts`, `controllers/events-controller.ts`)

Statuses `DRAFT | PUBLISHED | ONGOING | COMPLETED | ARCHIVED` (UI: Draft, Upcoming, Active, Completed, Archived).
Modes `ONLINE | OFFLINE | HYBRID` (UI: Online, Physical, Hybrid).

| Endpoint | Who | What |
|---|---|---|
| `GET /events?status=&mode=&search=&from=&to=&page=&limit=` | any | Paged list with registration counts. Default excludes archived. |
| `GET /events/stats` | any | Counts per status for the list's cards and tabs. |
| `POST /events` | write | Creates with categories (labels de-duplicated case-insensitively). Online/hybrid need a `meetingLink`. |
| `GET /events/:id` | any | Event + categories + attendance numbers. |
| `GET /events/:id/stats` | any | Every number for one event (registered, attended, seats left, checked in, certificates…). |
| `PATCH /events/:id` | write | Partial update (send only changed fields). |
| `DELETE /events/:id` | write | With registrations → `ARCHIVED` + registration closed (`{ archived: true }`); empty → deleted. |
| `POST /events/:id/duplicate` | write | Copy + categories as `DRAFT`, title "… (Copy)". |
| `POST /events/:id/restore` | write | Archived → `COMPLETED` if it has ended, else `DRAFT`. |
| `GET /categories?eventId=` / `POST` `{ eventId, label }` / `PATCH /:id` / `DELETE /:id` | any / write | Attendee categories. Deleting one leaves its registrations without a category. |

## Speakers, sponsors, sessions, reorder (`routes/program-routes.ts`, `controllers/program-controller.ts`)

| Endpoint | Who | What |
|---|---|---|
| `GET /speakers?eventId=&search=&displayPublic=&page=&limit=`, `GET /:id`, `POST`, `PATCH /:id`, `DELETE /:id` | any / write | Speakers of an event. Deleting keeps their sessions (speaker set to null). |
| `POST /speakers/:id/photo` (multipart `file`) | write | Upload a photo directly for a saved speaker (old file deleted). |
| `GET /sponsors?eventId=&search=&tier=&displayPublic=…`, CRUD, `POST /sponsors/:id/logo` | any / write | Sponsors with tier. |
| `GET /sessions?eventId=&search=&displayPublic=…`, CRUD | any / write | Agenda items. A session's speaker must belong to the same event; end after start. |
| `POST /reorder` `{ type: "speakers" \| "sponsors" \| "sessions", items: [{ id, displayOrder }] }` | write | All-or-nothing transaction; every id must belong to the org. |

`displayPublic` decides what the public event page shows.

## Registrations (`routes/registrations-routes.ts`, `controllers/registrations-controller.ts`)

Statuses `REGISTERED | ATTENDED | ABSENT | CANCELLED`. Cancelled registrations don't take a seat (`seatsLeft()`), get no
certificate and no emails. `registeredVia`: `WEB` (public page), `ADMIN`, `CSV_IMPORT`, `API`. Every registration is created
with a nested ticket (`ticketFor()`: ticket number, QR code, type = category label or "General").
`(eventId, email)` is unique → 409 `DUPLICATE`.

| Endpoint | Who | What |
|---|---|---|
| `GET /registrations?eventId=&status=&categoryId=&search=&page=&limit=` | any | Paged list with category, ticket and check-in info. |
| `GET /registrations/export?eventId=&format=csv\|xlsx&status=&ids=` | any | CSV (BOM, formula-safe) or Excel (exceljs). Logged. |
| `POST /registrations` | write | Organizer adds someone (`registeredVia: ADMIN`). Refuses archived or full events. |
| `POST /registrations/csv-import/parse` (multipart `file`, ≤ 2 MB) | write | Parses with papaparse, returns headers, rows (≤ 5,000) and suggested column mapping. |
| `POST /registrations/csv-import/confirm` `{ eventId, rows, createMissingCategories?, duplicateStrategy?: first\|last\|skip, dryRun? }` | write | Validates every row (zod `importRowSchema`), resolves duplicates inside the file, skips existing emails, checks seats, optionally creates categories. `dryRun: true` reports without saving (the wizard's Review step). Returns created/skipped counts and per-row reasons. |
| `POST /registrations/bulk` `{ action, ids ≤ 1000 }` | write | `mark_attended`, `mark_absent`, `mark_registered` (skip cancelled), `cancel`, `restore` (checks seats per event first), `delete`. Attended → certificate auto-issue in the background. |
| `POST /registrations/email` `{ ids, subject, message }` | write | Free-text message to the selected people (non-cancelled), sent in the background. |
| `GET /registrations/:id`, `PATCH /:id` | any / write | Edit fields; changing category also updates the ticket type; restoring from cancelled needs a seat. |
| `PATCH /registrations/:id/status` `{ status }` (alias `/attendance`) | write | Single status change with the same seat rule; Attended triggers auto-issue. |
| `DELETE /registrations/:id` | write | Deletes with its ticket. |

## Uploads (`routes/uploads-routes.ts`)

`POST /uploads/image?kind=speaker|sponsor|logo|signature|payment` (multipart `file`), *write*, expired ok for `payment`,
`logo`, `signature`. Branding and payment kinds are admin-only; logos and signatures must be PNG/JPEG. Saves to
`uploads/orgs/<orgId>/<speakers|sponsors|branding|payments>/` and returns `{ url }` so forms can preview before saving.

## Certificates and verification (`routes/certificates-routes.ts`, `controllers/certificates-controller.ts`)

Types `PARTICIPATION | ACHIEVEMENT | APPRECIATION | SPEAKER | ORGANIZER`. Participation and Achievement need ATTENDED.
Unique `(registrationId, type)` → 409 `ALREADY_ISSUED`. Template = request → the event's `certTemplateId` → platform
default (`certificates.defaultTemplate`).

| Endpoint | Who | What |
|---|---|---|
| `GET /certificates/templates` | any | The 60-design catalogue. |
| `GET /certificates/preview?templateKey=&eventId=&type=` | any | Sample PDF (SAMPLE watermark) with the org's branding. |
| `GET /certificates?eventId=&status=&type=&emailed=&search=&page=&limit=` | any | List. |
| `GET /certificates/stats?eventId=` | any | Issued, revoked, emailed, downloads, waiting (attended without one). |
| `GET /certificates/candidates?eventId=&type=&search=` | write | People who could get this type (for "Issue one"). |
| `POST /certificates` `{ registrationId, type?, templateKey?, sendEmail? }` | write | Issue one (`services/certificates.issueCertificate`). |
| `POST /certificates/bulk` `{ eventId, type?, templateKey?, sendEmail? }` | write | Every ATTENDED registration without this type (max 1,000). Emails in the background, then `notifyCertificatesSent`. |
| `POST /certificates/email` `{ ids }` | write | (Re)send, revoked skipped, background. |
| `GET /certificates/:id/pdf?inline=1` | any | Stored PDF; counts a download unless `inline=1`. |
| `POST /certificates/:id/email`, `/:id/revoke` `{ reason }`, `/:id/restore` | write | Revoke keeps the record with reason; restore clears it. |
| `GET /verify/:code` | public, 30/min | `valid`, `status` (`ISSUED`, `REVOKED` + reason, or `TAMPERED` when the stored facts no longer match their SHA-256), recipient, event, issuer, date. No email/phone. |
| `GET /verify/:code/pdf` | public, 30/min | PDF of a valid, untampered certificate (counts a download). |

## Tickets and check-in (`routes/tickets-routes.ts`, `controllers/tickets-controller.ts`)

| Endpoint | Who | What |
|---|---|---|
| `GET /tickets?eventId=&search=&used=yes\|no&page=&limit=`, `GET /tickets/stats?eventId=` | any | List and numbers. |
| `GET /tickets/zip?eventId=` or `?ids=` | any | One PDF per ticket in a ZIP (archiver, streamed). |
| `POST /tickets/email` `{ ids }` or `{ eventId, onlyUnsent? }` | write | Background emailing; sets `emailedAt`. |
| `GET /tickets/:id/pdf?inline=1`, `POST /tickets/:id/email` | any / write | One ticket. |
| `POST /tickets/check-in` `{ code, eventId? }` | write | `code` = QR text `EVXT:<qrCode>` or `TKT-…` (`services/tickets.parseScanned`). Refuses wrong event, cancelled registration, archived event. **First scan wins:** `updateMany where isUsed=false` claims the ticket atomically; a second scan gets `ALREADY_USED` with who/when. Sets the registration ATTENDED and triggers auto-issue. |
| `POST /tickets/:id/undo-check-in` | write | Ticket unused again; ATTENDED → REGISTERED. |

## ID cards (`routes/idcards-routes.ts`, `controllers/idcards-controller.ts`)

All *any* (printing only reads data). Card options come from the query: `template` (classic, sidebar, minimal, bold),
`fields` (category, department, rollNo, email, qr), `logo=0|1`, `layout=sheet|single`; invalid values fall back to defaults.

| Endpoint | What |
|---|---|
| `GET /idcards/options` | Templates and fields for the design panel. |
| `GET /idcards?eventId=&search=&categoryId=&printed=yes\|no&page=&limit=` | Non-cancelled attendees with their last print. |
| `GET /idcards/stats?eventId=` | Attendees, printed, not printed. |
| `GET /idcards/preview?…` | Sample people, inline PDF. |
| `GET /idcards/pdf?eventId=&ids=&…&inline=1` | Real cards; without `inline=1` records an `IdCard` row per person (printed). |

## Dashboard, analytics, activity, billing, support (`routes/dashboard-routes.ts`)

| Endpoint | Who | Controller | What |
|---|---|---|---|
| `GET /dashboard/overview` | any, expired ok | `dashboard-controller` | Cards, 6-month registrations, upcoming events, recent activity. |
| `GET /analytics` | any | `dashboard-controller` (`analyticsData`) | Everything on the Analytics page (12 months). |
| `GET /analytics/report` | any | same + `pdf/report.ts` | The same numbers as a 2-page PDF. |
| `GET /activity?userId=&action=&from=&to=` | admin | `activity-controller` | `action` matches by prefix (`event` → `event.*`). |
| `GET /activity/export` | admin | | CSV, up to 10,000 rows. |
| `GET /billing` | admin, expired ok | `billing-controller` | Current plan, status, end date, visible plans, payment accounts (setting). |
| `GET /billing/payments`, `POST /billing/payments` `{ planId, method, referenceNo, proofUrl?, notes? }`, `DELETE /billing/payments/:id` | admin, expired ok | | Amount always comes from the plan. One pending payment at a time. Emails the platform contact address. Only pending payments can be cancelled. |
| `POST /support` `{ subject, message }` | any, expired ok | `support-controller` | Emails the platform contact address with the sender's details. |
| `GET /contact/info` | public | | Contact email, WhatsApp, hours, social links. |
| `POST /contact` | public, 5/h | | Website contact form → platform contact email. |

## Notifications (`routes/notifications-routes.ts`)

Expired ok. `GET /notifications?limit=` (latest + unread count), `POST /notifications/:id/read`, `POST /notifications/read-all`.
Rows are per user; they are created by announcements and `services/orgNotifications.ts`.

## Public pages (`routes/public-routes.ts`, `controllers/public-controller.ts`)

No login. Only `PUBLISHED`, `ONGOING`, `COMPLETED` events exist here; suspended organizations are hidden. Uses the white-label
name when set. Reads are limited to 120/min per IP.

| Endpoint | What |
|---|---|
| `GET /public/orgs/:slug` | Org branding + upcoming and past events. |
| `GET /public/events/:id` | Event, availability (`OPEN`, `FULL`, `CLOSED`, `ENDED`, `UNAVAILABLE` for paused orgs), categories, public speakers/sponsors/sessions. Never the meeting link. |
| `POST /public/events/:id/register` `{ name, email, phone?, department?, rollNo?, categoryId?, website }` | 60/hour per IP. `website` is a **honeypot**: if filled, it pretends success and stores nothing. Creates the registration (`WEB`) with its ticket, returns ref/ticket/QR for the on-screen ticket, then in the background emails the confirmation with the ticket PDF and notifies admins (`notifyNewRegistration`). Duplicate email → 409 `ALREADY_REGISTERED`. |

## API tokens and the REST API (`routes/api-routes.ts`)

**Token management** (`controllers/api-tokens-controller.ts`): `orgScoped` + admin + `requireApiPlan` (plan `features.restApi`).
`GET /api-tokens`, `POST /api-tokens` `{ name, expiresInDays: 30|90|365|null }` → the full `evx_live_…` token **once**
(`evx_live_` + 40 hex characters; stored as SHA-256 + a short prefix for display; max 20 active), `POST /api-tokens/:id/revoke`.

**REST API** (`controllers/ext-api-controller.ts`), `requireApiToken` + 120 requests/min per token. Response shapes are
fixed by small mapper functions so internal schema changes don't break integrations; **keep them backwards compatible**
(documented publicly at `/developers`, `src/pages/Developers.tsx`). Writes are logged as "via API (token name)".

| Endpoint | What |
|---|---|
| `GET /ext/events?status=upcoming\|active\|completed\|draft\|archived&page=&limit=` | Events. |
| `GET /ext/events/:id` | One event. |
| `GET /ext/events/:id/registrations?status=&search=&page=&limit=` | Registrations. |
| `POST /ext/events/:id/registrations` `{ name, email, phone?, department?, rollNo?, category?, sendTicket? }` | Register someone (`API`), category by label, optional ticket email. |
| `GET /ext/registrations/:id`, `PATCH /ext/registrations/:id` `{ status }` | Read / change status (lowercase names). Attended → auto-issue. |
| `POST /ext/check-in` `{ code, eventId? }` | Same rules as the dashboard scanner. |
| `GET /ext/events/:id/certificates`, `GET /ext/certificates/:code` | Certificates of your organization. |

---

## Superadmin (`routes/superadmin-routes.ts`, `controllers/superadmin/*`)

All behind `superAdminOnly`. Uses the base `prisma` client (cross-tenant). Platform actions are logged with
`organizationId = null`; actions about a tenant use `entityType: "Organization", entityId`.

### `dashboard-controller.ts`
`GET /superadmin/dashboard`: tenant counts by status, revenue (confirmed payments, by confirmation date: this month, year,
all time), platform totals, sign-ups per month, "needs attention" items, recent platform activity.

### `tenants-controller.ts`
| Endpoint | What |
|---|---|
| `GET /tenants?search=&status=&planId=&from=&to=&sort=&page=&limit=`, `/tenants/stats`, `/tenants/export` | List (search also matches members' emails), counts per status, CSV. |
| `POST /tenants` | Creates org + first admin with a generated temporary password (returned once, no email). |
| `GET /tenants/:id` | Drill-down: usage, subscription, seats, team, payments, events, recent activity. |
| `PATCH /tenants/:id` `{ name?, email?, phone? }` | Edit contact details. |
| `POST /tenants/:id/plan` `{ planId }` | Change plan (nobody removed). |
| `POST /tenants/:id/extend` `{ days }` or `{ until }` | Days are added to the later of now and the current end; status becomes the natural one (suspended stays suspended). |
| `POST /tenants/:id/suspend` `{ reason }`, `/unsuspend` | Suspend with a visible reason; unsuspend → natural status. |
| `POST /tenants/:id/impersonate` | 1-hour token as the org's oldest active admin (`imp` = superadmin id). |
| `DELETE /tenants/:id` `{ confirm: "<exact name>" }` | Deletes the org (cascade) and its files. |

### `payments-controller.ts`
`GET /payments` (filters: status, method, plan, org, search, dates), `/payments/stats`, `/payments/export`, `GET /revenue`
(12-month chart, by plan, by method, outstanding list).
`POST /payments/:id/confirm { note?, notify? }`: only pending; the period starts at the org's current end if it is
`active` and still running, otherwise now; +1 year; org gets the payment's plan and `active` (suspended stays suspended);
optional renewal email to admins. `POST /payments/:id/reject { note (required), notify? }`: stores the reason in
`reviewNote`, optional notice email.

### `plans-controller.ts`
`PLAN_FEATURES` lists the on/off features. `GET /superadmin/plans` (with tenant counts), `POST`, `PATCH /:id`,
`DELETE /:id` (only unused plans); public `GET /plans` (visible, ordered).

### `users-controller.ts`
`GET /users?search=&role=&orgId=&status=`, `/users/stats`, `/users/export`, `GET /users/:id` (profile, recent activity,
recent logins). `POST /users/:id/disable` (also bumps `tokenVersion`), `/enable`, `/logout`,
`/reset-password { mode: "link" | "temporary" }`, `/reset-2fa`. None of these work on yourself or another superadmin.

### `certificates-controller.ts` (platform)
`GET /certificates?search=&status=&type=&orgId=&eventId=`, `/stats`, `/events?orgId=` (for the bulk picker),
`/templates`, `/preview?templateKey=`, `GET /:id` (with integrity check: re-hash of the frozen facts),
`/:id/pdf` (not counted), `POST /:id/revoke { reason }`, `/:id/restore`,
`POST /certificates/bulk-revoke { eventId | orgId, reason, dryRun? }` (dry run returns the count first).

### `analytics-controller.ts`
`GET /analytics` (platform numbers), `/analytics/report` (PDF via ReportKit), `/analytics/export?dataset=monthly|plans|organizations|events` (CSV).

### `settings-controller.ts`
Settings are flat keys validated by a per-key zod map (unknown keys rejected): `platform.name`, `platform.logoUrl`,
`platform.faviconUrl`, `trial.days`, `uploads.maxMb`, `certificates.defaultTemplate`, `contact.email|whatsapp|hours`,
`payments.accounts`, `banner`, `seo`, `maintenance.enabled|message`, `website.*` (stats switch, testimonials, logos, social).
`GET /superadmin/settings`, `PATCH /superadmin/settings { key: value, … }` (clears the cache),
`POST /superadmin/uploads?kind=logo|favicon`. Public: `GET /platform` (what every page needs: name, logo, favicon, banner,
maintenance, SEO, trial days, upload limit, contact, social) and `GET /platform/website` (home-page stats if enabled,
testimonials, logos).

### `emails-controller.ts`
`GET /emails` (each template: default or edited, variables), `PUT /emails/:type { subject, bodyHtml }`,
`DELETE /emails/:type` (reset), `POST /emails/:type/preview` and `/test` (render unsaved edits with sample values; test goes
to the logged-in superadmin). SMTP: `GET /smtp` (never returns the password), `PUT /smtp { host, port, user, pass?, from? }`
(password encrypted; empty keeps the old one), `DELETE /smtp`, `POST /smtp/verify`.

### `security-controller.ts`
`GET /security/overview` (24-hour logins/failures, suspicious IPs: 10+ failures or 3+ different emails, currently locked
accounts, recent sessions), `/security/activity` (+ `/export`, up to 20,000 rows), `/security/logins`.

### `maintenance-controller.ts`
`GET /maintenance` (version from `package.json` + git commit, Node version, uptime, maintenance flags, health checks:
DB latency, disk/folder sizes, mail status, job status), `POST /maintenance/jobs/:name/run`, `/cache/clear`,
`GET|DELETE /maintenance/errors`, `GET|POST /maintenance/backups` (runs `mysqldump` with the password in the environment,
never on the command line; `MYSQLDUMP_PATH` or common install paths), `GET /maintenance/backups/:file` (name validated).

### `announcements-controller.ts`
`GET /announcements?status=`, `/stats`, `/audience?planId=` (reach), `POST { title, body, targetPlanId, sendEmail, sendInApp,
mode: now|schedule|draft, scheduledAt? }`, `PATCH /:id` (drafts/scheduled), `POST /:id/send`, `/:id/unschedule`,
`DELETE /:id` (not sent ones). Delivery is in `services/announcements.ts`.

---

## Activity action codes

`logActivity` codes in use (the frontend's `src/lib/activityText.ts` must have a sentence for each):

`auth.register`, `auth.login`, `auth.logout.all`, `auth.email.verify`, `auth.password.change`, `auth.password.reset`,
`auth.profile.update`, `auth.2fa.*` · `org.settings.update`, `org.data.delete`, `org.close` · `team.invite`,
`team.invite.accept|cancel|resend`, `team.role.update`, `team.remove` · `event.create|update|delete|archive|restore|duplicate`,
`event.attendance.summary` · `speaker.*`, `sponsor.*`, `session.*` · `registration.create|delete|status|self|email|export|csv_import`,
`registration.bulk.<action>` · `ticket.checkin`, `ticket.checkin.undo`, `ticket.email`, `ticket.email.bulk`, `ticket.zip` ·
`certificate.issue|bulk|email|email.bulk|revoke|restore` · `idcard.generate` · `analytics.report` · `upload.image` ·
`billing.payment.submit|cancel`, `billing.expiry.reminder` · `support.request` · `api.token.create|revoke` ·
superadmin: `tenant.*`, `payment.confirm|reject|export`, `plan.*`, `user.*`, `platform.certificate.*`, `platform.analytics.*`,
`settings.update`, `email.template.*`, `email.smtp.*`, `security.export`, `maintenance.*`, `announcement.*`.
