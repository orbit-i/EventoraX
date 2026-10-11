# Night log — autonomous run (2026-10-11)

## Summary (read this first)

**All three tasks are done and pushed to `integration/v1`:** Phase 9D (ID cards), 9E (Analytics PDF report → Phase 9
complete) and the whole of Phase 10 (Superadmin panel) in 4 sub-steps (10A–10D, 10D split into 5 commits).
Every commit passed `cd backend && npx tsc --noEmit`, `npm run build` and knip (root + backend), and every new endpoint
was called against the running backend; pages were checked with screenshots in a headless Chrome.

**What you need to do / know**
1. **Restart the backend once** (`cd backend && npm run dev`) — it was running with `tsx watch` all night so it's fine, but a
   clean restart makes sure the new background jobs start fresh. No new npm packages were installed in the app.
2. **Database:** one additive migration `20261011015410_superadmin_panel` (new nullable columns + `error_logs` table) was
   applied to your local DB. On another machine run `cd backend && npx prisma migrate deploy` (or `migrate dev`).
3. **Superadmin login:** the account from `backend/.env` (`SEED_SUPERADMIN_EMAIL` = `you@example.com`, password from
   `SEED_SUPERADMIN_PASSWORD`). Change that email to a real inbox if you want "Send test to me" emails.
4. **Test data I left behind** (delete whenever you like): organization **"Night Pay Test"** (admin
   `willkariim+paytest@gmail.com`, with 1 pending, 1 confirmed and 1 rejected test payment), two test announcements, one
   "Night test error" in Maintenance → Error logs, one database backup file in `backups/`, 21 "printed" ID cards on
   "Startup Pitch Night". `npm run seed:demo -- --yes` resets all organizations if you prefer a clean slate.
5. **No real emails were sent.** Payment confirm/reject, announcements and resets have "email" switches — I always used
   them with email off. Careful when you test: emails to `willkariim+…@gmail.com` really arrive.

**Blocked / not done:** nothing blocked. Deliberate choices are listed per step below under "Decisions made for you".
Ideas left for later are in CLAUDE.md → "Notes for later phases".

**Commits (in order):** 9D ID cards · 9E analytics PDF · 10A tenants/impersonation · 10B payments/revenue/plans ·
10C users/certificates/analytics · 10D-1 settings/maintenance mode/banner · 10D-2 email templates/SMTP ·
10D-3 security · 10D-4 maintenance page/jobs/backups · 10D-5 announcements/notifications · final docs.

---

Tasks: Phase 9D (ID cards) → 9E (Analytics PDF report) → Phase 10 (Superadmin panel).
Every sub-step was checked with `cd backend && npx tsc --noEmit`, `npm run build`, `npx knip` (root + backend)
and quick API calls against the running backend before committing. No real emails were sent.

---

## 9D — ID cards ✅

**What was built**
- `backend/src/pdf/idcard.ts` — ID card PDF engine (pdfkit). Standard CR80 card size (54 × 85.6 mm, portrait).
  - **4 templates:** Classic (coloured header + logo), Sidebar (coloured band down the left), Minimal (white, thin accent line),
    Bold (full-colour card, white text). Colours come from the organization's brand colours (Settings → Branding).
  - **Fields you can switch on/off:** Category, Department, Roll no., Email, QR code. Name + event are always printed.
    The QR is the attendee's **ticket QR**, so the badge can be scanned at the door with the existing check-in scanner.
  - Optional organization logo.
  - **Two print layouts:** 9 cards per A4 page with crop marks (normal printer, cut by hand) or one card per page (card printers).
  - Long names shrink to fit; if there are too many detail lines for the space, the least important are left out (no overlaps).
- API `/api/v1/idcards` (all roles, viewers included — printing only reads data):
  - `GET /options` (templates + fields), `GET /?eventId=&search=&categoryId=&printed=yes|no` (attendee list with "printed" info),
    `GET /stats?eventId=`, `GET /preview?...` (sample people), `GET /pdf?eventId=&ids=&template=&fields=&logo=&layout=`
    (one / selected / all matching the filters; `inline=1` = just viewing, not counted as printed).
  - Each real download records an `IdCard` row per attendee (template + fields) → the list shows "Printed 5 min ago".
  - Activity log: `idcard.generate` ("printed 21 ID cards for "Startup Pitch Night"").
- Frontend `/dashboard/idcards` (sidebar → Credentials → **ID cards**): event picker, stats, **Card design** panel
  (4 template thumbnails, field checkboxes, logo switch, layout toggle, live PDF preview of a sample card, "Preview a full page"),
  attendee table with search / category / printed filters (in the URL), select rows → "Download selected cards",
  row menu → View card / Download card, header button "Download all cards" (or "Download N cards" when filtered).

**Decisions made for you**
- Card size = CR80 portrait (the normal ID-card size). 9 per A4 page.
- The design choice is remembered **in the browser** (localStorage), not in the URL, because it's a preference, not a filter.
- Registrations have no photo field, so cards show the attendee's initials in a circle instead of a photo.
- Cancelled registrations don't get cards.

**Test it (click by click)**
1. Start backend + frontend, log in as `willkariim@gmail.com` / `Demo@12345`.
2. Sidebar → **ID cards** → pick "Startup Pitch Night".
3. Click each template thumbnail — the preview on the right updates. Untick "QR code", tick "Email", toggle the logo.
4. Click **Preview a full page** → a new tab shows 3 sample cards on an A4 sheet with crop marks.
5. Click **Download all cards** → a PDF downloads; the "Cards printed" number and the "Card" column update.
6. Filter "Not printed yet", tick two rows → **Download selected cards**.
7. Row menu (⋯) → **View card** opens one card in a new tab (does not count as printed).
8. Print a sheet, scan a badge's QR with the Check-in scanner — it checks the attendee in.

---

## 9E — Analytics PDF report ✅ (Phase 9 is now complete)

**What was built**
- `backend/src/pdf/report.ts` — a small **ReportKit** for A4 PDF reports (header with logo, KPI tiles, monthly bar charts,
  horizontal bars, tables that continue on the next page with the header repeated, two-column blocks, "Page X of Y" footer).
  It's reused later for the superadmin reports.
- `GET /api/v1/analytics/report` → the same numbers as the Analytics page as a 2-page PDF: KPIs, registrations per month
  (12 months), events by status, registrations by status, attendance rate per event, category breakdown, how people
  registered, certificates per month, top events table. Uses the org's logo and brand colour. Logged as `analytics.report`.
- The analytics numbers were moved into one function (`analyticsData`) so the page and the PDF can never disagree.
- Analytics page: new **PDF report** button (top right) with a loading toast.

**Test it**
1. Sidebar → **Analytics** → click **PDF report** → `analytics-report-YYYY-MM-DD.pdf` downloads.
2. Open it: page 1 has the KPIs and charts, page 2 the certificate trend and top events.
3. Sidebar → **Activity log** shows "downloaded the analytics PDF report".

---

## 10A — Superadmin layout, dashboard, tenants (+ impersonation) ✅

**Database (additive migration `superadmin_panel`)** — new nullable/default columns only: `organizations.suspendedAt/suspendedReason`,
`payments.reviewNote`, `plans.description`, `announcements.orgCount/emailCount`, and a new `error_logs` table (used in 10D).
Nothing existing was changed or dropped.

**What was built**
- Superadmin panel at `/superadmin` with its own sidebar (Customers · Money · Insights · Platform) — the org Sidebar/Topbar
  now take a `variant="platform"` prop instead of being copied.
- **Dashboard** (`GET /superadmin/dashboard`): tenants by status (+ new this month), revenue this month / this year / all time
  (confirmed payments only), platform totals, sign-ups per month chart, "Needs attention" (pending payments, server errors,
  many failed logins, plans ending this week, recently expired), recent platform activity, quick actions
  (Add tenant, View logs, Send announcement).
- **Tenants** (`/superadmin/tenants`): status tabs with counts, search (name, slug or any member's email), plan filter,
  created-date range, sort, CSV export, pagination — all in the URL. Row menu: view, log in as admin, change plan,
  extend trial/plan, suspend (reason required) / reactivate, delete (must type the exact name).
- **Tenant detail** (`/superadmin/tenants/:id`): usage stats, subscription facts (seats used vs plan limits, time left),
  contact & branding, recent activity, team, payments, events, danger zone.
- **Add tenant** by hand: creates the org + first admin with a **temporary password shown once** (copy button). No email is sent.
- **Log in as admin (impersonation)**: a 1-hour token for the org's first admin, marked with the superadmin's id.
  A dark banner across the org dashboard says who you are viewing as, with **Back to superadmin**. The impersonation lives
  only in that browser tab; other tabs stay logged in as superadmin. Every action taken is logged with `impersonatedBy`
  (the activity feed shows "(via log in as)"). Password changes are blocked while impersonating. If the 1-hour token
  expires you are taken back to your superadmin session automatically.
- Shared helpers: `utils/orgStatus.ts` (`expireOverdueOrgs`, `naturalStatus`), `utils/months.ts`, `DateRangeFilter` component
  (Activity page now uses it too), `formatMoney` (always "PKR 0", never "Free").

**Decisions made for you**
- Extending adds days to the **later of today and the current end date** (so extending early never loses days). An expired
  org that gets extended becomes `active` if it has ever paid, otherwise `trial`.
- Reactivating a suspended org gives it the same "natural" status (expired / active / trial).
- Changing plan never removes people; it only changes limits for new invites.
- Deleting a tenant really deletes it (with its files) — the spec asks for Delete — but it needs the exact name typed,
  and the UI recommends suspending instead. The deletion is logged at platform level.
- Superadmin login (from `backend/.env`): `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` (currently `you@example.com`).

**Test it**
1. Log in with the superadmin account → you land on **Platform overview**.
2. **Add tenant** → submit empty to see field errors → fill it in (use a `willkariim+something@gmail.com` admin email) →
   copy the temporary password → **Open organization**.
3. On the tenant page try **Extend** (+7 days), **Change plan**, **Suspend** (enter a reason) then **Reactivate**.
4. **Log in as admin** → confirm → you see their dashboard with the dark banner → **Back to superadmin** returns to the tenant.
5. Delete the test tenant from its **Danger zone** (type its name).

---

## 10B — Payment confirmation, revenue, plans CRUD ✅

**What was built**
- **Revenue & payments** (`/superadmin/revenue`): stats (waiting for you, confirmed total, rejected, outstanding), revenue by
  month chart (12 months), revenue by plan (donut) and by method, a transactions table (search org / transaction ID,
  status, method, plan, date range, CSV export — all in the URL; `?orgId=` from a tenant page), and an **Outstanding** tab
  (expired or ending within 14 days with no payment submitted, with an Email button).
- **Review dialog**: all payment details + the receipt image, then **Confirm payment** or **Reject…** (reason required).
  A checkbox "Email the organization's admins" (on by default) sends a confirmation / rejection email.
- **Confirming** (`POST /superadmin/payments/:id/confirm`): payment → CONFIRMED with reviewer + paid period; the org gets the
  payment's plan, `status = active`, and `subscriptionEndsAt` **+1 year from its current end date if the plan is still running,
  otherwise +1 year from today** (so renewing early never loses days). A suspended org stays suspended.
- **Rejecting** stores the reason in `payments.reviewNote`; the org's Billing page now shows "Reason: …" under the status.
- **Plans & pricing** (`/superadmin/plans`): plan cards (price, seat limits, how many tenants use it, public/hidden),
  create/edit dialog (name, yearly price, max admins/managers — empty = unlimited, description, 11 feature toggles,
  visible on pricing page, order), Hide/Show with **Undo** toast, Delete (only when no organization uses it), feature matrix.
- New public endpoint `GET /api/v1/plans` (visible plans) — ready for the public pricing page fix in Phase 11.

**Decisions made for you**
- A plan used by organizations can't be deleted (hide it instead) — prevents tenants silently losing their plan.
- Editing a plan's price affects future payments only; seat limits apply immediately to new invites.

**Test it**
1. Superadmin → **Revenue & payments**. (There is a test org "Night Pay Test" with one pending bank-transfer payment.)
2. Click **Review** on it → read the details → **untick "Email the organization's admins"** (its admin email is a
   `willkariim+paytest` address) → **Confirm payment** → the org is active for a year; the stats and chart update.
3. Try **Reject…** on another pending payment (submit one from an org's Billing page) — the reason is required.
4. **Plans & pricing** → **New plan** → create "Starter" (hidden) → Edit → Hide/Show (try Undo) → Delete it.

---

## 10C — Users, global certificates, platform analytics ✅

**What was built**
- **Users** (`/superadmin/users`): every account on the platform with stats (accounts, active this week, unverified,
  disabled), status tabs, search (name / email / organization), role filter, `?orgId=` filter (the tenant page's "Manage"
  link), CSV export. Row menu and a side panel (`?user=<id>`, shows role, organization, recent logins with device + IP,
  recent activity) with: **Disable / Enable** (disabling also logs them out everywhere; toast has Undo),
  **Log out everywhere**, **Email reset link** (15-minute link) and **Set temporary password** (shown once, copy button).
  You can't do these to your own account or another superadmin.
- **Certificates** (`/superadmin/certificates`): all certificates of all tenants — search by verify code (`EVX-…`), name or
  email; filter by status, organization, type. Details dialog with the real PDF, an integrity check (SHA-256 still matches?),
  download count, link to the public verify page, **Revoke** (reason required, Undo toast) / **Restore**.
  **Bulk revoke…**: one event or one organization + reason → it first shows how many valid certificates will be revoked,
  then a second click revokes them.
- **Platform analytics** (`/superadmin/analytics`): totals, new organizations per month, plan distribution donut,
  events & registrations per month, certificates per month, top 10 organizations, top 10 events.
  Exports: **PDF report** (2 pages, made with the ReportKit from 9E) and **CSV** (monthly numbers, plan distribution,
  top organizations, top events).
- Superadmin downloads of a certificate don't count as "downloads" (only recipients' downloads do).

**Decisions made for you**
- "Reset password" offers both options from the spec's wording: an emailed link (safe default) or a temporary password
  you share yourself (useful when their email doesn't work).
- Bulk revoke is limited to one event or one organization at a time, with a count check, to avoid accidents.

**Test it**
1. **Users** → click "Pay Tester" → try **Disable** (then **Undo**), **Set temporary password** (copy it, log in with it in a
   private window). Don't use "Email reset link" on the demo people unless you want a real email.
2. **Certificates** → search `EVX-` → open one → **Revoke…** with a reason → open the public verify page: it says REVOKED →
   **Restore**.
3. **Certificates → Bulk revoke…** → pick an event → enter a reason → "Check how many" → (Cancel, or confirm and restore later).
4. **Analytics** → **PDF report** and each **CSV** option.

---

## 10D (part 1) — System settings, maintenance mode, sitewide banner ✅

**What was built**
- **System settings** (`/superadmin/settings`, tabs in the URL): **Platform** (name, logo, favicon, free-trial days,
  max image upload size, default certificate design via the design picker), **Contact & payments** (contact email,
  WhatsApp, hours, JazzCash / Easypaisa / bank IBAN shown on the Billing page), **Banner & SEO** (sitewide banner on/off,
  message, style, optional link, live preview; meta title/description with character counters), **My account**
  (the superadmin's own profile, password and sessions — reuses the org Settings "My account" tab).
  One unsaved-changes guard for the whole page; tabs with unsaved edits get a dot.
- `PATCH /superadmin/settings` validates every key (unknown keys rejected; nested errors like `banner.link` show under the
  right field). Settings are cached for 30 s in memory and the cache is cleared on save.
- **Maintenance mode** (`maintenance.enabled` + message): every API call answers `503 MAINTENANCE` except login, the
  superadmin panel, public verify, contact form, plans and platform info. Organization dashboards then show a
  "We'll be right back" screen (with your message); superadmins (also while "logged in as") keep working and see an amber
  strip "Maintenance mode is on". The on/off switch itself is on the Maintenance page (10D part 4).
- **Sitewide banner** on the public website and every dashboard; people can dismiss it (it comes back if you change the text).
- `GET /api/v1/platform` (public): name, logo, favicon, banner, maintenance, SEO, trial days, upload limit. The browser tab
  title, meta description and favicon follow these settings. A default purple "E" favicon was added (fixes the old 404).
- **Upload limit** is now a real setting: every image upload (logos, photos, receipts…) is checked against it and the
  upload fields show "up to N MB" with the current value.

**Decisions made for you**
- SEO title/description are applied in the browser (this is a single-page app); real server-side SEO comes with the
  deployment work in Phase 12.
- Found your saved default certificate design was an old key (`classic-01`); the page shows `classic-royal` until you save.

**Test it**
1. Superadmin → **System settings** → Banner & SEO → turn the banner on, type a message, Save → open the public site and an
   org dashboard in another browser: the banner shows; dismiss it with ×.
2. Platform tab → **Choose design** → pick a layout/colour → Use this design → Save.
3. Change "Max image upload" to 1 MB → try uploading a 1.5 MB logo in an org's Settings → Branding → you get an error.
   Set it back to 5.

---

## 10D (part 2) — Email templates & SMTP ✅

**What was built**
- **Email templates** (`/superadmin/emails`): the 10 system emails (Welcome, Verify email, Password reset, Team invite,
  Registration confirmation, Event ticket, Certificate, Payment confirmed / renewal, Plan expiring soon, Announcement).
  Pick one on the left → edit the subject and the HTML body with a small toolbar (heading, paragraph, bold, italic, link),
  **Insert value** (`{{name}}`, `{{eventTitle}}` …, each email lists its own values) and **Button**
  (`{{button "Label" link}}` → the purple button). A **live preview** with sample values updates as you type.
  **Save template**, **Reset to default** (confirm), **Send test to me** (confirm; sends to the logged-in superadmin's email).
  Edited templates show "Edited" and who/when. Unsaved changes are guarded (switching template or leaving the page asks).
- These templates are now **really used**: verification, password reset, team invites, welcome, certificates, tickets,
  payment confirmation (Renewal) and announcements all go through `renderEmail()`. A missing DB row = the built-in default,
  which is exactly the text the emails had before, so nothing changes until you edit something.
- **SMTP server** tab: shows where emails go now (.env / saved server / terminal only), **Test connection** (logs in to the
  server, sends nothing), save a server (host, port, user, password — never sent back to the browser, leave empty to keep),
  or forget it to fall back to `backend/.env`.

**Decisions made for you**
- "Rich text editor": I used an HTML editor with a formatting toolbar + live preview instead of adding a heavy WYSIWYG
  library — emails need exact HTML anyway, and the preview shows the result.
- Registration confirmation and Plan expiring soon are editable now; registration confirmation is sent from Phase 11's
  public registration, the expiry reminder from the scheduled jobs (10D part 4).
- The SMTP password is stored in the database (system_settings) in plain text, like .env. Phase 12 hardening can encrypt it.

**Test it**
1. **Email templates** → Certificate → change a sentence → watch the preview → **Save template** → "Edited" badge appears.
2. **Reset to default** → confirm → the original text is back.
3. **SMTP server** → **Test connection** → "Connected to the SMTP server (.env)".
4. (Optional, sends a real email) change your superadmin email to a real inbox first, then **Send test to me**.

---

## 10D (part 3) — Security & activity log ✅

**What was built** (`/superadmin/security`)
- Stats: logins and failed logins in the last 24 h, suspicious IPs, locked accounts.
- **Activity log** tab: every action on the platform (all organizations + superadmin actions) — who, what (readable
  sentence + the raw action code), organization, IP + device, when. Filters: search (IP, name, email), action type,
  organization (or "Platform only"), date range — all in the URL. **Export CSV** (same filters, up to 20,000 rows).
  Actions done while "logged in as" are marked "(via log in as)". The tenant page's "All" link opens this filtered by that org.
- **Login attempts** tab: every login try with result, email, IP (click an IP to filter by it), device, time.
- **Threats & sessions** tab: suspicious IPs (10+ failed logins in 24 h, or failures for 3+ different emails) with
  "View attempts"; currently locked accounts (5 wrong passwords in 15 minutes → locked 15 minutes, same rule as login);
  recent sessions (logged in during the last 24 h) with **Force logout** (ends every session of that person).

**Decisions made for you**
- No "unlock now" button: locks expire by themselves after 15 minutes, and unlocking would mean deleting audit records.
- Blocking an IP is left to the server/firewall (Phase 12), the page only detects it.

**Test it**
1. **Security & activity** → filter Action = "Tenants (superadmin)" → you see what you did tonight → **Export CSV**.
2. In a private window try logging in with a wrong password 5 times → **Threats & sessions** shows the account as locked.
3. **Login attempts** → click an IP address to see all its attempts.

---

## 10D (part 4) — Maintenance page, health, error logs, backups, scheduled jobs ✅

**What was built** (`/superadmin/maintenance`)
- **Version**: app version, git commit, Node.js version, uptime.
- **Maintenance mode** switch (asks before turning on) + the message organizations see.
- **Health checks**: database (with response time), storage (uploads folder writable, free disk space, size of uploads and
  certificate PDFs), email (which SMTP server is used), background jobs.
- **Scheduled jobs** (new `backend/src/jobs/`, a small in-process scheduler started with the server):
  - *Expire finished plans* every 10 minutes (before, orgs only expired when someone opened the dashboard).
  - *Plan-ending reminders* every 6 hours: emails an org's admins **3 days before** its trial/plan ends using the
    "Plan expiring soon" template — only once per end date (recorded in the org's activity log).
  - Each shows last run, result/failure and next run, with **Run now**.
- **Error logs**: every 5xx error is now saved in the new `error_logs` table (message, method + path, user, stack).
  Click one to expand the stack trace; **Clear log** (confirm). There is one "Night test error" in there from my testing —
  clear it.
- **Clear cache** (empties the settings cache), **Database backups**: **Back up now** runs `mysqldump` into the
  git-ignored `backups/` folder (password passed via the environment, never on the command line), list + download.
  Found mysqldump automatically at `C:\Program Files\MySQL\MySQL Server 8.0\bin`. On other servers set `MYSQLDUMP_PATH`.

**Decisions made for you**
- Jobs run inside the API process (fine for one server on Hostinger). If the app is ever scaled to several processes,
  move them to a single worker.
- I made one real backup while testing (`backups/eventorax-2026-10-11-024631.sql`, ~200 KB).

**Test it**
1. **Maintenance** → all four health cards say OK.
2. **Run now** on both jobs → results update.
3. **Back up now** → a new file appears → download it.
4. Switch maintenance mode on (confirm) → open an org dashboard in another browser → maintenance screen → switch it off.
5. Expand the test error → **Clear log**.

---

## 10D (part 5) — Announcements & in-app notifications ✅ (Phase 10 complete)

**What was built**
- **Announcements** (`/superadmin/announcements`, tabs All / Sent / Scheduled / Drafts): **New announcement** opens an
  editor with title, message (plain text), audience (all organizations or one plan — shows how many organizations,
  people and admins it reaches; suspended orgs are skipped), delivery (**in the dashboard** and/or **by email** to each
  org's admins via the Announcement email template), and **Send now** (asks first, with the exact reach) / **Schedule**
  (date + time) / **Save as draft**. Live preview of how it looks in the bell.
  Rows: View, Edit (drafts/scheduled), Send now, Cancel schedule, Delete draft. Sent ones show how many orgs/emails.
- A new scheduled job **Scheduled announcements** (every minute) sends them on time; sending is "claimed" first so an
  announcement can never go out twice.
- **Notification bell** in every organization dashboard's top bar: unread count, list with the latest 15, click to read
  (expands the full text), **Mark all as read**; refreshes every minute. Each person has their own read/unread state
  (`notifications` rows per user). API: `GET /api/v1/notifications`, `POST /notifications/:id/read`, `/read-all`.
- The dashboard's "Send announcement" quick action opens the editor directly.
- `ui/popover` is now used (knip: only `ui/scroll-area` and `ui/separator` remain deliberately unused).

**Test data I created**: one in-app announcement "Test announcement from the night build" (sent to the 2 orgs — Will Karim
sees it under the bell) and "Scheduled test (Enterprise only)" (reached nobody). No emails were sent.

**Test it**
1. Superadmin → **Announcements** → **New announcement** → title + message → audience "Pro plan only" → only
   **In the dashboard** → **Schedule** 2 minutes ahead → it appears under Scheduled → wait → it moves to Sent.
2. Log in as `willkariim@gmail.com` → the bell shows the unread count → open it → click a notification → **Mark all as read**.
3. Try a draft: Save as draft → Edit → Send now.

---

## Final touches ✅
- Suspended organizations now see the reason the superadmin gave (on login and in the dashboard error message).
- The seed (`npx prisma db seed`) now also creates the new settings keys (banner, SEO, maintenance message, logo/favicon).
- CLAUDE.md: Phase 9 and 10 marked done; architecture, API list, conventions (emails via templates, impersonation,
  error logs, platform activity logging) and the remaining-work list (Phase 11, 12) updated.
