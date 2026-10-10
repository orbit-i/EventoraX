  **Full requirements:** `docs/EventoraX_Complete.md` — read the relevant section before starting each phase.
  # EventoraX — Project Guide for Claude Code

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
   - Periodically: `npx knip` (root) and `cd backend && npx knip`
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
- **No SMTP configured → emails print to the backend terminal** as `DEV EMAIL` (with links). Used for testing.
- **Manual API tests:** `backend/api-tests.http` (VS Code REST Client). Variables: `{{baseUrl}}`, `{{token}}`, `{{eventId}}`, etc.
- **Prisma:** `npx prisma migrate dev --name <name>`, `npx prisma generate`, `npx prisma db seed`, `npx prisma studio`.
- **Windows gotcha:** case-only renames need two steps (`git mv A tmp && git mv tmp a`).

---

## Product decisions (already agreed)

- Plans (seeded): **Pro PKR 20,000/yr** (max 3 admins, 7 managers), **Enterprise PKR 25,000/yr** (unlimited, white-label, custom domain).
- New orgs get a **1-day Pro trial** (`trial.days` system setting). Expired orgs: overview, billing, settings
  and support still work; everything else returns `402 ORG_EXPIRED`. Nothing is deleted.
- **Payments are manual only:** JazzCash / Easypaisa / bank transfer. The org submits a transaction ID + receipt;
  the **superadmin confirms** (Phase 10). No payment gateway.
- **Certificates:** ~8–10 well-designed base layouts × colour/style variants ≈ 50 choices (not 50 hand-made designs).
- **Add a public event page with self-registration** (Phase 11). The spec implies it: `displayPublic` toggles, "Public User: register".
- Roles: `superAdmin` (platform, `organizationId = null`), `admin`, `manager`, `viewer` (read-only).
- Registration statuses: REGISTERED, ATTENDED, ABSENT (keeps the seat), **CANCELLED (frees the seat;
  no certificate/emails; restorable if seats allow)**.
- Events with registrations are **archived, never hard-deleted** (`status = ARCHIVED`, restorable).
- Spec wording: PUBLISHED → "Upcoming", ONGOING → "Active", OFFLINE → "Physical". Money is always **PKR**.

---

## Backend architecture (`backend/src`)

```
index.ts            app setup, route mounting, /uploads static, JSON 404, error handler
prisma/client.ts    default export `prisma` (base client)
prisma/scopedClient.ts   org-scoped client: auto-injects organizationId into queries for org models
middleware/
  auth.ts           requireAuth (verifies JWT + re-checks user/tokenVersion in DB on every request)
  checkOrgStatus.ts loads req.org (+plan), auto-expires trials; option { allowExpired }
  scopedPrisma.ts   attaches req.db (scoped client)
  role-check.auth.ts requireRole(["admin", ...])
  orgChain.ts       orgScoped, orgScopedAllowExpired, canWrite (blocks viewers), adminOnly
controllers/        auth (in routes/auth-route.ts), org, team, events, program (speakers/sponsors/sessions/reorder),
                    registrations, dashboard (overview + analytics), activity, billing, support (contact + support)
routes/             one router file per area; mounted under /api/v1
utils/              http (ok/fail/validationFail/pagination/q), schemas (optionalText/optionalUrl/optionalImage/
                    parseDate/isUniqueViolation/isOneOf), activity (logActivity), mail (sendMail/escapeHtml + templates),
                    storage (saveUpload/deleteUpload/deleteUploadFolder), upload (multer imageUpload/csvUpload),
                    settings (getSetting), tokens, jwt, password, roleLimit, codes (refNo/ticketNo/qr), csv (csvCell/toCsv)
```

**Conventions**
- In org routes use `req.db!` (scoped). `req.org!` = organization + plan. `req.user!` = `{ userId, email, name, role, organizationId }`.
  Use base `prisma` only for platform tables (plans, settings) or raw SQL (always filter `organizationId` yourself).
- Validate input with **zod**. Return with `ok(res, data, status?, meta?)` / `fail(res, status, CODE, message, { fieldErrors })` /
  `validationFail(res, zodError)`. Field errors are `Record<string, string>` so the UI can show them under each field.
- **Newer endpoints use the envelope** `{ data, error, meta }`. **Older auth/org/team endpoints return plain JSON**
  (`{ error, code, fieldErrors }`). The frontend client handles both. Convert org/team to the envelope when you next rewrite them.
- Log meaningful actions with `logActivity(req, { action: "area.verb", entityType, entityId, metadata })`.
  The frontend turns action codes into sentences in `src/lib/activityText.ts`. Add a case there for new actions.
- Lists: `pagination(query, max)` + `meta: { total, page, limit }`. Fixed paths (`/stats`, `/export`, `/bulk`) go before `/:id`.
- Tokens (reset/verify/invite) are stored only as SHA-256 hashes. Password changes bump `tokenVersion` (logs out other sessions).
- MySQL table names are lowercase via `@@map` (needed on Linux hosting). Column names = Prisma field names.
- Uploads go to local disk `uploads/orgs/<orgId>/<folder>` and are served at `/uploads/...`.
  Generic pre-upload: `POST /api/v1/uploads/image?kind=speaker|sponsor|logo|signature|payment` → `{ url }`.

**Mounted API (`/api/v1`)**: health, auth, org, team, events (+ /stats, /:id/stats, /:id/restore, /:id/duplicate),
categories, speakers, sponsors, sessions, reorder, registrations (+ /:id/status, /bulk, /export, /email,
/csv-import/parse, /csv-import/confirm with `dryRun` + `duplicateStrategy`), uploads, dashboard/overview, analytics,
activity (+ /export), billing (+ /payments), support, contact (public, rate-limited 5/h),
org/me/delete-data, org/me/close (name + password confirmation), PATCH auth/me.

---

## Frontend architecture (`src/`)

```
main.tsx            createBrowserRouter([{ path: "*", element: <AuthProvider><ConfirmProvider><App/> }]) — data router (needed by useBlocker)
App.tsx             all routes (<Routes>); writer(page) wraps create/edit pages (admins + managers only)
context/AuthContext.tsx   user, organization, status, login/register/acceptInvite/logout/refresh; homeFor(user)
lib/api.ts          api.get/list/getList/post/patch/delete/upload/download, buildQuery, ApiError, errorMessage, tokenStore
lib/status.ts       ONE place for every status label + colour (event, mode, registration, tier, org, visibility)
lib/format.ts       formatDate/DateTime/Time/PKR/Duration/Relative/TimeLeft/Month, plural  (locale en-PK)
lib/permissions.ts  useCan()("write" | "manage")   write = admin/manager, manage = admin
lib/                validation.ts (zod email/password/phone), date.ts (datetime-local), csv.ts (downloadCsv), activityText.ts
hooks/              useApi (cancellable fetch, reload, initialLoading), useUrlState (filters in URL; resets page),
                    useSelectedEvent (eventId in URL + remembered), useUnsavedChanges (useBlocker + beforeunload),
                    useVisibilityToggle (show/hide public with Undo), useNow
components/ui/      shadcn primitives + our button.tsx + form-fields.tsx (TextField, PasswordField, SelectField, TextareaField)
components/app/     PageHeader, EventPicker, StatsRow/StatCard, SegmentedTabs, Toolbar (SearchInput, FilterSelect,
                    FilterChips, ViewToggle), ServerTable, CardGrid, PaginationBar, BulkActionBar, RowActions,
                    StatusBadge, States (EmptyState, NoResults, ErrorState), ConfirmDialog (useConfirm), RoleGate,
                    Avatar, ReorderList, form/ (FormLayout: FormSection, FullWidth, SwitchField, FormFooter;
                    ImageUploadField; serverErrors.applyServerErrors)
components/layout/  DashboardLayout, Sidebar (grouped nav, collapsible, plan card), Topbar (account menu),
                    AccountBanners (trial / expiring / expired / verify email), nav.ts (menu config)
components/<feature>/  events, registrations, speakers, sponsors, sessions — feature forms and pieces
pages/              public pages (root), auth pages, dashboard/<module>/*Page.tsx, superadmin/, dev/ (ComponentGallery at /dev/components)
types/              API shapes (auth, event, registration, speaker, sponsor, session, dashboard)
```

**Page templates (follow them for every new page)**
- **List page:** PageHeader (breadcrumbs, actions in `RoleGate`) → EventPicker (event-scoped modules) → StatsRow (server stats)
  → SegmentedTabs/Toolbar (state via `useUrlState`) → FilterChips → BulkActionBar → ServerTable/CardGrid →
  PaginationBar; with ErrorState / NoResults / EmptyState.
- **Form page:** RHF + zodResolver; fields from `ui/form-fields`; `FormSection`s; `applyServerErrors(err, setError)`;
  `useUnsavedChanges(isDirty && goTo === null)`; after saving, `setGoTo(url)` and navigate in a `useEffect`
  (so the unsaved guard doesn't fire); a toast on success.
- **Destructive actions:** `await confirm({ title, description, confirmLabel, tone: "danger" })`.
- Viewers never see write actions. Archived events are read-only.
- **Colours:** brand `#7c3aed` (hover `#6d28d9`), text `#0f172a`, muted `#64748b`/`#94a3b8`, borders `#e9e4ff`,
  page background `#f3f0ff`, cards white with `rounded-2xl border shadow-sm`.

---

## Status (as of this handoff)

✅ **Done:** branch audit; backend base + unified Prisma schema (22 tables) + seed; secure auth (register/trial,
login with lockout + remember-me, verify, reset, change password, logout-all, invites); org/team API; events
module API; shared components; real auth pages; the whole **events module UI rebuilt on the design system**
(events list + hub + form, registrations + CSV import wizard with dry-run review, speakers, sponsors, schedule,
reorder); knip clean-up (only deliberately kept: `ui/popover`, `ui/scroll-area`, `ui/separator`); **Phase 8A backend**
(overview, analytics, activity, billing, support/contact, profile edit, danger zone).

⏳ **Step 8B (layout + Overview page)** was written in chat and may not be applied yet. Check for
`src/components/layout/DashboardLayout.tsx`, `src/pages/dashboard/OverviewPage.tsx` and the lowercase
`src/pages/dashboard` folder. If they're missing, ask the user before redoing it.

## Remaining work

**8C** — Analytics page (`GET /analytics`: 12-month registrations + certificates, events by status, attendance per event,
category breakdown, registered-via, top events; recharts); Activity log page (replaces `pages/dashboard/activity.tsx`;
filters person/action/date, pagination, CSV export via `api.download`); Contact page in the dashboard (`POST /support`);
wire the public `pages/Contact.tsx` form to `POST /contact`. Add Analytics (Insights) and Contact/Help to `components/layout/nav.ts`.

**8D** — Team page (replaces mock: members + pending invites + seat usage, invite, cancel invite, change role,
remove; respects plan seat limits and the last-admin rule); Settings with tabs (`?tab=`): My account (PATCH /auth/me,
change password → `tokenStore.replace(newToken)`), Organization profile, Branding (logo, colours, white-label name,
custom domain — Enterprise only), Certificates (signatory name/title, signature upload), Notifications, Danger zone
(type org name + password); Billing (plans, payment accounts — show a "contact support" notice if
`payments.accounts` is empty — submit payment with receipt upload `kind=payment`, pending payment card with cancel,
history). Then delete the now-unused `ui/dashboard/header.tsx`, `ui/dashboard/StatCard.tsx`, `ui/data-table.tsx`,
`ui/modal.tsx` and `ui/search-bar.tsx` if knip confirms; move `p-6` into DashboardLayout and drop `ModuleLayout`;
convert org/team responses to the envelope.

**9** — Certificates: template system (~8–10 layouts × variants), PDF generation, SHA-256 hash + public verify code,
bulk generate, email delivery, revoke, auto-issue when attendance becomes ATTENDED (hook marked in
`setRegistrationStatus`), public `/verify` page. QR tickets: QR images, ticket PDFs, ZIP download, camera scanner
check-in page (marks `ticket.isUsed`). ID cards: 4 templates, bulk PDF. Analytics PDF report export.

**10** — Superadmin panel (`/superadmin`, role superAdmin): dashboard, tenants (suspend, extend trial, change plan,
impersonate), plans CRUD, revenue + **payment confirmation** (sets plan, `status = active`, `subscriptionEndsAt` +1 year),
users, global certificates, analytics, email template editor, system settings (`payments.accounts`, `contact.email`,
`contact.whatsapp`, `trial.days`…), security/login logs, maintenance mode, announcements.

**11** — Editable email templates from the DB, in-app notifications, API tokens + public REST API (Enterprise),
public website fixes (PKR pricing, CTAs, FAQ), **public event page + self-registration**.

**12** — Security hardening (helmet, more rate limits), Docker/CI, Hostinger deployment (one Express server serves the
API + built Vite app), backups, final knip, then move the repo to its own GitHub repository.