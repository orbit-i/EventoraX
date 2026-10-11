# EventoraX technical documentation

For developers joining the project. It explains every folder and file, top to bottom, and how the parts connect.
Read the chapters in order the first time; later, jump to the area you're changing.

Conventions that every change must follow (envelope, validation, logging, page templates, copy style) are in
[`CLAUDE.md`](../../CLAUDE.md). This documentation explains how the existing code works.

## Chapters

| # | Chapter | Covers |
|---|---|---|
| 1 | [Architecture](01-architecture.md) | the big picture, multi-tenancy, request lifecycle, auth, roles, org lifecycle, files, emails |
| 2 | [Repository layout](02-repository-layout.md) | every top-level file and folder, config files, scripts |
| 3 | [Backend foundation](03-backend-foundation.md) | `index.ts`, middleware, Prisma clients and scripts, all of `utils/`, `web/spa.ts` |
| 4 | [Backend API](04-backend-api.md) | every router and controller, endpoint by endpoint |
| 5 | [Services, PDFs and jobs](05-backend-services-pdf-jobs.md) | `services/`, `pdf/`, `jobs/` |
| 6 | [Database](06-database.md) | every model in `schema.prisma`, migrations |
| 7 | [Frontend core](07-frontend-core.md) | `main.tsx`, `App.tsx`, contexts, `lib/`, `hooks/`, `types/` |
| 8 | [Frontend components](08-frontend-components.md) | `components/ui`, `app`, `layout`, feature folders |
| 9 | [Frontend pages](09-frontend-pages.md) | every page, what it calls, how it's built |
| 10 | [Operations](10-operations.md) | checks, CI, building, deploying, adding features, troubleshooting |

## Progress checklist

All chapters were written on 2026-10-11 and checked against the code at commit time. If you add a chapter later, add a
box here, and tick it only once every name in it has been verified against the code.

- [x] 1. Architecture
- [x] 2. Repository layout
- [x] 3. Backend foundation
- [x] 4. Backend API
- [x] 5. Services, PDFs and jobs
- [x] 6. Database
- [x] 7. Frontend core
- [x] 8. Frontend components
- [x] 9. Frontend pages
- [x] 10. Operations

**How to continue:** read the files of the next chapter's area (paths are listed in chapter 2), write the chapter in the
same style (tables of files with their exports and purpose, then the flows that connect them), verify every name
against the code, tick the box, commit with `docs(technical): …`.

## Keeping it current

When you add or change a file, update the chapter that lists it in the same commit. A doc that disagrees with the code
is worse than none.
