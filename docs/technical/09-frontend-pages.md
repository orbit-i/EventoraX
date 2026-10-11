# 9. Frontend pages

One file per route in `src/pages/`. Every page is lazy-loaded from `App.tsx`. For what each page looks like and does from
a user's point of view, see the [product guide](../product-guide/README.md); this chapter covers how each is built and
which endpoints it uses.

**Patterns used by almost every page** (details in chapters 7 and 8):

- **List page:** `PageHeader` → `EventPicker` (event-scoped pages) → `StatsRow` (a `/stats` endpoint) → `SegmentedTabs` /
  `Toolbar` with state in `useUrlState` → `FilterChips` → `BulkActionBar` → `ServerTable` or `CardGrid` → `PaginationBar`,
  with `ErrorState` / `NoResults` / `EmptyState`. Data via `useApi(path)` where `path` is built with `buildQuery(values)`,
  so changing a filter changes the URL, which changes the path, which reloads.
- **Form page:** a thin page (`New…Page`, `Edit…Page`) that loads the record (edit) and renders the feature's form
  component (`EventForm`, `RegistrationForm`, …), which follows the form recipe in chapter 8.
- Write actions are wrapped in `RoleGate need="write"`; destructive ones use `useConfirm`.

## Public website (`pages/*.tsx`)

| Route | File | Notes |
|---|---|---|
| `/` | `Home.tsx` | Composes `components/home/*`. Loads `GET /platform/website` (live stats, testimonials, logos) and passes them to sections, which hide when empty. Pricing section loads `GET /plans`. |
| `/features` | `Features.tsx` | Static content (keep it true to the product). |
| `/pricing` | `Pricing.tsx` | `usePublicPlans` (`GET /plans`), `PlanCards`, `PlanComparison`, `PaymentBadges`, billing FAQ; trial length from `usePlatform`. |
| `/about` | `About.tsx` | Static; **team names are placeholders** (see handover). |
| `/contact` | `Contact.tsx` | `GET /contact/info`, `POST /contact` (rate-limited), social links. |
| `/terms`, `/privacy` | `Terms.tsx`, `Privacy.tsx` | Content arrays rendered by `LegalPage`. |
| `/verify`, `/verify/:code` | `Verify.tsx` | Code input (normalised), `GET /verify/:code`, VERIFIED / REVOKED / TAMPERED / not found, PDF via `/verify/:code/pdf`. |
| `/developers` | `Developers.tsx` | REST API documentation (base URL from `window.location.origin`). **Update it when `/ext` changes.** |
| `*` | `NotFound.tsx` | 404 page. |

## Organization public pages (`pages/public/`)

| Route | File | Notes |
|---|---|---|
| `/o/:slug` | `OrgPage.tsx` | `GET /public/orgs/:slug` → upcoming and past events inside `PublicShell` (org colours/logo). |
| `/e/:id` | `EventPage.tsx` | `GET /public/events/:id` (unauthenticated). Hero with facts and availability, schedule, speakers, sponsors by tier; **Share** (`navigator.share` or copy link); **Add to calendar** (builds an `.ics` file in the browser); registration form (react-hook-form + zod, hidden honeypot `website` field) → `POST /public/events/:id/register` → shows the QR ticket on screen (`QrCode`). Handles FULL / CLOSED / ENDED / UNAVAILABLE and "already registered". |

Link-preview tags for these two routes and `/verify/:code` are added by the backend (`web/spa.ts`), not here.

## Authentication pages

| Route | File | Notes |
|---|---|---|
| `/login` | `Login.tsx` | Two steps: password (`useAuth().login`), then, if `challengeToken` comes back, a 6-digit code or recovery code (`completeTwoFactor`). Returns to `location.state.from` or `homeFor(user)`. Shows suspension reasons and lockout messages from the API. |
| `/register` | `Register.tsx` | Sign-up form (`useAuth().register`), trial length from settings, terms checkbox. |
| `/forgot-password` | `ForgotPassword.tsx` | `POST /auth/forgot-password`, always the same confirmation. |
| `/reset-password?token=` | `ResetPassword.tsx` | `POST /auth/reset-password`. |
| `/verify-email?token=` | `VerifyEmail.tsx` | `GET /auth/verify-email`, then refreshes the session if logged in. |
| `/accept-invite?token=` | `AcceptInvite.tsx` | `GET /auth/invite/:token` (who invited you), then `acceptInvite`. |

All use `AuthShell` for the centred layout.

## Organization dashboard (`pages/dashboard/`)

| Route | File | Endpoints | Notes |
|---|---|---|---|
| `/dashboard` | `OverviewPage.tsx` | `GET /dashboard/overview` | Greeting, stat cards, 6-month area chart (recharts), quick actions (role-aware), upcoming events, recent activity. Works when expired. |
| `/dashboard/events` | `events/EventsPage.tsx` | `/events`, `/events/stats` | Status tabs with counts, search, mode, date range, table/card view, row actions via `useEventActions`. |
| `/dashboard/events/new`, `/:id/edit` | `events/NewEventPage.tsx`, `EditEventPage.tsx` | `/events/:id` | `EventForm`. |
| `/dashboard/events/:id` | `events/EventDetailPage.tsx` | `/events/:id`, `/events/:id/stats`, lazy previews of `/registrations`, `/speakers`, `/sponsors`, `/sessions` | The hub: `PublicLinkCard`, stat cards, tabs in `?tab=` (each tab's data loads only when opened), edit/duplicate/archive. Archived = read-only. |
| `/dashboard/registrations` | `registrations/RegistrationsPage.tsx` | `/registrations`, `/events/:id/stats`, `/registrations/:id/status`, `/registrations/bulk`, `/registrations/export`, `/registrations/email`, `/categories` | Status tabs, search, category filter, inline `StatusMenu`, selection + bulk bar, export menu (CSV/Excel, all or selected), `EmailAttendeesDialog`. |
| `/dashboard/registrations/new`, `/:id/edit` | `NewRegistrationPage.tsx`, `EditRegistrationPage.tsx` | `/registrations/:id` | `RegistrationForm`. |
| `/dashboard/registrations/import` | `registrations/ImportRegistrationsPage.tsx` | `/registrations/csv-import/parse`, `/registrations/csv-import/confirm` | 4-step wizard (`upload` → `map` → `review` → `done`). Column aliases guess the mapping (e.g. "ticket type" → category). Review calls confirm with `dryRun: true`; Import calls it for real. Template and skipped-rows CSVs are built in the browser. |
| `/dashboard/speakers` (+ `new`, `:id/edit`, `reorder`) | `speakers/*` | `/speakers`, `/reorder` | Card/list view, public/hidden filter, `useVisibilityToggle`, `ReorderList`. |
| `/dashboard/sponsors` (+ `new`, `:id/edit`) | `sponsors/*` | `/sponsors` | Grouped by tier. |
| `/dashboard/schedule` (+ `new`, `:id/edit`, `reorder`) | `schedule/*` | `/sessions`, `/reorder` | Timeline grouped by day, totals. |
| `/dashboard/certificates` | `certificates/CertificatesPage.tsx` | `/certificates`, `/certificates/stats`, `/templates`, `/:id/pdf`, `/:id/email`, `/email`, `/:id/revoke`, `/:id/restore`, `PATCH /events/:id` | Design card (`TemplatePickerDialog` saves `certTemplateId` on the event), auto-issue switch (with Undo), issue dialogs, row menu, revoke dialog. PDFs open via `openPdf`. |
| `/dashboard/tickets` | `tickets/TicketsPage.tsx` | `/tickets`, `/tickets/stats`, `/tickets/zip`, `/tickets/email`, `/tickets/:id/pdf`, `/tickets/check-in`, `/:id/undo-check-in` | `TicketDialog` for one ticket, ZIP download, "email unsent". |
| `/dashboard/tickets/scan` | `tickets/ScanPage.tsx` | `/tickets/check-in`, `/tickets/stats`, `/:id/undo-check-in` | `qr-scanner` on a `<video>` (camera choice, torch), ignores the same code for 3 s (the camera sees it many times a second), one request at a time, beep (WebAudio) + vibration for success/problem, manual ticket-number box, live counters, recent scans with Undo. Needs `https://` or localhost for the camera. |
| `/dashboard/idcards` | `idcards/IdCardsPage.tsx` | `/idcards`, `/idcards/stats`, `/idcards/options`, `/idcards/preview`, `/idcards/pdf` | `DesignPanel` (design in localStorage), attendee table with printed filter, download all/selected/one. |
| `/dashboard/analytics` | `AnalyticsPage.tsx` | `/analytics`, `/analytics/report` | recharts charts; PDF report download. |
| `/dashboard/activity` (admin) | `ActivityPage.tsx` | `/activity`, `/activity/export`, `/team` | Filters by person (team list), action prefix, date range; sentences from `describeActivity`. |
| `/dashboard/team` | `TeamPage.tsx` | `/team`, `/team/invite`, `/team/:id/role`, `/team/:id`, `/team/invites/:id(/resend)` | Seat cards, role select with Undo toast, remove with confirm, pending invites, `InviteDialog`. Read-only for non-admins. |
| `/dashboard/settings` | `SettingsPage.tsx` | via tabs: `/auth/me`, `/auth/change-password`, `/auth/2fa/*`, `/auth/logout-all`, `/org/me`, `/org/me/delete-data`, `/org/me/close` | Tabs from `components/settings/*` (non-admins only see My account). Every tab stays mounted; each reports `onDirtyChange`; the page owns the single `useUnsavedChanges`. Tab in `?tab=`. |
| `/dashboard/billing` (admin) | `BillingPage.tsx` | `/billing`, `/billing/payments` (GET/POST), `DELETE /billing/payments/:id` | Current plan card, plan cards with Pay/Renew/Switch, `PayDialog`, payment history with receipts and rejection reasons. |
| `/dashboard/api` (admin) | `ApiPage.tsx` | `/api-tokens`, `/api-tokens/:id/revoke` | Enterprise: base URL + curl example, token list, create dialog with the one-time token. Other plans: upsell to Billing. |
| `/dashboard/contact` | `ContactPage.tsx` | `/contact/info`, `POST /support` | Message form, WhatsApp/email/hours, FAQ. |

## Superadmin (`pages/superadmin/`)

| Route | File | Endpoints | Notes |
|---|---|---|---|
| `/superadmin` | `SuperadminDashboardPage.tsx` | `/superadmin/dashboard` | KPI cards, revenue, needs-attention links, sign-ups chart, `ActivityFeed`, quick actions. |
| `/superadmin/tenants` | `TenantsPage.tsx` | `/superadmin/tenants`, `/stats`, `/export`, `/plans` | Status tabs, filters, sort, CSV; row menu uses `TenantDialogs` and `useImpersonate`. |
| `/superadmin/tenants/:id` | `TenantDetailPage.tsx` | `/superadmin/tenants/:id` (+ actions) | Drill-down with actions bar and danger zone (typed-name delete). |
| `/superadmin/revenue` | `RevenuePage.tsx` | `/superadmin/revenue`, `/payments`, `/payments/stats`, `/payments/export`, `/plans` | Charts, Transactions / Outstanding views in `?view=`, `PaymentReviewDialog`. `?orgId=` filters to one tenant. |
| `/superadmin/plans` | `PlansPage.tsx` | `/superadmin/plans` (CRUD) | Plan cards, editor dialog with feature switches, hide/show with Undo, feature matrix. |
| `/superadmin/users` | `UsersPage.tsx` | `/superadmin/users` (+ actions), `/stats`, `/export` | Side panel in `?user=`; disable/enable (Undo), logout, reset password (link or temporary via `OneTimeSecret`), reset 2FA. |
| `/superadmin/certificates` | `PlatformCertificatesPage.tsx` | `/superadmin/certificates` (+ actions), `/stats`, `/events`, `/tenants` | Details dialog with integrity check, revoke/restore, `BulkRevokeDialog` (dry run count first). |
| `/superadmin/analytics` | `PlatformAnalyticsPage.tsx` | `/superadmin/analytics`, `/report`, `/export` | Charts + PDF/CSV exports. |
| `/superadmin/security` | `SecurityPage.tsx` | `/superadmin/security/*`, `/tenants`, `/users/:id/logout` | Three tabs (`?tab=activity|logins|threats`), each with its own URL filters. |
| `/superadmin/announcements` | `AnnouncementsPage.tsx` | `/superadmin/announcements` (+ actions), `/stats`, `/audience`, `/plans` | Status tabs, editor dialog with live bell preview and reach, send now / schedule / draft. `?new=1` opens the editor (dashboard quick action). |
| `/superadmin/emails` | `EmailTemplatesPage.tsx` | `/superadmin/emails` (+ `/:type`, `/preview`, `/test`), `/superadmin/smtp` (+ `/verify`) | Template list, HTML editor with toolbar and variable insert, live preview (debounced preview endpoint), unsaved-changes guard when switching templates; SMTP tab. `?tab=` and `?type=`. |
| `/superadmin/settings` | `SystemSettingsPage.tsx` | `/superadmin/settings`, `/superadmin/uploads` | Tabs Platform / Contact & payments / Banner & SEO / Website (`WebsiteContentPanel`) / My account (reuses `AccountTab`). One form for the flat keys (field names map to setting keys), one unsaved guard, nested field errors mapped back. |
| `/superadmin/maintenance` | `MaintenancePage.tsx` | `/superadmin/maintenance` (+ jobs, cache, errors, backups), `PATCH /superadmin/settings` (maintenance switch/message) | Version, maintenance mode, health cards, jobs with Run now, backups, error log with expandable stacks. |

## Developer pages (`pages/dev/`)

`/dev/components` (`ComponentGallery.tsx` + `AppBlocksGallery.tsx`): every shared component with sample data, for
checking the design system. Only routed in development builds.
