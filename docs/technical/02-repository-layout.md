# 2. Repository layout

One repository, two Node projects: the **frontend** at the root and the **backend** in `backend/`. Each has its own
`package.json`, `node_modules` and TypeScript config. They talk only over HTTP.

```
EventoraX-full/
├── .github/workflows/ci.yml   CI: frontend build + knip, backend typecheck + knip (push/PR to main, integration/v1)
├── backend/                   API server (see chapters 3–6)
├── docs/                      documentation
├── public/                    static files copied as-is into dist/
├── src/                       React app (see chapters 7–9)
├── CLAUDE.md                  project guide and agreed decisions (also read by Claude Code)
├── README.md                  what it is, how to run it
├── components.json            shadcn/ui CLI settings (where `npx shadcn add <x>` puts components)
├── eslint.config.js           ESLint flat config (TS, react-hooks, react-refresh). Not part of the checks yet.
├── index.html                 Vite entry HTML: default meta/SEO/og tags, favicon, #root, loads src/main.tsx
├── knip.json                  unused files/exports/deps checker for the frontend
├── package.json               frontend dependencies and scripts (dev, build, lint, preview)
├── postcss.config.js          Tailwind + autoprefixer
├── tailwind.config.js         theme (brand purple scale, fonts, shadcn CSS variables), tailwindcss-animate
├── tsconfig.json              references tsconfig.app.json + tsconfig.node.json, `@/*` → `src/*`
├── tsconfig.app.json          strict TS for src/ (bundler resolution, noUnused*, erasableSyntaxOnly)
├── tsconfig.node.json         TS for vite.config.ts
└── vite.config.ts             dev server :5173 with proxy to :5000, `@` alias, manual chunks for libraries
```

Git-ignored (local only): `node_modules/`, `dist/` (built site), `backend/dist/` (compiled API), `backend/.env`,
`backend/uploads/`, `backend/private-files/`, `backups/`.

## `public/`

| File | Used by |
|---|---|
| `favicon.svg` | default browser-tab icon (`index.html`); replaced at runtime if System settings has a favicon |
| `og-image.png` | default share image (`index.html`, `backend/src/web/spa.ts` for pages without their own image) |
| `images/logo-orbit.png` | ORBIT-I logo in the home page hero (`components/home/HeroSection.tsx`) |

## `docs/`

| Path | Audience |
|---|---|
| `requirements.md` | the original specification (all phases) |
| `product-guide/` | users of every role, with screenshots |
| `handover.md` | team leads: placeholders to replace before launch |
| `manual-testing.md` | click-by-click test scripts per area |
| `technical/` | developers (this documentation) |

## `backend/`

```
backend/
├── .env.example        every environment variable with comments (copy to .env)
├── api-tests.http      ready-made requests for the VS Code "REST Client" extension
├── knip.json           unused-code checker config (fonts loaded by file path are whitelisted)
├── package.json        scripts: dev (tsx watch), build (tsc → dist/), start, seed:demo, reset-2fa
├── prisma.config.ts    Prisma 7 config: schema path, migrations path, seed command, DATABASE_URL
├── tsconfig.json       CommonJS, ES2020, strict + noUncheckedIndexedAccess, src → dist
├── prisma/
│   ├── schema.prisma   the database schema (chapter 6)
│   └── migrations/     SQL migrations, applied in order by `prisma migrate deploy|dev`
└── src/
    ├── index.ts        the Express app
    ├── controllers/    request handlers, one file per area (+ superadmin/)
    ├── jobs/           scheduler + job definitions
    ├── middleware/     auth, org status, scoped DB, roles, API tokens, maintenance
    ├── pdf/            pdfkit renderers and shared assets
    ├── prisma/         Prisma clients and seed / maintenance scripts
    ├── routes/         routers, one file per area
    ├── services/       shared business logic used by several controllers and jobs
    ├── utils/          small helpers
    └── web/spa.ts      serves the built frontend with link-preview tags
```

### `backend/api-tests.http`

Open it in VS Code with the **REST Client** extension; a "Send Request" link appears above each request. Variables at the
top (`@baseUrl`, `@token`, `@eventId`, `@apiToken`…) are filled in by hand after logging in. It covers auth, every
organization area, public pages, the REST API and some superadmin calls. Keep it updated when adding endpoints: it is
the quickest way to test the API without the UI.

### Scripts in `backend/package.json`

| Script | Runs |
|---|---|
| `npm run dev` | `tsx watch src/index.ts` (restarts on save) |
| `npm run build` | `tsc` → `backend/dist/` |
| `npm start` | `node dist/index.js` (production) |
| `npm run seed:demo -- --yes` | `src/prisma/seed-demo.ts`: wipes all organizations and builds the demo one (refuses in production) |
| `npm run reset-2fa -- <email>` | `src/prisma/reset-2fa.ts`: turns off two-factor login for one account |
| `npx prisma db seed` | `src/prisma/seed.ts` (configured in `prisma.config.ts`): plans, settings, superadmin |

## `src/` (frontend)

```
src/
├── main.tsx            entry: providers + data router
├── App.tsx             every route
├── index.css           Tailwind layers, CSS variables, fonts, utility classes
├── components/
│   ├── ui/             shadcn/ui primitives (+ our button and form fields)
│   ├── app/            app-wide building blocks (tables, toolbars, states, dialogs, pickers)
│   ├── layout/         dashboard shell: sidebar, top bar, banners, nav definitions
│   ├── home/           landing page sections
│   ├── public/         public site pieces (plans, legal layout, public shell, social links)
│   ├── auth/           AuthShell (layout of login/register pages) and RouteGuards (Protected/Guest routes)
│   ├── <feature>/      events, registrations, speakers, sponsors, sessions, team, settings, billing,
│   │                   certificates, tickets, idcards, superadmin
│   └── (root files)    Navbar, Footer, OceanCanvas (3D hero waves)
├── context/            AuthContext, PlatformContext
├── hooks/              useApi, useUrlState, useSelectedEvent, useUnsavedChanges, useVisibilityToggle, useNow
├── lib/                api client, formatting, statuses, permissions, validation, small helpers
├── pages/              one file per route: public pages at the root, dashboard/, superadmin/, public/, dev/
└── types/              TypeScript shapes of API responses, one file per area
```

205 files, about 28,000 lines. Details in chapters 7–9.
