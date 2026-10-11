# EventoraX

Event management for Pakistani universities and organizations: events, registrations, QR tickets and check-in,
certificates with public verification, ID cards, analytics and billing in PKR. One platform hosts many organizations
(multi-tenant), run by a superadmin.

## Features

- **Events**: drafts, publishing, schedule, speakers, sponsors, categories, seat limits, archive and restore.
- **Registrations**: add by hand, CSV import with a dry run, public self-registration page, bulk status and email, CSV/Excel export.
- **Tickets**: a QR ticket PDF for every registration, email or ZIP download, camera check-in scanner.
- **Certificates**: 60 designs, bulk issue and email, auto-issue on check-in, public verify page, revoke and restore.
- **ID cards**: 4 designs, 9 per A4 sheet or one per page, print tracking.
- **Analytics**: dashboards, PDF report, activity log.
- **Organizations**: team roles (admin, manager, viewer), branding, notifications, two-factor login, REST API (Enterprise).
- **Billing**: yearly plans in PKR, manual payments (JazzCash, Easypaisa, bank transfer) confirmed by the superadmin.
- **Superadmin panel**: tenants, payments and revenue, plans, users, certificates, platform analytics, system settings,
  email templates, security log, maintenance and backups, announcements.

## Tech stack

| Part | Technology |
|---|---|
| Frontend (repo root) | React 19, TypeScript, Vite 7, Tailwind CSS 3, shadcn/ui (Radix), React Router 7, react-hook-form + zod |
| Backend (`backend/`) | Node.js 22, Express 5, TypeScript, Prisma 7, MySQL 8, pdfkit, nodemailer |

## Getting started

**You need:** Node.js 22+, MySQL 8, Git.

```bash
# 1. Install
npm install
cd backend && npm install

# 2. Configure the backend
cp .env.example .env          # then fill in the database password and JWT_SECRET

# 3. Create the database tables and the base data (plans, settings, superadmin)
npx prisma migrate deploy
npx prisma db seed

# 4. Optional: a demo organization with realistic data (wipes all organizations!)
npm run seed:demo -- --yes    # login: willkariim@gmail.com / Demo@12345
```

Run it (two terminals):

```bash
cd backend && npm run dev     # API on http://localhost:5000
npm run dev                   # website on http://localhost:5173 (forwards /api and /uploads to the API)
```

Without email settings in `.env`, emails are printed in the backend terminal instead of being sent.

## Scripts

| Where | Command | What it does |
|---|---|---|
| root | `npm run dev` | Frontend dev server |
| root | `npm run build` | Typecheck and build the website into `dist/` |
| root | `npx knip` | Find unused files, exports and dependencies |
| backend | `npm run dev` | API with auto-reload |
| backend | `npm run build` / `npm start` | Compile to `backend/dist/` / run the compiled API |
| backend | `npx tsc --noEmit` | Typecheck |
| backend | `npm run seed:demo -- --yes` | Rebuild the demo organization |
| backend | `npm run reset-2fa -- <email>` | Turn off two-factor login for an account (lost phone) |

In production the backend also serves the built website (`dist/`), so one Node process runs the whole app.

## Project structure

```
├── src/                 Frontend (pages, components, hooks, API client, types)
├── public/              Static files (favicon, logo, share image)
├── backend/
│   ├── src/             API: routes → controllers → services, PDF engines, background jobs
│   ├── prisma/          Database schema and migrations
│   └── api-tests.http   Ready-made API requests (VS Code REST Client)
├── docs/                Documentation (see below)
└── .github/workflows/   CI checks
```

## Documentation

| Document | For |
|---|---|
| [Product guide](docs/product-guide/README.md) | Everyone who uses the app: every page, by role, with screenshots |
| [Handover guide](docs/handover.md) | Team leads: replacing placeholders before going live |
| [Technical docs](docs/technical/README.md) | Developers: every folder and file, and how they connect |
| [Manual test scripts](docs/manual-testing.md) | Testers: click-by-click checks for every area |
| [Requirements](docs/requirements.md) | The original project specification |
| [CLAUDE.md](CLAUDE.md) | Conventions and agreed decisions (also read by Claude Code) |

## Team

Built by Team Orbit. See the About page for the team.
