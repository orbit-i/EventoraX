# 6. Database

MySQL 8 through Prisma 7. Schema: `backend/prisma/schema.prisma`. Migrations: `backend/prisma/migrations/`.
Connection: `backend/src/prisma/client.ts` (MariaDB driver adapter, see chapter 3).

## Conventions

- **Table names are lowercase snake_case** via `@@map("…")` (MySQL on Linux is case-sensitive for table names).
  Column names are the Prisma field names (camelCase).
- **Ids** are `cuid()` strings.
- **Tenant column:** every organization-owned table has `organizationId`, indexed, even child tables of `Event`, so tenant
  filtering never needs a join. These models are listed in `ORG_SCOPED_MODELS` (`src/prisma/scopedClient.ts`); the scoped
  client adds the filter automatically. A new org-owned model must be added there.
- **Deletes cascade** from `Organization` → users, events, payments, logs, notifications, tokens; from `Event` → categories,
  registrations, speakers, sponsors, sessions, certificates, tickets, ID cards. Optional links use `SetNull`
  (a deleted category leaves registrations without one; a deleted speaker leaves sessions without one).
- **Money** is `Decimal(10,2)` in PKR (`currency` column defaults to `"PKR"`). Decimals are sent to the browser as strings.
- **Secrets** are never stored in clear: tokens as SHA-256 hex (`token`, `tokenHash`), 2FA secret encrypted, recovery codes hashed.
- Enum values: auth enums are lowercase (`Role`, `OrgStatus`, historical), everything else UPPER_CASE.

## Entity overview

```
Plan 1──* Organization 1──* User ──* PasswordResetToken / EmailVerificationToken
                │            └──* Invitation (invitedBy)
                ├──* Event 1──* EventCategory ──* Registration
                │      ├──* Registration 1──1 Ticket
                │      │         ├──* Certificate   (unique per registration + type)
                │      │         └──* IdCard        (one row per print)
                │      ├──* Speaker 1──* Session
                │      ├──* Sponsor
                │      └──* Session
                ├──* Payment *──1 Plan
                ├──* ActivityLog, Notification, ApiToken, ContactMessage
Platform: SystemSetting, EmailTemplate, Announcement ──* Notification, LoginAttempt, ErrorLog
```

## Models

### Plans and organizations

| Model (table) | Key fields | Notes |
|---|---|---|
| `Plan` (`plans`) | `name` unique, `price` (PKR/year), `maxAdmins`/`maxManagers` (null = unlimited), `features` JSON, `isVisible`, `sortOrder`, `description` | Feature keys: `unlimitedEvents`, `unlimitedAttendees`, `qrTicketing`, `bulkCertificates`, `analytics`, `emailAutomation`, `auditLogs`, `restApi`, `customDomain`, `whiteLabel`, `prioritySupport` (+ informational counts). Code checks `features.restApi` for the API. |
| `Organization` (`organizations`) | `slug` unique (public URL `/o/<slug>`), `status` (trial/active/expired/suspended), `subscriptionEndsAt` (trial and paid end date), `planId`, branding (`logoUrl`, `primaryColor`, `accentColor`, `signatureUrl`, `signatoryName`, `signatoryTitle`), `whiteLabelName`, `customDomain` unique, `notificationPrefs` JSON, `suspendedAt`/`suspendedReason` | The tenant. See the lifecycle in chapter 1. |

### Auth

| Model | Key fields | Notes |
|---|---|---|
| `User` (`users`) | `email` unique (one account = one organization), `password` (bcrypt), `role`, `organizationId` (null for superadmin), `emailVerified`, `isActive`, `tokenVersion`, `twoFactorSecret` (encrypted), `twoFactorEnabledAt`, `twoFactorRecoveryCodes` (JSON array of hashes), `lastLoginAt` | `tokenVersion` is in every JWT; incrementing it logs the user out everywhere. |
| `PasswordResetToken`, `EmailVerificationToken` | `token` unique (hash), `expiresAt` | 15 minutes / 24 hours. |
| `Invitation` (`invitations`) | `(email, organizationId)` unique, `role`, `token` (hash), `expiresAt` (7 days), `acceptedAt`, `invitedById` | Pending = not accepted and not expired. Counts toward seat limits. |
| `LoginAttempt` (`login_attempts`) | `email`, `userId?`, `success`, IP, user agent | Lockout, security page, suspicious IPs. Indexed by email+time and IP+time. |

### Events

| Model | Key fields | Notes |
|---|---|---|
| `Event` (`events`) | `title`, `organizer`, `topic`, `description`, `mode`, `startDateTime`/`endDateTime`, `location`, `meetingLink`, `maxAttendees` (null = no limit), `ticketPrice`, `registrationOpen`, `certTemplateId` (certificate template key; the name is historical), `autoIssueCert`, `status` | Index on `(organizationId, status)`. |
| `EventCategory` (`event_categories`) | `(eventId, label)` unique | Attendee groups per event. |
| `Registration` (`registrations`) | `(eventId, email)` unique, `refNo` unique (`REG-…`), name, email, phone, department, rollNo, `categoryId?`, `registeredVia` (WEB/ADMIN/CSV_IMPORT/API), `status` | Index `(eventId, status)`. Always has one `Ticket`. |
| `Speaker` (`speakers`) | firstName, lastName, title, company, sessionTopic, bio, photo, linkedin, `displayPublic`, `displayOrder` | |
| `Sponsor` (`sponsors`) | name, website, logo, `tier` (PLATINUM/GOLD/SILVER/BRONZE), `displayPublic`, `displayOrder` | |
| `Session` (`sessions`) | title, `startTime`/`endTime`, location, `speakerId?`, `displayPublic`, `displayOrder` | Agenda item. |

### Credentials

| Model | Key fields | Notes |
|---|---|---|
| `Certificate` (`certificates`) | `(registrationId, type)` unique, `verifyCode` unique (`EVX-XXXX-XXXX`), snapshot fields (`recipientName`, `recipientEmail`, `category`), `templateKey`, `sha256Hash` (CHAR 64), `pdfUrl` (private file key), `status` (ISSUED/REVOKED), `revokedAt`/`revokeReason`, `downloadCount`, `emailedAt`, `issuedAt` | The snapshot + hash make certificates independent of later edits to the registration. |
| `Ticket` (`tickets`) | `registrationId` unique, `ticketNo` unique (`TKT-…`), `qrCode` unique (32 hex), `type` (category label), `isUsed`, `usedAt`, `usedById`, `emailedAt` | Check-in claims `isUsed` atomically. |
| `IdCard` (`id_cards`) | `registrationId`, `templateKey`, `fields` JSON, `createdAt` | One row per real download (print history); `pdfUrl` is unused (cards are rendered on demand). |

### Billing

| Model | Key fields | Notes |
|---|---|---|
| `Payment` (`payments`) | `planId`, `amount` (copied from the plan), `method` (JAZZCASH/EASYPAISA/BANK_TRANSFER/OTHER), `status` (PENDING/CONFIRMED/REJECTED), `referenceNo`, `proofUrl`, `notes`, `periodStart`/`periodEnd` (set on confirm), `confirmedById` (plain column), `confirmedAt`, `reviewNote` | Revenue = confirmed payments by `confirmedAt`. |

### Activity, notifications, platform

| Model | Key fields | Notes |
|---|---|---|
| `ActivityLog` (`activity_logs`) | `organizationId?` (null = platform), `userId?`, `action` (`area.verb`), `entityType`/`entityId`, `metadata` JSON (incl. `impersonatedBy`, `via` for API), IP, user agent | Also used as "done" markers by jobs (`billing.expiry.reminder`, `event.attendance.summary`). |
| `Notification` (`notifications`) | `organizationId`, `userId`, `announcementId?`, `title`, `body`, `link`, `readAt` | One row per recipient (the API always filters by the current user). |
| `Announcement` (`announcements`) | `title`, `body` (plain text), `targetPlanId?`, `sendEmail`, `sendInApp`, `status` (DRAFT/SCHEDULED/SENT), `scheduledAt`, `sentAt`, `orgCount`, `emailCount`, `createdById` | |
| `ApiToken` (`api_tokens`) | `tokenHash` unique (CHAR 64), `prefix` (display), `name`, `expiresAt?`, `revokedAt?`, `lastUsedAt`, `createdById` | |
| `ContactMessage` (`contact_messages`) | `source` (PUBLIC/DASHBOARD), name, email, orgName, message, `status` (NEW/READ/RESOLVED), `organizationId?` | Every contact-form and Help & support message is stored here **and** emailed to the `contact.email` setting. There is no page that lists them yet; read them in Prisma Studio. |
| `EmailTemplate` (`email_templates`) | `type` unique, `subject`, `bodyHtml`, `updatedById` | A row exists only for templates the superadmin edited; otherwise the built-in default is used. |
| `SystemSetting` (`system_settings`) | `key` (PK), `value` JSON | Flat keys (`platform.name`, `trial.days`, `smtp`, `banner`, `website.testimonials`…), validated in `controllers/superadmin/settings-controller.ts`, cached 30 s. |
| `ErrorLog` (`error_logs`) | message, stack, method, path, status, userId | 5xx errors and failed jobs. |

## Migrations

| Folder | What it did |
|---|---|
| `20261004113153_init` | The whole unified schema (all tables above except the later columns). |
| `20261011015410_superadmin_panel` | `organizations.suspendedAt/suspendedReason`, `payments.reviewNote`, `plans.description`, `announcements.orgCount/emailCount`, new table `error_logs`. Additive only. |
| `20261011121810_two_factor_login` | `users.twoFactorSecret/twoFactorEnabledAt/twoFactorRecoveryCodes`. Additive only. |

**Workflow**

```bash
cd backend
# change schema.prisma, then create + apply a migration on your local database:
npx prisma migrate dev --name short_description
# on servers / other machines (applies pending migrations, never resets):
npx prisma migrate deploy
# after pulling schema changes without migrating (regenerates the client types only):
npx prisma generate
# browse and edit data:
npx prisma studio
```

Rules: never edit an applied migration; prefer additive changes (new nullable columns, new tables) so a deploy can't break
running code; `prisma migrate reset` wipes the database (ask first, see CLAUDE.md).

## Useful queries (Prisma Studio or SQL)

- Who is the superadmin? `users` where `role = 'superAdmin'`.
- Why can't an org log in? `organizations.status` and `suspendedReason`; their `subscriptionEndsAt`.
- Did a reminder go out? `activity_logs` where `action = 'billing.expiry.reminder'` and `organizationId = …`.
- Contact messages: `contact_messages` ordered by `createdAt` desc.
