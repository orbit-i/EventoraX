# Night log — autonomous run (2026-10-11)

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
