# 1. Architecture

## The big picture

```
 Browser ──────────────────────────────────────────────────────────────────────────────
   React single-page app (src/)  ── fetch /api/v1/... with "Authorization: Bearer <JWT>"
        │                          ── <img src="/uploads/...">
        ▼
 Development: Vite dev server :5173 ──proxy /api, /uploads──▶ Express :5000
 Production:  Express :5000 serves dist/ (the built app) AND the API, one process
        │
        ▼
 Express app (backend/src/index.ts)
   helmet → cors → json → apiLimiter → /uploads static → /health → maintenanceGate → routers → JSON 404
   → web/spa.ts (built site + link-preview tags) → error handler
        │
        ├── routes/*        URL → middleware chain → controller
        ├── middleware/*    who are you (JWT), which organization, can you write, plan still valid?
        ├── controllers/*   validate (zod) → read/write DB → respond { data, error, meta }
        ├── services/*      reusable business logic (certificates, tickets, notifications, announcements)
        ├── pdf/*           pdfkit renderers (certificates, tickets, ID cards, reports)
        ├── jobs/*          in-process scheduler (expire plans, reminders, announcements, summaries)
        └── utils/*         small helpers (http envelope, mail, settings cache, storage, crypto…)
        │
        ▼
 Prisma 7 (MariaDB adapter) ──▶ MySQL 8          Disk: uploads/ (public), private-files/ (certificate PDFs)
                                                 SMTP: system setting → .env → console ("DEV EMAIL")
```

## Multi-tenancy: how organizations are kept apart

Every organization's data lives in the same tables, separated by an `organizationId` column. Three layers make sure
one organization never sees another's rows:

1. **The JWT** says who the user is; `requireAuth` reloads the user from the database on every request, so their
   `organizationId` and role are always current.
2. **`checkOrgStatus`** loads that organization (`req.org`, with its plan) and refuses suspended or expired ones.
3. **The scoped Prisma client** (`req.db`, from `prisma/scopedClient.ts`) automatically adds
   `organizationId = <the user's org>` to every query on an organization-owned model (reads, updates, deletes) and to
   every create. A controller that uses `req.db` cannot reach other organizations' rows, even by mistake.

The base client (`prisma` from `prisma/client.ts`) has no such filter. It is only used for platform tables
(plans, settings, users during login), by the superadmin, by public pages (which look rows up by an unguessable id), and
for raw SQL, where the code must filter `organizationId` itself.

## Request lifecycle (an organization endpoint)

Example: `PATCH /api/v1/registrations/:id/status` from the Registrations page.

1. `src/lib/api.ts` sends the request with the JWT from `localStorage`/`sessionStorage`.
2. `index.ts`: security headers, CORS, JSON body (5 MB max), rate limit (600/min/IP), maintenance gate.
3. `routes/registrations-routes.ts`: `orgScoped` (= `requireAuth` → `checkOrgStatus()` → `attachScopedPrisma`) then
   `canWrite` (viewers get 403).
4. `controllers/registrations-controller.ts`: parses the body with zod (`validationFail` → 400 with `fieldErrors`),
   updates through `req.db`, writes an activity row with `logActivity`, triggers side effects (certificate auto-issue),
   and answers `ok(res, data)`.
5. The page receives `{ data, error: null }`; on error the client throws an `ApiError` that forms turn into messages
   under each field (`applyServerErrors`).

## Response envelope

Every endpoint except `/api/v1/auth/*` answers:

```json
{ "data": ..., "error": null, "meta": { "total": 120, "page": 1, "limit": 20 } }
{ "data": null, "error": { "code": "VALIDATION_ERROR", "message": "...", "fieldErrors": { "email": "..." } } }
```

Auth routes predate the envelope and return plain JSON (`{ token, user }` or `{ error, code, fieldErrors }`).
The frontend client understands both.

## Authentication and sessions

- Passwords: bcrypt. Login: `POST /auth/login` → JWT signed with `JWT_SECRET` (1 day, or 30 days with "Remember me").
- The JWT holds `userId` and `tokenVersion`. Changing the password or "log out everywhere" increments `tokenVersion`, which
  instantly invalidates every older token (checked in `requireAuth`).
- Lockout: 5 wrong passwords for one email within 15 minutes (counted in `login_attempts`) → refused for 15 minutes.
- Two-factor login (TOTP): after the password, users with 2FA get a 5-minute **challenge token** signed with a
  different key; `POST /auth/login/2fa` exchanges it plus a code for a real session.
- Email verification, password reset and invites use random tokens that are stored **only as SHA-256 hashes**.
- **Impersonation** ("log in as"): the superadmin gets a 1-hour JWT for an org admin with `imp = <superadmin id>`.
  `requireAuth` checks the superadmin is still active; `logActivity` marks every action with `impersonatedBy`.
  The frontend keeps it in `sessionStorage` (that tab only) and remembers the superadmin's own session to return to.
- **API tokens** (`evx_live_…`, Enterprise) are a separate auth path for `/api/v1/ext`, see [Backend API](04-backend-api.md).

## Roles

| Role | Scope | Can |
|---|---|---|
| `superAdmin` | platform (`organizationId = null`) | everything under `/superadmin`, impersonate org admins |
| `admin` | one organization | everything in the organization, including team, billing, settings, API tokens |
| `manager` | one organization | create and change event data (`canWrite`) |
| `viewer` | one organization | read only |

Backend: `requireRole([...])` and the shortcuts in `middleware/orgChain.ts`. Frontend: `useCan()("write" | "manage")`
hides buttons; `ProtectedRoute roles` and `writer(page)` in `App.tsx` guard routes. The backend is the real gate; the
frontend only avoids showing things that would fail.

## Organization lifecycle

```
sign up ──▶ trial (trial.days setting) ──payment confirmed──▶ active (+1 year)
   │                 │                                           │
   │                 └──── end date passes ──▶ expired ◀──────────┘
   │                                             │ payment confirmed / superadmin extends
   └── superadmin suspends (any state) ──▶ suspended ──reactivate──▶ natural status
```

- `subscriptionEndsAt` is the single end date for trial and paid time.
- Expiry happens lazily on each request (`checkOrgStatus`) and every 10 minutes (`expire-orgs` job).
- Expired organizations keep their data. `orgScopedAllowExpired` routes (overview, billing, settings, support, some
  uploads) keep working; everything else answers `402 ORG_EXPIRED`.
- "Natural status" (`utils/orgStatus.ts`): expired if the date has passed, else active if it has ever paid, else trial.

## Files and storage

| Kind | Where on disk | Served | Example |
|---|---|---|---|
| Public uploads (logos, signatures, speaker photos, sponsor logos, receipts) | `backend/uploads/orgs/<orgId>/<folder>/` | `/uploads/...` (static) | org logo |
| Private files (certificate PDFs) | `backend/private-files/orgs/<orgId>/certificates/` | only through API endpoints that check access | `GET /certificates/:id/pdf`, `GET /verify/:code/pdf` |
| Generated on demand (tickets, ID cards, reports) | not stored | streamed | ticket PDF, ZIP |
| Backups | `backups/` (repo root) | superadmin download endpoint | `.sql` dumps |

Logos and signatures must be PNG or JPEG because pdfkit prints them on PDFs.

## Background work

- **Fire-and-forget:** long work after a response (bulk emails, certificate batches) runs in `void (async () => …)()`;
  errors are only logged.
- **Scheduled jobs** (`jobs/`): an in-process scheduler started by `index.ts` after `listen`. Fine for one server; if
  the API is ever run as several processes, move the jobs to a single worker.

## Emails

All system emails go through `renderEmail(type, vars)` (`utils/mail.ts`): the superadmin's edited template from the
`email_templates` table, or the built-in default in `utils/emailTemplates.ts`, wrapped in a standard layout. The SMTP
server comes from the `smtp` system setting, else `backend/.env`, else the email is printed in the terminal.

## Frontend shape

- `main.tsx` creates a **data router** (`createBrowserRouter`, needed by `useBlocker` for unsaved-changes prompts) with a
  single catch-all route that renders the providers and `App.tsx`, which declares all routes with `<Routes>`.
- Every page is `React.lazy` (one JS file per page). Libraries are grouped into cached chunks in `vite.config.ts`.
- Data fetching: `useApi` (cancellable, reloadable) over `lib/api.ts`. No global store: auth and platform settings live
  in two React contexts; everything else is per page, with filters in the URL (`useUrlState`).
- UI: Tailwind + shadcn/ui (Radix) primitives in `components/ui`, app-level building blocks in `components/app`
  (tables, toolbars, states, dialogs), feature components in `components/<feature>`.
