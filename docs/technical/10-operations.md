# 10. Operations

How to check, build, deploy and extend EventoraX, plus known limitations. Values to replace before launch are in
[handover.md](../handover.md).

## Checks (run before every commit)

| Check | Command | Pass |
|---|---|---|
| Backend types | `cd backend && npx tsc --noEmit` | no output |
| Frontend types + build | `npm run build` (repo root) | "built in …" (a chunk-size note is fine) |
| Unused code, frontend | `npx knip` (root) | no output |
| Unused code, backend | `cd backend && npx knip` | no output |

There are no automated tests yet. Behaviour is checked with `backend/api-tests.http` (API) and
[manual-testing.md](../manual-testing.md) (UI). If you add tests, add them to CI.

`npx eslint .` currently reports about 80 findings that predate the clean-up (mostly the React-Compiler hook rules
`react-hooks/set-state-in-effect` and `purity`, plus `react-refresh/only-export-components`). It is not part of the checks.
Fix gradually; don't silence rules globally.

## CI (`.github/workflows/ci.yml`)

On every push and pull request to `main` and `integration/v1`, two jobs on Ubuntu with Node 22:

- **Frontend:** `npm ci`, `npm run build`, `npx knip`.
- **Backend:** `npm ci`, `npx prisma generate` (a dummy `DATABASE_URL` only satisfies the config; no database is used),
  `npx tsc --noEmit`, `npx knip`.

## Building and running in production

```bash
# 1. Website → dist/
npm ci
npm run build

# 2. API → backend/dist/
cd backend
npm ci
npx prisma generate
npm run build

# 3. Database
npx prisma migrate deploy
npx prisma db seed          # first time only (it resets the seeded plans, see chapter 3)

# 4. Start (from backend/, so relative folders resolve there)
NODE_ENV=production npm start
```

One Node process serves the API, `/uploads` and the built website (`web/spa.ts` finds `../dist`). Put HTTPS in front
(Hostinger's SSL, or Nginx/Caddy as a reverse proxy; `trust proxy` is already set). Keep the process alive with the
host's Node app manager or `pm2` (`pm2 start dist/index.js --name eventorax` from `backend/`).

**Folders that must persist across deploys** (back them up): `backend/uploads/`, `backend/private-files/`, `backups/`.
If they live elsewhere, set `UPLOAD_DIR`, `PRIVATE_DIR`, `BACKUP_DIR`.

**Environment:** see `backend/.env.example` and the reference table in [handover.md](../handover.md).

**Upgrading a running server:** Maintenance mode on → Back up now → pull, build, `prisma migrate deploy`, restart →
health cards OK → maintenance mode off (the same checklist is on the Maintenance page). Open browser tabs reload once by
themselves if their page files changed (`vite:preloadError` in `main.tsx`).

**Docker:** not set up. The old backend-only Dockerfile was removed during the clean-up because it didn't build the
website. A future image should be multi-stage: build the root (`dist/`) and `backend/` (`backend/dist/`), copy both plus
`backend/node_modules` (production) and `backend/prisma`, run `prisma migrate deploy` on start, and mount the three
persistent folders as volumes.

## Recipes

### Add an organization endpoint

1. Zod schema + handler in `backend/src/controllers/<area>-controller.ts`; use `req.db!` (scoped), `ok` / `fail` /
   `validationFail`, `pagination` for lists, `logActivity` for changes.
2. Route in `backend/src/routes/<area>-routes.ts` with `orgScoped` (+ `canWrite` / `adminOnly`); fixed paths before `/:id`.
3. New activity action → a sentence in `src/lib/activityText.ts`.
4. Request in `backend/api-tests.http`; row in [chapter 4](04-backend-api.md).

### Add a table

1. Model in `schema.prisma` with `organizationId` + `@@index([organizationId])` + `@@map("snake_case_plural")`.
2. Add the model name to `ORG_SCOPED_MODELS` in `src/prisma/scopedClient.ts`.
3. `npx prisma migrate dev --name add_<thing>`. Commit the migration folder.
4. Update [chapter 6](06-database.md).

### Add a dashboard page

1. Page in `src/pages/dashboard/<area>/<Name>Page.tsx` following the list or form template.
2. `lazy()` import + `<Route>` in `App.tsx` (wrap with `writer()` or `ProtectedRoute roles` as needed).
3. Menu item in `src/components/layout/nav.ts` (with `need` if restricted).
4. Types in `src/types/<area>.ts`; statuses in `src/lib/status.ts`.
5. Update the product guide (with a screenshot), [chapter 9](09-frontend-pages.md) and `manual-testing.md`.

### Add a system email, a setting, a job

- Email: see chapter 3 ("Adding a new system email").
- Setting: default in `backend/src/prisma/seed.ts`, validator in `controllers/superadmin/settings-controller.ts`
  (add to the public `/platform` output only if pages need it), field in `SystemSettingsPage.tsx`, type in `src/types/platform.ts`.
- Job: chapter 5 ("Adding a job").

### Add a certificate layout

Add it to `LAYOUTS` and draw its decoration in `pdf/certificate.ts` (follow an existing layout), add a thumbnail drawing
in `components/certificates/TemplatePickerDialog.tsx`. Keys are `<layout>-<variant>`, so it gets all colours automatically.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "Cannot reach the server. Is the backend running?" | Backend not started, or crashed (check its terminal). |
| 504 "Outdated Optimize Dep" / in-app 404 after `npm install` | Restart `npm run dev` (Vite pre-bundles dependencies at start). |
| `JWT_SECRET must be set … at least 32 characters` | Fill `JWT_SECRET` in `backend/.env`. |
| Everyone logged out after a deploy | `JWT_SECRET` changed. |
| "The saved SMTP password can't be decrypted" in logs; 2FA codes rejected | `ENCRYPTION_KEY` (or `JWT_SECRET` without it) changed; re-save SMTP, reset 2FA for users. |
| Emails don't arrive | Maintenance page → Email card / Email templates → SMTP → Test connection. Without SMTP, emails are printed as `DEV EMAIL` in the backend terminal. Gmail: app password + ~500/day limit. |
| `402 ORG_EXPIRED` | The organization's `subscriptionEndsAt` passed; confirm a payment or extend in Superadmin → Tenants. |
| `503 MAINTENANCE` for everyone but the superadmin | Maintenance mode is on (Superadmin → Maintenance). |
| `429 RATE_LIMITED` | A limiter in `utils/rateLimits.ts` or a route file; limits are per IP (per token for `/ext`). |
| Camera doesn't start on a phone | The page must be `https://` (or localhost). |
| Link previews show generic text | `dist/` not built, or `FRONTEND_URL` not the public https URL in production. |
| "Back up now" fails | `mysqldump` not found: set `MYSQLDUMP_PATH`. |
| MySQL "Public Key Retrieval is not allowed" | Already handled by `allowPublicKeyRetrieval` in `prisma/client.ts`; on SSL connections it can be removed. |
| Windows: renaming a file only by case doesn't register | `git mv A tmp && git mv tmp a`. |

## Known limitations and ideas

- **Background jobs run in the API process.** With several processes each would run every job (announcements are safe
  thanks to the claim, reminders/summaries mostly safe thanks to marker rows, but not guaranteed). Use one process, or
  move jobs to a single worker.
- **Seat limits aren't atomic.** Two registrations at the same instant for the last seat can both succeed (check then
  insert). Acceptable for campus events; a transaction with a row lock would fix it.
- **Logging out** only forgets the token in the browser; the JWT stays valid until it expires. "Log out everywhere"
  (or a password change) invalidates all of them.
- **Contact messages** are stored in `contact_messages` but there's no inbox page; they reach the team only by email.
- **`prisma db seed` resets the two seeded plans** on every run.
- **Hybrid events:** the ticket shows the venue; only fully online events print the meeting link on the ticket.
- **Expired organizations** see a generic "plan expired" error on locked pages (e.g. Analytics) rather than a dedicated
  renewal screen.
- **Gmail SMTP** is limited to about 500 emails a day; use a transactional email service in production.
- **Terms and Privacy** are a draft that needs legal review.
- **ESLint** findings (see Checks).
