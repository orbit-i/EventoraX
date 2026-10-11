# 3. Backend foundation

The files every endpoint relies on: the app setup, middleware, Prisma clients, utilities and the web server for the
built site. Paths are relative to `backend/src/`.

## `index.ts`: the Express app

Order matters; this is the order in the file:

1. `dotenv/config` loads `backend/.env`.
2. `trust proxy = 1` so `req.ip` is the real client behind Hostinger/Nginx (rate limits and logs depend on it).
3. **helmet**: security headers with a Content Security Policy that allows images from `https:`, `data:`, `blob:`
   (org logos by URL, PDF previews), Google Fonts, and blob workers. HSTS and `upgrade-insecure-requests` only when
   `NODE_ENV=production` (they would break `http://localhost`).
4. **cors** for `FRONTEND_URL` (only matters if the site and API are on different origins).
5. `express.json({ limit: "5mb" })`.
6. `apiLimiter` on `/api`: 600 requests per minute per IP.
7. `/uploads` static files from `UPLOAD_ROOT`.
8. `GET /api/v1/health`: `SELECT 1` → `{ ok, db }` (used by monitoring and the Maintenance page).
9. `maintenanceGate` for everything under `/api/v1` below this point.
10. Public platform info (`/platform`, `/platform/website`), then every router (table in [Backend API](04-backend-api.md)).
11. A JSON 404 for any other `/api` path.
12. `mountWebApp(app)`: serves `dist/` (see below).
13. The error handler: multer errors → 400; errors with a numeric `status` use it; everything else → 500 with a generic
    message. 5xx errors are printed and saved to `error_logs` (`recordError`).
14. `listen(PORT)` and `startScheduler()` (background jobs).

Unhandled promise rejections in Express 5 route handlers reach the error handler automatically, so controllers can
`throw`.

## Middleware (`middleware/`)

| File | Exports | What it does |
|---|---|---|
| `auth.ts` | `requireAuth`, `AuthUser` | Reads `Authorization: Bearer <jwt>`, verifies it, **reloads the user** (must exist, be active, and have the same `tokenVersion`), checks an impersonating superadmin is still an active superadmin, sets `req.user = { userId, email, name, role, organizationId, impersonatorId? }`. 401 `NO_TOKEN` / `BAD_TOKEN` otherwise. |
| `checkOrgStatus.ts` | `checkOrgStatus({ allowExpired })`, `OrgWithPlan` | Loads `req.org` (with `plan`). 403 `NO_ORG` for users without an org (superadmin), 403 `ORG_SUSPENDED` (with the reason), flips trial/active orgs past `subscriptionEndsAt` to `expired`, then 402 `ORG_EXPIRED` unless `allowExpired`. |
| `scopedPrisma.ts` | `attachScopedPrisma` | Sets `req.db = getScopedPrisma(orgId)`. |
| `role-check.auth.ts` | `requireRole(roles)` | 401 without `req.user`, 403 if the role isn't listed. |
| `orgChain.ts` | `orgScoped`, `orgScopedAllowExpired`, `canWrite`, `adminOnly`, `superAdminOnly` | The chains routes actually use. `orgScoped = [requireAuth, checkOrgStatus(), attachScopedPrisma]`. `canWrite` = admin or manager. |
| `apiToken.ts` | `requireApiToken`, `planHasApi`, `API_TOKEN_PREFIX` | Auth for `/api/v1/ext`: `Bearer evx_live_…` → SHA-256 lookup in `api_tokens`; refuses revoked/expired tokens, suspended/expired orgs and plans without `features.restApi`. Updates `lastUsedAt` at most once a minute. Sets `req.org`, `req.db`, `req.apiToken`. |
| `maintenance.ts` | `maintenanceGate` | When the `maintenance.enabled` setting is on, answers `503 MAINTENANCE` (with the configured message) except for `/auth`, `/health`, `/platform`, `/superadmin`, `/verify`, `/contact`, `/plans`, superadmins and impersonation sessions. |

Typical route declarations:

```ts
router.get("/", orgScoped, list);                         // any member
router.post("/", orgScoped, canWrite, create);            // admin + manager
router.patch("/me", orgScopedAllowExpired, adminOnly, update); // admin, even after expiry
router.get("/tenants", superAdminOnly, listTenants);      // superadmin
```

The `Request` type is extended with `user`, `org`, `db` and `apiToken` through `declare global` blocks in these files,
which is why controllers can write `req.db!` and `req.org!`.

## Prisma (`prisma/`)

| File | Purpose |
|---|---|
| `client.ts` | The one `PrismaClient`, using the **MariaDB driver adapter** (`@prisma/adapter-mariadb`, works with MySQL 8) built from `DB_*` env vars, pool of 5 connections, `allowPublicKeyRetrieval` for MySQL 8 auth without SSL. Default export `prisma`. |
| `scopedClient.ts` | `getScopedPrisma(orgId)`: a `$extends` query extension. For the models in `ORG_SCOPED_MODELS` (User, Invitation, Event, EventCategory, Registration, Speaker, Sponsor, Session, Certificate, Ticket, IdCard, Payment, ActivityLog, Notification, ApiToken) it adds `organizationId` to `where` (find*, count, aggregate, groupBy, update*, delete*), to `data` (create, createMany) and to `upsert`. **A new model with an `organizationId` column must be added to this set.** |
| `seed.ts` | `npx prisma db seed`: upserts the Pro and Enterprise plans (**overwriting** their price, limits and features on every run), the superadmin from `SEED_SUPERADMIN_*` (never overwrites) and default system settings (only missing keys). |
| `seed-demo.ts` | `npm run seed:demo -- --yes`: deletes every organization (and its uploads/private files) and builds the demo organization with realistic data and real certificate PDFs. Refuses without `--yes` and when `NODE_ENV=production`. Sends no email. |
| `reset-2fa.ts` | `npm run reset-2fa -- <email>`: clears the account's 2FA secret and recovery codes (for a superadmin who lost their phone). |

`findUnique` with the scoped client: Prisma requires unique fields in `findUnique`'s `where`; adding `organizationId`
works because Prisma 5+ accepts extra non-unique filters there.

## Utilities (`utils/`)

### HTTP and validation

| File | Exports |
|---|---|
| `http.ts` | `ok(res, data, status?, meta?)`, `fail(res, status, code, message, { fieldErrors })`, `validationFail(res, zodError)` (400 `VALIDATION_ERROR`), `pagination(query, max=100)` → `{ page, limit, skip }`, `q(value)` (trimmed query string or `undefined`) |
| `validation.ts` | `fieldErrors(zodError)` → `{ "path.to.field": "first message" }` |
| `schemas.ts` | zod building blocks: `optionalText(max)`, `optionalUrl`, `optionalImage` (http(s) link or `/uploads/…`), plus `isOneOf`, `parseDate(value, endOfDay)`, `isUniqueViolation(err)` (Prisma P2002) |
| `password.ts` | `PASSWORD_REGEX` (8+ chars, uppercase, digit, special), `PASSWORD_RULE_MESSAGE`, `isStrongPassword`, `EMAIL_REGEX` |
| `csv.ts` | `csvCell` (quotes and neutralises `= + - @` formula injection), `toCsv(header, rows)` (UTF-8 BOM so Excel shows Urdu names) |

### Security

| File | Exports |
|---|---|
| `jwt.ts` | `signAuthToken(payload, remember)` (1 day / 30 days), `verifyAuthToken`, `signImpersonationToken` (1 hour, `imp`), `signTwoFactorChallenge` / `verifyTwoFactorChallenge` (5 minutes, signed with `JWT_SECRET + ":two-factor-challenge"`, `purpose: "2fa"`, so it can never pass as a session). Throws if `JWT_SECRET` is shorter than 32 characters. |
| `tokens.ts` | `randomToken(bytes)` (hex), `hashToken` (SHA-256 hex). Email tokens and API tokens are stored only as hashes. |
| `secrets.ts` | `encryptSecret` / `decryptSecret` / `isEncrypted`: AES-256-GCM with a key = SHA-256 of `ENCRYPTION_KEY` (or `JWT_SECRET + ":eventorax-stored-secrets"`). Format `enc:v1:<iv>:<tag>:<data>` (base64). Plain values pass through `decryptSecret` unchanged (old data). Used for the SMTP password and TOTP secrets. |
| `totp.ts` | RFC 6238 without a library: `newTotpSecret` (160-bit base32), `verifyTotp(secret, code)` (±1 step, timing-safe), `otpauthUrl` (for the QR), `newRecoveryCodes(10)` (`xxxx-xxxx`, no look-alike characters), `normaliseRecoveryCode` |
| `rateLimits.ts` | express-rate-limit instances with the JSON 429 envelope: `loginLimiter` 60/15 min, `twoFactorLimiter` 15/15 min, `registerLimiter` 5/hour, `passwordLimiter` 5/15 min, `emailLinkLimiter` 10/hour, `inviteLimiter` 20/hour, `apiLimiter` 600/min. All per IP; kept generous because a campus shares one IP. |

### Data helpers

| File | Exports |
|---|---|
| `activity.ts` | `logActivity(req, { action, entityType?, entityId?, metadata?, organizationId?, userId? })`: writes `activity_logs` with IP and user agent; adds `impersonatedBy` while impersonating; never throws. Action codes are `area.verb` (e.g. `registration.status`); the frontend turns them into sentences in `src/lib/activityText.ts`. |
| `codes.ts` | `newRefNo()` → `REG-XXXXXXXXXX`, `newTicketNo()` → `TKT-XXXXXXXXXX`, `newQrCode()` (32 hex chars inside the QR) |
| `settings.ts` | `getSetting(key, fallback)` with a 30-second in-memory cache, `setSetting(key, value)` (upsert + forget cache), `clearSettingsCache()` |
| `orgStatus.ts` | `expireOverdueOrgs()` (bulk trial/active → expired), `naturalStatus(orgId, endsAt)`, `DAY_MS` |
| `orgContacts.ts` | `orgAdminEmails(orgId)`: active admins + the org's own email, de-duplicated |
| `roleLimit.ts` | `seatLimitFor(org, role)` (plan's `maxAdmins` / `maxManagers`, `null` = unlimited, viewers unlimited), `seatsUsed(db, role)` (members + valid pending invites) |
| `months.ts` | `monthStart(n)`, `fillMonths(rows, count)` (fills missing months with 0 for charts) |
| `errorLog.ts` | `recordError(err, req, status)` → `error_logs` (never throws) |

### Files and email

| File | Exports |
|---|---|
| `storage.ts` | Public uploads: `UPLOAD_ROOT`, `saveUpload(folder, buffer, mime)` → `/uploads/<folder>/<uuid>.<ext>`, `deleteUpload(publicPath)`, `deleteUploadFolder(folder)`. Private files: `PRIVATE_ROOT`, `savePrivate(key, buffer)`, `readPrivate(key)` (null if missing), `deletePrivateFolder(folder)`. All with path-traversal guards. |
| `upload.ts` | multer configs (memory storage): `imageUpload` (PNG/JPEG/WEBP, hard cap 20 MB), `csvUpload` (.csv, 2 MB); `checkImageSize` / `imageSizeGuard` apply the `uploads.maxMb` setting; `UploadError` (status 400) |
| `emailTemplates.ts` | The 10 editable templates (`TEMPLATE_DEFINITIONS`: type, name, description, where it's used, variables with samples, default subject and HTML). `fill(text, vars, html)` handles `{{var}}` (escaped), `{{{var}}}` (raw) and `{{button "Label" var}}`; unknown variables become empty. `loadTemplate(type)` (DB row or default), `sampleVars`, `escapeHtml`. |
| `mail.ts` | Transport selection (setting `smtp` → `.env` → console), cached nodemailer transporter, `mailStatus()`, `verifyMailTransport()`, the shared `layout()` (purple header, platform name), `sendMail(to, subject, html, devLink?, attachments?)`, `renderEmail(type, vars, override?)`, and one function per email (`sendVerificationEmail`, `sendResetPasswordEmail`, `sendInviteEmail`, `sendWelcomeEmail`, `sendCertificateEmail`, `sendTicketEmail`, `sendRegistrationConfirmEmail`, `sendRenewalEmail`, `sendExpiryWarningEmail`, `sendAnnouncementEmail`, plus the non-template `sendAttendeeMessage` and `sendNotice`). Links use `FRONTEND_URL`. |

**Adding a new system email:** add a type to the `EmailTemplateType` enum (schema + migration), add a definition to
`TEMPLATE_DEFINITIONS`, add a `send…` function in `mail.ts` that calls `sendTemplate`. The superadmin editor picks it up
automatically.

## `web/spa.ts`: serving the built site

`mountWebApp(app)` does nothing if `dist/index.html` doesn't exist (development). Otherwise:

- Static files from `dist/` (`WEB_DIST` overrides the path). Hashed files in `/assets/` are cached for a year
  (`immutable`), other files for an hour.
- Any other GET outside `/api/` and `/uploads/` returns `index.html` (single-page app fallback). Paths that look like
  files (`.js`, `.png`…) and don't exist get a real 404, so an old chunk after a deploy fails cleanly (the frontend then
  reloads once, see `vite:preloadError` in `main.tsx`).
- **Link previews:** social apps don't run JavaScript, so for `/e/:id` (event), `/o/:slug` (organization) and
  `/verify/:code` (certificate) the server looks up the record and rewrites `<title>`, description, canonical,
  Open Graph and Twitter tags in the HTML (org logo as image, or `og-image.png`). Hidden/unknown records answer 404 with
  generic tags. Other pages get the SEO title/description from System settings.
- The template is re-read when `dist/index.html` changes, so a rebuild needs no restart.
- In production the public origin comes from `FRONTEND_URL`; otherwise from the request's host.
