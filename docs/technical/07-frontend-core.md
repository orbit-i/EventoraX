# 7. Frontend core

The infrastructure every page uses. Paths are relative to `src/`. The `@/` import alias points to `src/`.

## Entry: `main.tsx`

1. Imports `index.css`.
2. **Stale-chunk recovery:** after a deploy, an open tab may request a page file that no longer exists; Vite fires
   `vite:preloadError`. The handler reloads the page once (a `sessionStorage` flag prevents a reload loop; it is cleared
   10 seconds after a successful load).
3. Creates a **data router** (`createBrowserRouter`) with one catch-all route whose element is the provider stack
   `PlatformProvider → AuthProvider → ConfirmProvider → App`. A data router is required by `useBlocker` (unsaved-changes
   prompts); the actual routes stay declarative in `App.tsx`.

## Routes: `App.tsx`

- **65 pages, all `React.lazy`**, so each page is its own JS file. `Suspense` shows `PageLoader` while one loads.
- `Layout`: public pages get `Navbar` + `SiteBanner` + `Footer`. Paths in `BARE_PREFIXES` (`/dashboard`, `/superadmin`,
  `/e/`, `/o/`, auth pages, `/dev`) render without them (they bring their own layout).
- `ScrollToTop` scrolls up on every path change.
- Route groups:
  - public: `/`, `/about`, `/features`, `/pricing`, `/contact`, `/terms`, `/privacy`, `/verify`, `/verify/:code`,
    `/developers`, `/o/:slug`, `/e/:id`;
  - guest-only (`GuestRoute`, logged-in users are sent home): `/login`, `/register`, `/forgot-password`;
  - token links: `/reset-password`, `/verify-email`, `/accept-invite`;
  - `/dashboard/*` inside `ProtectedRoute roles={admin, manager, viewer}` + `DashboardLayout`; admin-only children wrapped
    again (`activity`, `billing`, `api`); create/edit pages wrapped in `writer(page)` = admins and managers;
  - `/superadmin/*` inside `ProtectedRoute roles={superAdmin}` + `SuperadminLayout`;
  - `/dev/components` (component gallery) only in development (`import.meta.env.DEV`);
  - `*` → `NotFound`.

### `components/auth/RouteGuards.tsx`

| Export | Behaviour |
|---|---|
| `ProtectedRoute({ roles? })` | While auth is loading: full-page spinner. Guest: redirect to `/login` with `state.from` (login returns there). Wrong role: redirect to `homeFor(user)`. |
| `GuestRoute` | Logged in → redirect to `homeFor(user)`. |
| `FullPageLoader` | The spinner screen. |

`homeFor(user)` (in `AuthContext`) is `/superadmin` for superadmins, `/dashboard` for everyone else.

## Talking to the backend: `lib/api.ts`

The **only** module that calls `fetch`.

- `API_BASE` = `import.meta.env.VITE_API_URL` or `/api/v1` (same origin; Vite proxies it in development, the backend
  serves it in production). Set `VITE_API_URL` at build time only if the API lives on another origin.
- **`tokenStore`**: the JWT is stored under `evx_token` in `localStorage` ("Remember me") or `sessionStorage`; session
  storage wins when both exist. Impersonation: `startImpersonation(token)` saves the superadmin's own token under
  `evx_return_session` (session storage, this tab only) and puts the impersonation token in session storage;
  `stopImpersonation()` restores it; `isImpersonating()`.
- **Requests** add `Authorization: Bearer …` unless `{ auth: false }`; JSON bodies are serialized; `FormData` is sent as is.
- **Responses:** understands the `{ data, error, meta }` envelope and the plain JSON of `/auth`. Every failure becomes an
  `ApiError(message, status, code, fieldErrors?)`; network failures become `NETWORK_ERROR` ("Is the backend running?").
- **Events:** a 401 on a request that carried a token notifies `onUnauthorized` listeners (AuthContext logs out, or
  returns to the superadmin after an impersonation ends); a 503 `MAINTENANCE` notifies `onMaintenance` listeners
  (PlatformContext refreshes and shows the maintenance screen).
- **Methods:** `api.get`, `api.list` / `api.getList` (returns `{ data, meta }` for paged lists; two names for historical
  reasons), `post`, `patch`, `put`, `delete`, `upload(path, file, field = "file")`, `blob(path)` (authenticated file as a
  Blob, e.g. PDF preview), `download(path, fallbackName)` (authenticated download using the server's file name).
- Helpers: `buildQuery({ a, b })` (skips empty values), `errorMessage(err, fallback)`.

## Contexts (`context/`)

### `AuthContext.tsx`

State: `status` (`loading` | `guest` | `authenticated`), `user`, `organization` (with plan), `impersonator`.

| Function | Does |
|---|---|
| `login(email, password, remember)` | `POST /auth/login`; returns `{ user }` or `{ challengeToken }` when 2FA is needed |
| `completeTwoFactor(challengeToken, code, remember)` | `POST /auth/login/2fa` |
| `register(input)`, `acceptInvite(input)` | create the account and start a remembered session |
| `logout()` | clears the stored token (JWTs are stateless: use "log out everywhere" to invalidate other sessions) |
| `refresh()` | reloads `GET /auth/me` (after changing org settings, plan, profile…) |
| `impersonate(token)`, `stopImpersonating()` | switch to / back from a "log in as" session |

On start, if a token exists, it calls `/auth/me`; the token is only thrown away if the server answers 401/404 (not when
the server is down).

### `PlatformContext.tsx`

Loads `GET /platform` (name, logo, favicon, banner, maintenance, SEO, trial days, upload limit, contact, social) on start,
every 60 seconds and whenever an API call reports maintenance. Applies the favicon, `document.title` and meta description.
`usePlatform()` → `{ platform, refresh }`. Used by the banner, maintenance screen, footer, sign-up page, upload fields.

### `components/app/ConfirmDialog.tsx` (`ConfirmProvider`, `useConfirm`)

`const confirm = useConfirm(); if (await confirm({ title, description, confirmLabel, cancelLabel?, tone: "danger" })) …`
One dialog for the whole app, promise-based. Used for every destructive action and by `useUnsavedChanges`.

## Hooks (`hooks/`)

| Hook | Use |
|---|---|
| `useApi<T>(path \| null)` | Loads `path` → `{ data, meta, loading, initialLoading, error, reload }`. `null` skips (e.g. no event selected). A new path aborts the previous request (no stale results while typing). `initialLoading` is true only before the first data, so reloads keep showing old rows instead of flashing a skeleton. |
| `useUrlState(defaults)` | Filters/search/page in the URL: `{ values, set(changes), reset(keep = ["eventId"]) }`. Defaults are omitted from the URL; any change except `page` resets to page 1; uses `replace` (no history spam). |
| `useSelectedEvent()` | `[eventId, select]` for the `EventPicker`: `?eventId=` in the URL, remembered in `localStorage` so Registrations → Speakers → Certificates keep the same event. Selecting an event clears other filters. |
| `useUnsavedChanges(dirty)` | In-app navigation asks "Discard unsaved changes?" (`useBlocker` + `useConfirm`); closing/refreshing the tab shows the browser warning. React Router allows **one** blocker at a time, so a page with several forms (Settings) owns a single call. |
| `useVisibilityToggle(resource, onChanged)` | Show/hide a speaker, sponsor or session on the public page with an Undo toast. |
| `useNow(intervalMs = 60000)` | Current time that re-renders periodically (countdowns, "time left"). |

## Helpers (`lib/`)

| File | Exports |
|---|---|
| `status.ts` | **Single source** of every status label and colour: `EVENT_STATUS`, `EVENT_MODE`, `REGISTRATION_STATUS`, `SPONSOR_TIER`, `ORG_STATUS`, `TEAM_ROLE`, `PAYMENT_STATUS`, `CERT_STATUS`, `CERT_TYPE`, `ANNOUNCEMENT_STATUS`, `VISIBILITY`; `STATUS_MAPS`, `TONE_CLASSES`, `statusOptions(kind)` (for filters), `statusLabel(kind, value)`. Used by `StatusBadge`. Change wording here, e.g. PUBLISHED → "Upcoming". |
| `format.ts` | `formatDate`, `formatDateTime`, `formatTime`, `formatPKR` ("Free" for 0), `formatMoney` (always an amount, "PKR 0"), `formatDuration`, `formatRelative` ("5 min ago"), `formatTimeLeft`, `formatMonth("2026-10")`, `plural(n, word)`. Locale `en-PK`. |
| `permissions.ts` | `useCan()(permission)`: `write` = admin/manager (and superadmin), `manage` = admin (and superadmin). |
| `validation.ts` | zod `emailSchema`, `passwordSchema`, `phoneSchema` (Pakistani numbers) and `PASSWORD_HINT`, mirroring the backend rules. |
| `activityText.ts` | `describeActivity(item)`: activity action code + metadata → sentence ("created the event "Tech Summit""). **Add a case for every new action code.** |
| `date.ts` | `toDatetimeLocal(iso)` / `fromDatetimeLocal(value)` for `<input type="datetime-local">`. |
| `csv.ts` | `downloadCsv(fileName, header, rows)` (client-side CSV with BOM). |
| `contact.ts` | `whatsappLink(number, text?)` → `https://wa.me/…`. |
| `utils.ts` | `cn(...classes)` (clsx + tailwind-merge), used by every component. |

## Types (`types/`)

TypeScript shapes of API responses, one file per area: `auth` (Role, AuthUser, Organization, Plan, responses), `event`,
`registration`, `speaker`, `sponsor`, `session`, `ticket`, `certificate`, `idcard`, `dashboard` (overview, analytics,
activity), `team`, `billing`, `platform` (`/platform` settings), `website` (home-page content), `public` (public org/event
pages), `superadmin` (tenants, payments, users, security, maintenance, announcements…). They are written by hand to match
the controllers; when an endpoint's response changes, update its type.

## Styles: `index.css`, Tailwind

- Google Fonts: **Playfair Display** (headings, `.font-heading`) and **Inter** (body, `.font-body`).
- `@layer base`: shadcn CSS variables, body font and background.
- `@layer components`: `.font-heading`, `.font-body`, `.btn-primary` and similar public-site helpers; `@layer utilities`:
  named colour helpers from the original homepage (`.text-purple`, `.bg-lavender`…). Then the home page's animations
  (ticker columns, float, shimmer, 3D text), with `prefers-reduced-motion` respected.
- `tailwind.config.js`: brand purple scale (`primary` = `#7c3aed`), shadcn colour tokens, `tailwindcss-animate`.
- Colour conventions in components use literal hex values from CLAUDE.md (`#7c3aed`, `#0f172a`, `#64748b`, `#e9e4ff`,
  `#f3f0ff`).
