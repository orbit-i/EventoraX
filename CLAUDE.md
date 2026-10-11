# EventoraX — Project Guide for Claude Code

**Full requirements:** `docs/requirements.md`. Read the relevant section before starting a new area.

EventoraX is a **multi-tenant event management SaaS** for Pakistani universities and organizations
(events, registrations, QR tickets, certificates, ID cards, analytics, billing, superadmin).
This repo consolidates 17 fragmented team branches into one clean codebase.

---

## 🚨 Hard rules (never break)

1. **Work only on the `integration/v1` branch.** Never commit to, merge into, rebase, or push any other branch.
   Reading another branch is fine: `git show <branch-or-commit>:<path>`.
2. **Before any destructive action** (deleting data, `git reset --hard`, force push, dropping tables,
   `prisma migrate reset`), stop and ask.
3. **Every change must pass the checks** before reporting it done:
   - Backend: `cd backend && npx tsc --noEmit` (no output = pass)
   - Frontend: `npm run build` (repo root; a chunk-size warning is fine)
   - Periodically: `npx knip` (root) and `cd backend && npx knip` (both print nothing when clean; CI runs all four)
4. **Commit after each completed step** using Conventional Commits:
   `feat(scope): …`, `fix(scope): …`, `chore: …`, `docs: …`
5. The user is a student building up his skills. **Explain what you changed and why** in plain language,
   step by step. When he must do something manually (Prisma Studio, `.env`, testing in the browser),
   give exact click-by-click instructions.
6. Build to a **mature-product standard**: loading/empty/error states, confirmations for destructive
   actions, field-level validation errors, role-aware UI, URL-synced filters, toasts with Undo where it makes sense.

---

## Stack & running locally

| Part | Tech |
|---|---|
| Frontend (repo root) | Vite 7, React 19, TypeScript, Tailwind 3, shadcn/ui (Radix), React Router 7 (data router), react-hook-form + zod, sonner, recharts, dnd-kit |
| Backend (`backend/`) | Node, Express 5, TypeScript (tsx watch), Prisma 7 + MariaDB adapter, MySQL 8, zod, JWT, bcrypt, multer, nodemailer, exceljs, papaparse, express-rate-limit |

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend && npm run dev
# Terminal 2 — frontend (http://localhost:5173, proxies /api and /uploads to :5000)
npm run dev
```

- **Backend env** (`backend/.env`): `DATABASE_URL`, `DB_HOST/PORT/USER/PASSWORD/NAME`, `JWT_SECRET` (32+ chars),
  `PORT=5000`, `FRONTEND_URL=http://localhost:5173`, `EMAIL_HOST/PORT/USER/PASS/FROM`, `UPLOAD_DIR=uploads`,
  `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_PASSWORD`. **No Supabase** (removed).
- **Email:** with `EMAIL_USER/PASS` empty, emails print to the backend terminal as `DEV EMAIL` (links + attachment names).
  **The local `.env` now has real Gmail SMTP (app password) → emails are really sent.** Use `willkariim+<anything>@gmail.com`
  addresses for test attendees; never email made-up domains. Restart the backend after editing `.env`.
- **Demo data:** `cd backend && npm run seed:demo -- --yes` wipes ALL organizations (+ their uploads/private files) and builds
  "Margalla University Computer Society" (Pro, active): 5 team members + pending invite, 7 events in every status,
  ~125 registrations (all sources/statuses), tickets with check-ins, ~37 real certificate PDFs (1 revoked), speakers,
  sponsors, schedule, payments, activity, support messages. Login `willkariim@gmail.com` / `Demo@12345` (admin);
  `willkariim+hira` (admin), `+usman`/`+ayesha` (manager), `+bilal` (viewer), same password. Never sends email.
  Plans/settings/superadmin are kept. Back up first if the data matters (local backups go in `backups/`, git-ignored).
- **After `npm install` of a new frontend package, restart `npm run dev`** (Vite pre-bundles deps at start → 504
  "Outdated Optimize Dep" and an in-app 404 otherwise).
- **Manual API tests:** `backend/api-tests.http` (VS Code REST Client). Variables: `{{baseUrl}}`, `{{token}}`, `{{eventId}}`, etc.
- **Docs:** `docs/product-guide/` (users, by role, screenshots in `screenshots/`), `docs/handover.md` (placeholders to replace
  before launch), `docs/technical/` (developer docs, progress checklist in its README), `docs/manual-testing.md` (click-by-click
  test scripts per area). Update the matching doc when a feature changes.
- **Prisma:** `npx prisma migrate dev --name <name>`, `npx prisma generate`, `npx prisma db seed`, `npx prisma studio`.
- **Windows gotcha:** case-only renames need two steps (`git mv A tmp && git mv tmp a`).

---

## Product decisions (already agreed)

- Plans (seeded): **Pro PKR 20,000/yr** (max 3 admins, 7 managers), **Enterprise PKR 25,000/yr** (unlimited, white-label, custom domain).
- New orgs get a **1-day Pro trial** (`trial.days` system setting). Expired orgs: overview, billing, settings
  and support still work; everything else returns `402 ORG_EXPIRED`. Nothing is deleted.
- **Payments are manual only:** JazzCash / Easypaisa / bank transfer. The org submits a transaction ID + receipt;
  the **superadmin confirms** (Phase 10). No payment gateway.
- **Certificates:** 10 layouts × 5 colours + a "brand" colour per layout = 60 templates (key `<layout>-<variant>`).
  PARTICIPATION/ACHIEVEMENT need ATTENDED; other types any non-cancelled registration. One certificate per
  registration per type. Revoke keeps the record (public verify shows REVOKED + reason); restore undoes it.
- **Tickets:** every registration has one. QR content is `EVXT:<qrCode>`. Check-in (scan or typed `TKT-…`) marks
  the ticket used AND the registration ATTENDED (→ certificate auto-issue if the event has it on). First scan wins.
- **Add a public event page with self-registration** (Phase 11). The spec implies it: `displayPublic` toggles, "Public User: register".
- Roles: `superAdmin` (platform, `organizationId = null`), `admin`, `manager`, `viewer` (read-only).
- Registration statuses: REGISTERED, ATTENDED, ABSENT (keeps the seat), **CANCELLED (frees the seat;
  no certificate/emails; restorable if seats allow)**.
- Events with registrations are **archived, never hard-deleted** (`status = ARCHIVED`, restorable).
- Spec wording: PUBLISHED → "Upcoming", ONGOING → "Active", OFFLINE → "Physical". Money is always **PKR**.
- **Extending / confirming payments** adds time to the later of today and the current end date (paying early never loses days).
  An extended expired org becomes `active` if it has ever paid, else `trial`. Reactivating a suspended org gives its natural status.
- Changing an org's plan never removes people; limits apply to new invites. A plan in use can't be deleted (hide it instead).
- Deleting a tenant is real (with files) but needs the exact name typed; the UI recommends suspending.
- Bulk certificate revoke is limited to one event or one organization, with a count check first.
- No "unlock now" for locked accounts (locks expire after 15 minutes); IP blocking is left to the server/firewall.
- ID card design choice is remembered in the browser (localStorage), not the URL. Cards show initials (no photo field);
  cancelled registrations get no card. CR80 portrait, 9 per A4.
- Email templates are edited as HTML with a toolbar + live preview (no WYSIWYG library).
- Public registration limit is 60/hour per IP because a campus Wi-Fi shares one IP.

---

## Backend architecture (`backend/src`)

```
index.ts            app setup (helmet CSP, apiLimiter), route mounting, /uploads static, JSON 404, mountWebApp, error handler
web/spa.ts          serves the built site (dist/) + SPA fallback; writes link-preview tags (og/twitter) into the HTML for
                    /e/:id, /o/:slug, /verify/:code (org logo or public/og-image.png); missing files → 404; skipped if no dist/
pdf/                assets (fonts from @fontsource WOFF, loadImage PNG/JPEG only, toBuffer), certificate (60 templates,
                    renderCertificate), ticket (A6 ticket, TICKET_QR_PREFIX), idcard (4 CR80 templates, sheet/single),
                    report (ReportKit: header/kpis/barChart/hBars/table/columns/footer + renderAnalyticsReport)
services/           certificates (verify code, SHA-256 over frozen facts, issue/email/autoIssueForAttended, private PDF
                    storage), tickets (ticket PDF/email, parseScanned), announcements (deliverAnnouncement, sendDueAnnouncements),
                    orgNotifications (notifyNewRegistration / notifyCertificatesSent / notifyAttendanceSummary — follow notificationPrefs,
                    email + bell for active admins)
jobs/               in-process scheduler (registerJob/runJob/startScheduler, started in index.ts): expire-orgs (10 min),
                    expiry-reminders (6 h, 3 days before the end, once per end date), announcements (1 min),
                    attendance-summaries (30 min, once per ended event; marked even when the pref is off)
prisma/seed.ts      plans, settings, superadmin    prisma/seed-demo.ts  demo organization (see above)
prisma/reset-2fa.ts `npm run reset-2fa -- <email>`: turns off two-factor login from the server (superadmin lost phone + codes)
prisma/client.ts    default export `prisma` (base client)
prisma/scopedClient.ts   org-scoped client: auto-injects organizationId into queries for org models
middleware/
  auth.ts           requireAuth (verifies JWT + re-checks user/tokenVersion in DB on every request)
  checkOrgStatus.ts loads req.org (+plan), auto-expires trials; option { allowExpired }
  scopedPrisma.ts   attaches req.db (scoped client)
  role-check.auth.ts requireRole(["admin", ...])
  orgChain.ts       orgScoped, orgScopedAllowExpired, canWrite (blocks viewers), adminOnly, superAdminOnly
  apiToken.ts       requireApiToken (Bearer evx_live_…, SHA-256 lookup, plan features.restApi, sets req.org/req.db/req.apiToken)
  maintenance.ts    maintenanceGate: 503 MAINTENANCE for non-superadmins when maintenance.enabled (auth, superadmin,
                    verify, contact, plans, platform stay open)
controllers/        auth (in routes/auth-route.ts), org, team, events, program (speakers/sponsors/sessions/reorder),
                    registrations, dashboard (overview + analytics), activity, billing, support (contact + support),
                    certificates (incl. public verify), tickets (incl. check-in), idcards, notifications (bell),
                    public (org page, event page, self-registration), api-tokens, ext-api (public REST API),
                    superadmin/* (dashboard, tenants, plans, payments, users, certificates, analytics, settings, emails,
                    security, maintenance, announcements)
routes/             one router file per area; mounted under /api/v1
utils/              http (ok/fail/validationFail/pagination/q), schemas (optionalText/optionalUrl/optionalImage/
                    parseDate/isUniqueViolation/isOneOf), activity (logActivity), mail (sendMail/escapeHtml + templates),
                    storage (saveUpload/deleteUpload/deleteUploadFolder + PRIVATE files: savePrivate/readPrivate/
                    deletePrivateFolder in backend/private-files, never served statically), upload (multer imageUpload/csvUpload),
                    settings (getSetting/setSetting, 30 s cache, clearSettingsCache), tokens, jwt (+ signImpersonationToken),
                    password, roleLimit, codes (refNo/ticketNo/qr), csv (csvCell/toCsv), emailTemplates (10 editable
                    templates: {{var}}, {{{rawVar}}}, {{button "Label" linkVar}}), orgStatus (expireOverdueOrgs/naturalStatus),
                    months (monthStart/fillMonths), orgContacts (orgAdminEmails), errorLog (recordError → error_logs),
                    rateLimits (login/twoFactor/register/password/emailLink/invite/api limiters, JSON 429),
                    secrets (encryptSecret/decryptSecret AES-256-GCM, "enc:v1:" prefix; key = ENCRYPTION_KEY or derived from
                    JWT_SECRET; used for the SMTP password and 2FA secrets), totp (RFC 6238 codes, otpauth URL, recovery codes)
```

**Conventions**
- In org routes use `req.db!` (scoped). `req.org!` = organization + plan. `req.user!` = `{ userId, email, name, role, organizationId }`.
  Use base `prisma` only for platform tables (plans, settings) or raw SQL (always filter `organizationId` yourself).
- Validate input with **zod**. Return with `ok(res, data, status?, meta?)` / `fail(res, status, CODE, message, { fieldErrors })` /
  `validationFail(res, zodError)`. Field errors are `Record<string, string>` so the UI can show them under each field.
- **Every endpoint except `/auth/*` uses the envelope** `{ data, error, meta }`. Auth routes still return plain JSON
  (`{ error, code, fieldErrors }`); the frontend client handles both.
- Log meaningful actions with `logActivity(req, { action: "area.verb", entityType, entityId, metadata })`.
  The frontend turns action codes into sentences in `src/lib/activityText.ts`. Add a case there for new actions.
- Lists: `pagination(query, max)` + `meta: { total, page, limit }`. Fixed paths (`/stats`, `/export`, `/bulk`) go before `/:id`.
- Tokens (reset/verify/invite) are stored only as SHA-256 hashes. Password changes bump `tokenVersion` (logs out other sessions).
- MySQL table names are lowercase via `@@map` (needed on Linux hosting). Column names = Prisma field names.
- Uploads go to local disk `uploads/orgs/<orgId>/<folder>` and are served at `/uploads/...`. Logo/signature must be
  PNG/JPEG (they're printed on PDFs). Certificate PDFs live in `private-files/orgs/<orgId>/certificates/` (API only).
- Long jobs (bulk emails) run in the background after the response (`void (async () => …)()`), errors only logged.
- **Emails** always go through `renderEmail(type, vars)` (DB template or built-in default) — add new system emails as a
  template in `utils/emailTemplates.ts`. SMTP: System settings `smtp` → else `.env` → else printed as DEV EMAIL.
- **Impersonation** ("log in as"): JWT with `imp = superadminId`, 1 h; `req.user.impersonatorId`; logActivity adds
  `impersonatedBy`; password change is blocked. Frontend keeps it in sessionStorage (this tab only).
- 5xx errors are saved to `error_logs` by the error handler (Superadmin → Maintenance).
- Platform actions are logged with `organizationId = null`; when they concern a tenant use `entityType: "Organization", entityId`.
  Generic pre-upload: `POST /api/v1/uploads/image?kind=speaker|sponsor|logo|signature|payment` → `{ url }`.

**Mounted API (`/api/v1`)**: health, auth, org, team, events (+ /stats, /:id/stats, /:id/restore, /:id/duplicate),
categories, speakers, sponsors, sessions, reorder, registrations (+ /:id/status, /bulk, /export, /email,
/csv-import/parse, /csv-import/confirm with `dryRun` + `duplicateStrategy`), uploads, dashboard/overview, analytics,
activity (+ /export), billing (+ /payments), support, contact (public, rate-limited 5/h) + GET contact/info (public),
team (+ /invite, /invites/:id/resend, /invites/:id), PATCH org/me (incl. logoUrl/signatureUrl from the generic upload),
org/me/delete-data, org/me/close (name + password confirmation), PATCH auth/me,
idcards (+ /options, /stats, /preview, /pdf), analytics/report (PDF),
certificates (+ /templates, /preview, /stats, /candidates, /bulk, /email, /:id/pdf, /:id/email, /:id/revoke, /:id/restore),
verify/:code and verify/:code/pdf (public, 30/min), tickets (+ /stats, /zip, /email, /check-in, /:id/pdf, /:id/email,
/:id/undo-check-in), notifications (+ /:id/read, /read-all), public GET platform (name, banner, maintenance, SEO, upload
limit, social) + GET platform/website (stats/testimonials/logos) and GET plans (visible plans),
public/orgs/:slug, public/events/:id, POST public/events/:id/register (60/h per IP, honeypot `website`),
api-tokens (GET/POST, /:id/revoke — admin + Enterprise).
**REST API (`/api/v1/ext`, API token, 120/min per token, documented at `/developers` — keep shapes backwards compatible)**:
GET events, events/:id, events/:id/registrations, events/:id/certificates, registrations/:id, certificates/:code;
POST events/:id/registrations, check-in; PATCH registrations/:id (status).
**Superadmin (`/api/v1/superadmin`, superAdminOnly)**: dashboard; tenants (+ /stats, /export, POST create, /:id, PATCH,
/:id/plan, /:id/extend, /:id/suspend, /:id/unsuspend, /:id/impersonate, DELETE with `confirm` = exact name); plans CRUD;
revenue; payments (+ /stats, /export, /:id/confirm, /:id/reject — `notify` flag); users (+ /stats, /export, /:id,
/:id/disable, /:id/enable, /:id/logout, /:id/reset-password `mode: link|temporary`); certificates (+ /stats, /events,
/templates, /preview, /bulk-revoke with dryRun, /:id, /:id/pdf, /:id/revoke, /:id/restore); analytics (+ /report PDF,
/export?dataset=); settings (GET/PATCH flat keys) + uploads?kind=logo|favicon; emails (+ PUT/DELETE /:type, /:type/preview,
/:type/test); smtp (GET/PUT/DELETE, /verify); security (/overview, /activity, /activity/export, /logins); maintenance
(+ /jobs/:name/run, /cache/clear, /errors GET/DELETE, /backups GET/POST, /backups/:file); announcements (+ /stats,
/audience, POST, PATCH /:id, /:id/send, /:id/unschedule, DELETE /:id).
- Uploads for `payment`, `logo` and `signature` still work when the plan has expired; other kinds return 402.

---

## Frontend architecture (`src/`)

```
main.tsx            createBrowserRouter([{ path: "*", element: <PlatformProvider><AuthProvider><ConfirmProvider><App/> }]) — data router (needed by useBlocker)
App.tsx             all routes (<Routes>); writer(page) wraps create/edit pages (admins + managers only)
context/AuthContext.tsx   user, organization, impersonator, status, login/register/acceptInvite/logout/refresh,
                    impersonate/stopImpersonating; homeFor(user)
context/PlatformContext.tsx  GET /platform every 60 s + on any 503 MAINTENANCE: banner, maintenance, favicon/title/SEO, maxUploadMb, social
lib/api.ts          api.get/list/getList/post/patch/delete/upload/download/blob, buildQuery, ApiError, errorMessage, tokenStore
lib/status.ts       ONE place for every status label + colour (event, mode, registration, tier, org, role, payment, cert, certType, visibility)
lib/format.ts       formatDate/DateTime/Time/PKR/Duration/Relative/TimeLeft/Month, plural  (locale en-PK)
lib/permissions.ts  useCan()("write" | "manage")   write = admin/manager, manage = admin
lib/                validation.ts (zod email/password/phone), date.ts (datetime-local), csv.ts (downloadCsv), activityText.ts,
                    contact.ts (whatsappLink)
hooks/              useApi (cancellable fetch, reload, initialLoading), useUrlState (filters in URL; resets page),
                    useSelectedEvent (eventId in URL + remembered), useUnsavedChanges (useBlocker + beforeunload),
                    useVisibilityToggle (show/hide public with Undo), useNow
components/ui/      shadcn primitives + our button.tsx + form-fields.tsx (TextField, PasswordField, SelectField, TextareaField)
components/app/     PageHeader, EventPicker, StatsRow/StatCard, SegmentedTabs, Toolbar (SearchInput, FilterSelect,
                    FilterChips, ViewToggle), ServerTable, CardGrid, PaginationBar, BulkActionBar, RowActions,
                    StatusBadge, States (EmptyState, NoResults, ErrorState), ConfirmDialog (useConfirm), RoleGate,
                    Avatar, ReorderList, Panel/PanelLink (titled card), DateRangeFilter (+ dayStart/dayEnd), form/ (FormLayout: FormSection, FullWidth, SwitchField, FormFooter;
                    ImageUploadField; serverErrors.applyServerErrors)
components/layout/  DashboardLayout, Sidebar (grouped nav, collapsible, plan card; variant="platform" for superadmin),
                    Topbar (account menu, NotificationBell; variant), AccountBanners (trial / expiring / expired / verify email),
                    ImpersonationBanner, SiteBanner (sitewide banner), MaintenanceScreen, nav.ts (NAV + SUPERADMIN_NAV)
components/<feature>/  home (landing page sections), events, registrations, speakers, sponsors, sessions, team (InviteDialog, roles), settings (one file
                    per tab + shared SaveBar/saveOrg), billing (PayDialog, paymentInfo), certificates (TemplatePickerDialog,
                    IssueDialogs, pdf.ts usePdfUrl/openPdf), tickets (QrCode, TicketDialog), idcards (DesignPanel, design.ts),
                    superadmin (SuperadminLayout, ActivityFeed, TenantDialogs + OneTimeSecret, PaymentReviewDialog,
                    useImpersonate, WebsiteContentPanel), public (plans: usePublicPlans/PlanCards/PlanComparison/PaymentBadges,
                    SocialLinks, LegalPage, PublicShell), events/PublicLinkCard — feature forms and pieces
pages/              public pages (root; Developers = API docs), public/ (EventPage /e/:id, OrgPage /o/:slug — bare layout via
                    PublicShell), auth pages, dashboard/ApiPage, dashboard/*Page.tsx + dashboard/<module>/*Page.tsx, superadmin/
                    (Dashboard, Tenants, TenantDetail, Revenue, Plans, Users, PlatformCertificates, PlatformAnalytics,
                    SystemSettings, EmailTemplates, Security, Maintenance, Announcements),
                    dev/ (ComponentGallery at /dev/components)
types/              API shapes (auth, event, registration, speaker, sponsor, session, dashboard, team, billing, certificate, ticket,
                    idcard, platform, superadmin, website, public)
```

**Page templates (follow them for every new page)**
- **List page:** PageHeader (breadcrumbs, actions in `RoleGate`) → EventPicker (event-scoped modules) → StatsRow (server stats)
  → SegmentedTabs/Toolbar (state via `useUrlState`) → FilterChips → BulkActionBar → ServerTable/CardGrid →
  PaginationBar; with ErrorState / NoResults / EmptyState.
- **Form page:** RHF + zodResolver; fields from `ui/form-fields`; `FormSection`s; `applyServerErrors(err, setError)`;
  `useUnsavedChanges(isDirty && goTo === null)`; after saving, `setGoTo(url)` and navigate in a `useEffect`
  (so the unsaved guard doesn't fire); a toast on success. `FormFooter` sits at the end of the form (not sticky).
- **Page descriptions** (the line under the PageHeader title): list and overview pages only, never on form pages
  (New / Edit, the title says it). Exactly one plain sentence, about 60 characters max, starting with a verb or "Your…",
  saying what you do on the page, e.g. "Issue, email and revoke certificates for an event." No dashes, no parentheses,
  no lists of more than three things, no filler ("everything", "at a glance", "here to help"). Detail pages show facts instead
  (date, slug).
- **Copy style everywhere** (toasts, dialogs, empty states, emails, API errors): short plain sentences. Don't use the long
  dash "—" to join clauses: use a period, a comma or a colon; "·" separates items in labels, "|" in browser-tab titles.
  The lone "—" is fine only as the placeholder for an empty value in tables; "–" is correct in ranges ("6:00 pm – 9:30 pm").
- **Destructive actions:** `await confirm({ title, description, confirmLabel, tone: "danger" })`.
- Viewers never see write actions. Archived events are read-only.
- **Tabbed settings-style pages:** keep every tab mounted (hidden), each tab reports `onDirtyChange`, the page owns ONE
  `useUnsavedChanges` (react-router allows only one blocker at a time).
- Page padding comes from `DashboardLayout` (`p-4 sm:p-6`); pages don't add their own.
- **Colours:** brand `#7c3aed` (hover `#6d28d9`), text `#0f172a`, muted `#64748b`/`#94a3b8`, borders `#e9e4ff`,
  page background `#f3f0ff`, cards white with `rounded-2xl border shadow-sm`.

---

## Status (as of this handoff)

✅ **Done:** branch audit; backend base + unified Prisma schema (23 tables incl. `error_logs`) + seed; secure auth (register/trial,
login with lockout + remember-me, verify, reset, change password, logout-all, invites); org/team API; events
module API; shared components; real auth pages; the whole **events module UI rebuilt on the design system**
(events list + hub + form, registrations + CSV import wizard with dry-run review, speakers, sponsors, schedule,
reorder); **Phase 8 complete**: dashboard layout + Overview (8B), Analytics, Activity log, Help & support, public
contact form (8C), Team, Settings (6 tabs), Billing with manual payments (8D); old mock pages and unused UI files
removed; knip clean.
**Phase 9 complete:** 9A certificate engine, 9B Certificates page + design picker + public `/verify`,
9C QR tickets + Tickets page + camera check-in scanner (`/dashboard/tickets/scan`, qr-scanner; needs https or
localhost for the camera), 9D ID cards (`/dashboard/idcards`: 4 templates, field choice, logo, 9-per-A4 sheet or one per page,
print tracking in `IdCard`), 9E Analytics PDF report (`GET /analytics/report`, `pdf/report.ts` ReportKit — reuse it for
other PDF reports). Event form has the certificate design picker. Demo seed added.

**Phase 10 complete (superadmin panel, `/superadmin`):** 10A layout + platform dashboard + tenants (list, detail,
add by hand with temporary password, change plan, extend, suspend/reactivate with reason, delete with typed name, log in
as admin), 10B payment confirmation/rejection (+ emails, plan +1 year from the later of today / current end), revenue
charts + outstanding list, plans CRUD + feature matrix, public `GET /plans`, 10C users (disable/enable, force logout,
reset link or temporary password), global certificates (revoke/restore, bulk revoke with count check), platform analytics
(PDF + CSV), 10D system settings (branding, contact, payments, banner, SEO, upload limit, default certificate design,
superadmin's own account), maintenance mode (gate + screen), sitewide banner, editable email templates (all system emails
use them) + SMTP settings, security page (activity log, login attempts, suspicious IPs, locked accounts, sessions),
maintenance page (health, scheduled jobs, error logs, cache, mysqldump backups), announcements (in-app + email,
schedule/draft) + notification bell. Manual test steps: `docs/manual-testing.md`.

**Phase 11 complete:** 11A honest, data-driven public website (PKR plans from the DB, comparison table, real FAQ/features,
testimonials/logos/social/live stats managed in System settings → Website, real Terms & Privacy), 11B public event page
`/e/:id` + org page `/o/:slug` + self-registration (QR ticket on screen + confirmation email with PDF, rate limit + honeypot,
"Public page" card with poster QR in the dashboard), 11C org notification emails (new registration, attendance summary job,
certificate batches; email + bell), 11D API tokens (`/dashboard/api`) + REST API `/api/v1/ext` + docs `/developers`.

**Phase 12 (part 1) done:** helmet security headers with a content policy (HSTS + upgrade-insecure only in production),
rate limits on every sensitive auth route + 600/min on the whole API, SMTP password encrypted at rest, **two-factor login**
for every account (authenticator app + 10 one-time recovery codes; Settings → My account → Two-factor login; login has a
second "code" step; superadmin can reset it for a user on Users; `npm run reset-2fa` on the server), **code splitting**
(every page is `React.lazy` in App.tsx, libraries grouped in `vite.config.ts` manualChunks: react / ui / icons / charts /
forms; home first load 2.4 MB → 0.74 MB, the three.js hero waves load after the text), **link previews** (backend serves
`dist/` with per-page og/twitter tags, `web/spa.ts`). Open tabs reload once if a page file vanished after a deploy
(`vite:preloadError` in main.tsx).
- 2FA flow: `POST /auth/login` → `{ twoFactorRequired, challengeToken }` (5-minute JWT signed with a separate secret, never a
  session) → `POST /auth/login/2fa { challengeToken, code }`. Login attempts are recorded only after the second factor.
  Management: `/auth/2fa/setup|enable|disable|recovery-codes` (not while impersonating); `POST /superadmin/users/:id/reset-2fa`.
- Try the production setup locally: `npm run build` (root), restart the backend, open http://localhost:5000.
  To see the preview tags: `curl -s http://localhost:5000/e/<eventId> | findstr og:` (or grep).

Notes for later phases:
- Analytics shows the generic 402 error for expired orgs; a friendlier "renew to see analytics" screen would be nicer.
- Phones can't use the scanner over plain http on the LAN — works once deployed with https (Phase 12).
- Gmail SMTP allows ~500 emails/day; use a transactional email service in production (Phase 12).
- Link previews need the public URL: set `FRONTEND_URL` to the real https address in production (used for og:url/og:image).
- Background jobs run inside the API process — fine for one server; move to a worker if the app is ever scaled out.
- Terms/Privacy are a good-faith draft — have them reviewed before launch.
- `npx eslint .` reports ~80 pre-existing findings (mostly the new React-Compiler hook rules such as set-state-in-effect).
  ESLint is not part of the checks yet; fix them gradually, never with blanket disables.

**Clean-up (2026-10-11):** removed one-off scripts (`tools/`, `.bat` files), the night log (test steps moved to
`docs/manual-testing.md`, decisions to "Product decisions" above), the stale backend-only Dockerfile and the broken Docker Hub
workflow (replaced by `.github/workflows/ci.yml`: build + typecheck + knip), unused avatars and `ui/scroll-area`/`ui/separator`.
Home page sections moved from `src/sections/` to `src/components/home/`. Spec renamed to `docs/requirements.md`.

## Remaining work

**12 (rest)** — Docker (write a fresh multi-stage image that builds the website AND the API; the old one built only the API),
Hostinger deployment (the backend already serves the built site, see `web/spa.ts`; set
`NODE_ENV=production`, `FRONTEND_URL`, optionally `ENCRYPTION_KEY`), https, transactional email service, scheduled backups,
final knip, then move the repo to its own GitHub repository. Placeholders to swap before launch: `docs/handover.md`.
**Docs** are complete (product guide, handover, technical, manual tests): keep them in step with code changes.