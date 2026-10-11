# Manual test scripts

Click-by-click checks for every area of EventoraX. Use them after a big change, before a release, or to learn the app.

**Before you start**

1. Start the backend (`cd backend && npm run dev`) and the frontend (`npm run dev`), open http://localhost:5173.
2. Optional clean slate: `cd backend && npm run seed:demo -- --yes` (wipes all organizations, rebuilds the demo one).
3. Logins (password `Demo@12345`): `willkariim@gmail.com` (admin), `willkariim+hira@gmail.com` (admin),
   `willkariim+usman@gmail.com` / `willkariim+ayesha@gmail.com` (manager), `willkariim+bilal@gmail.com` (viewer).
   Superadmin: `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` from `backend/.env`.
4. **Emails are real** when `backend/.env` has SMTP details. Only use `willkariim+<anything>@gmail.com` addresses for test
   people, and switch off "email" options in dialogs when you don't need the email.

---

## Sign-up, login and account

1. `/register` → submit empty to see field errors → create an organization with a `willkariim+new1@gmail.com` admin.
   You land on the dashboard with a trial banner. Check the inbox for the welcome and verification emails.
2. Log out → log in with a wrong password 5 times → the account is locked for 15 minutes.
3. `/forgot-password` → the email has a reset link (valid 15 minutes) → set a new password → other sessions are logged out.
4. **Two-factor login:** Settings → My account → Two-factor login → **Turn on** → scan the QR with an authenticator app →
   type the code → save the 10 recovery codes. Log out and in: a second "code" step appears. "Use a recovery code" works
   once per code. Turn it off again (asks for the password).

## Events

1. Sidebar → **Events** → **New event** → submit empty (field errors) → fill in and save as Draft.
2. Change status to Upcoming → the event hub shows the **Public page** card (Copy link, QR for posters, Open).
3. Duplicate an event, archive an event with registrations (it is archived, not deleted), then restore it.
4. Sidebar → **Speakers**, **Sponsors** and **Schedule**: add, edit, toggle "show on public page" (Undo in the toast);
   speakers and sessions can be reordered by dragging (**Reorder**).

## Registrations

1. Registrations → pick an event → add a person by hand → change status (Registered → Attended → Absent → Cancelled → restore).
2. **Import CSV** → upload a file → map columns → the dry run shows new / duplicate / invalid rows → pick a duplicate
   strategy → confirm.
3. Select rows → bulk status change, bulk email, **Export** (CSV / Excel).
4. Filters (search, status, category, source) stay in the URL: copy the URL into a new tab and the same view opens.

## Tickets and check-in

1. **Tickets** → pick an event → download one ticket PDF, the ZIP of all tickets, email a ticket.
2. **Scan** (`/dashboard/tickets/scan`) → allow the camera (needs localhost or https) → scan a ticket QR, or type a
   `TKT-…` number → the person becomes Attended. Scanning again says "already checked in". **Undo check-in** reverts it.

## Certificates

1. **Certificates** → pick an ended event → **Issue** → choose type and design (60 designs) → optionally email them.
2. Open a certificate PDF → copy its verify code → open `/verify/<code>` (public) → it shows VALID.
3. **Revoke** with a reason → the verify page shows REVOKED and the reason → **Restore**.
4. When a batch of certificate emails finishes, admins get a "Certificates sent" email and bell notification.

## ID cards

1. Sidebar → **ID cards** → pick "Startup Pitch Night".
2. Click each template thumbnail; the preview updates. Untick "QR code", tick "Email", toggle the logo.
3. **Preview a full page** → a new tab shows sample cards on an A4 sheet with crop marks.
4. **Download all cards** → the "Cards printed" number and the "Card" column update.
5. Filter "Not printed yet", tick two rows → **Download selected cards**. Row menu → **View card** (does not count as printed).
6. Print a sheet and scan a badge QR with the check-in scanner: it checks the attendee in.

## Analytics and activity

1. **Analytics** → charts load → **PDF report** downloads `analytics-report-YYYY-MM-DD.pdf` (2 pages).
2. **Activity log** → "downloaded the analytics PDF report" is listed. Filter by date range, export CSV.

## Team, settings, billing

1. **Team** → invite a `willkariim+inv1@gmail.com` manager → resend → cancel the invite. Plan seat limits are enforced.
2. **Settings** → change something on two tabs → the tabs show a dot → try to leave the page: you are asked first.
3. Settings → Notifications: the three switches (new registrations, attendance summaries, certificates sent).
4. **Billing** → **Pay** → pick JazzCash → enter a transaction ID + receipt image → the payment shows as Pending.
5. Log in as the viewer (`+bilal`): no create, edit or delete buttons anywhere.

## Public pages

1. Open an Upcoming event's public page (`/e/<eventId>`) → register with a `willkariim+self1@gmail.com` address →
   the QR ticket shows on screen, and the confirmation email arrives with the ticket PDF.
2. Register again with the same email → "already registered".
3. Dashboard → Registrations: the person shows with source "Public page"; admins get a "New registration" bell entry.
4. `/o/margalla-cs` lists the organization's upcoming and past events.
5. Switch "Registration open" off on the event → the public form says "Registration is closed".
6. `/pricing` shows the plans from the database in PKR; `/contact` sends a message (5 per hour per IP).

## API tokens and REST API (Enterprise)

1. On a Pro organization: sidebar **API** explains it is part of Enterprise.
2. On an Enterprise organization: **Create token** → copy it (shown once).
3. In VS Code open `backend/api-tests.http`, paste the token into `@apiToken`, run the `API2` requests.
4. **Revoke** the token → the same request now answers 401. `/developers` documents every endpoint.

## Superadmin

1. **Platform overview** loads with tenant counts, revenue and "Needs attention".
2. **Tenants** → **Add tenant** (use a `willkariim+…` admin) → copy the temporary password → open the tenant →
   **Extend** (+7 days), **Change plan**, **Suspend** (reason) → **Reactivate** → **Log in as admin** → the dark banner →
   **Back to superadmin** → delete the test tenant from its Danger zone (type its name).
3. **Revenue & payments** → **Review** a pending payment → untick "Email the organization's admins" → **Confirm** (plan
   +1 year) or **Reject** (reason required).
4. **Plans & pricing** → create a hidden "Starter" plan → edit → hide/show (Undo) → delete it.
5. **Users** → disable (Undo), set a temporary password, force logout, reset two-factor login.
6. **Certificates** → search `EVX-` → revoke and restore. **Bulk revoke…** shows the count before anything happens.
7. **Analytics** → PDF report and each CSV export.
8. **System settings** → banner on with a message → it shows on the public site and every dashboard (dismissable).
   Set "Max image upload" to 1 MB → a 1.5 MB logo upload fails → set it back.
9. **Email templates** → edit Certificate → preview updates → Save ("Edited") → **Reset to default**.
   **SMTP server** → **Test connection**.
10. **Security & activity** → filter by action, export CSV; Login attempts → click an IP; Threats & sessions lists locked accounts.
11. **Maintenance** → health cards OK → **Run now** on each job → **Back up now** (file appears in `backups/`) →
    maintenance mode on → an org dashboard shows the maintenance screen → off again.
12. **Announcements** → new announcement, audience "Pro plan only", In the dashboard, **Schedule** 2 minutes ahead →
    it moves to Sent → an org admin sees it under the bell.

## Production build and link previews

1. `npm run build` in the repo root, restart the backend, open http://localhost:5000: the whole app runs from the backend.
2. `curl -s http://localhost:5000/o/margalla-cs` (or `| findstr og:` on Windows) shows `og:title` / `og:image`.
3. After deployment, check real previews with https://developers.facebook.com/tools/debug/ (paste an event link).
