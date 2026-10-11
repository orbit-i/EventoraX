# Handover guide: from demo to live

EventoraX works end to end, but some values are still placeholders or development settings. This guide lists every one
of them, where it lives and exactly how to replace it. Work through it top to bottom before launch.

**Two kinds of settings**

| Kind | Where | How to change | Takes effect |
|---|---|---|---|
| Server settings | `backend/.env` on the server (a text file, never committed to git) | Edit the file | After restarting the backend |
| Platform settings | The database, edited in the app as the superadmin | Superadmin panel → **System settings** (and other pages) | Immediately |
| Code | Files in this repository | Edit, commit, rebuild and redeploy | After the next deploy |

> **Tip:** `backend/.env.example` lists every server setting with a comment. Copy it to `.env` on a new server and fill it in.

---

## Checklist

- [ ] 1. Revoke the Gmail app password that was committed to git
- [ ] 2. Database connection
- [ ] 3. `JWT_SECRET` and `ENCRYPTION_KEY`
- [ ] 4. Domain, HTTPS and `FRONTEND_URL`, `NODE_ENV`
- [ ] 5. Email sending (SMTP)
- [ ] 6. The superadmin account
- [ ] 7. Contact details and WhatsApp number
- [ ] 8. Payment account details (JazzCash, Easypaisa, bank)
- [ ] 9. Plans, prices and trial length
- [ ] 10. Branding: platform name, logo, favicon, share image, SEO
- [ ] 11. Team names on the About page
- [ ] 12. Terms of Service and Privacy Policy
- [ ] 13. Website content: testimonials, logos, live numbers, social links
- [ ] 14. Remove the demo data
- [ ] 15. Backups
- [ ] 16. Move the code to its own GitHub repository

---

## 1. Revoke the Gmail app password that was committed to git

A file `gmailpassword.txt` was committed in the past. It has been deleted, but **it is still in the git history**, and the
branch was pushed to GitHub. Anyone with access to the repository can read it. Treat that password as public.

1. Open https://myaccount.google.com/apppasswords and sign in with the Gmail account used for sending.
2. Delete the app password used by EventoraX.
3. If you keep using Gmail for now, create a new one (see step 5) and put it **only** in `backend/.env`.
4. Never put passwords in tracked files. `.env` is already ignored by git.

## 2. Database connection

File: `backend/.env`

```
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
DB_HOST=HOST
DB_PORT=3306
DB_USER=USER
DB_PASSWORD=PASSWORD
DB_NAME=DATABASE
```

Both forms are needed: `DATABASE_URL` is used by Prisma, the `DB_*` values by the app and by database backups.
On Hostinger, create the MySQL database in hPanel → **Databases** → **MySQL Databases** and copy the values from there.

Then, on the server, inside `backend/`:

```bash
npx prisma migrate deploy   # creates or updates all tables
npx prisma db seed          # plans, default settings and the superadmin (safe to run again)
```

## 3. `JWT_SECRET` and `ENCRYPTION_KEY`

File: `backend/.env`

- `JWT_SECRET` signs every login. Use a new random value in production. Changing it later logs everyone out.
- `ENCRYPTION_KEY` encrypts secrets stored in the database (the SMTP password and two-factor keys). If it is empty, it is
  derived from `JWT_SECRET`.

Generate each value with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> ⚠️ **Set `ENCRYPTION_KEY` once, before anyone turns on two-factor login or saves an SMTP server in the app, and never
> change it afterwards.** If it changes (or `JWT_SECRET` changes while `ENCRYPTION_KEY` is empty), stored secrets can no
> longer be read: two-factor users must be reset (Superadmin → Users → Reset two-factor login) and the SMTP server must be
> saved again.

## 4. Domain, HTTPS, `FRONTEND_URL` and `NODE_ENV`

File: `backend/.env`

```
FRONTEND_URL=https://your-domain.pk
NODE_ENV=production
PORT=5000
```

- `FRONTEND_URL` is used in every email link (verify, reset, invites, tickets, certificates) and in link previews.
  It must be the exact public address, with `https://` and without a trailing slash.
- `NODE_ENV=production` turns on HTTPS-only security headers, uses `FRONTEND_URL` for link previews and blocks the demo
  seed so it can never wipe live data.
- HTTPS is required: the QR check-in scanner can only use the phone camera on an `https://` page.

In production the backend serves the website too. Build the website (`npm run build` in the repo root, creates `dist/`),
start the backend (`cd backend && npm run build && npm start`) and point the domain at it. On Hostinger, turn on the free
SSL certificate for the domain in hPanel → **Security** → **SSL**.

Also update the two fixed addresses in `index.html` (`og:url` and `canonical`, currently `https://eventorax.com`).

## 5. Email sending (SMTP)

The app sends real emails: verification, password reset, invites, tickets, certificates, payment confirmations,
reminders, announcements. It looks for an SMTP server in this order:

1. **Saved in the app:** Superadmin → **Email templates** → **SMTP server** tab.
2. **`backend/.env`:** `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`.
3. **Neither:** emails are only printed in the backend terminal as `DEV EMAIL` (good for development).

**For launch, use a transactional email service**, not a personal Gmail. Gmail allows about 500 emails a day and may block
bulk sends (a certificate batch for 300 attendees is already 300 emails). Good options: Brevo, Amazon SES, Mailgun,
Zoho ZeptoMail. Each gives you SMTP host, port, user and password.

Steps (any provider):

1. Create an account with the provider and verify your sending domain. The provider shows DNS records (SPF, DKIM) to add
   in your domain's DNS settings; without them, emails land in spam.
2. Log in as the superadmin → sidebar **Email templates** → tab **SMTP server**.
3. Fill in **Server**, **Port** (usually 587), **Username**, **Password** and **From** (for example
   `EventoraX <no-reply@your-domain.pk>`).
4. Click **Test connection**. It should say it connected. Then click **Save server**.
5. Switch to the **Templates** tab, pick any template and click **Send test to me**.

The password saved in the app is encrypted in the database (see step 3).

**Gmail in `.env` (development or a very small launch):**

1. Turn on 2-Step Verification on the Google account.
2. Open https://myaccount.google.com/apppasswords → create an app password named "EventoraX" → copy the 16 characters.
3. In `backend/.env`:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=the-account@gmail.com
   EMAIL_PASS=the16characters
   EMAIL_FROM="EventoraX <the-account@gmail.com>"
   ```
4. Restart the backend.

**Email wording:** every system email can be edited in Superadmin → **Email templates** (live preview, Reset to default).

## 6. The superadmin account

The superadmin is created by `npx prisma db seed` from `backend/.env`:

```
SEED_SUPERADMIN_EMAIL=owner@your-domain.pk
SEED_SUPERADMIN_PASSWORD=a-long-unique-password
```

The seed never changes an existing account, and login emails can't be changed in the app.

**New server (empty database):** set the two values above before running `npx prisma db seed`.

**Existing database, replace the current superadmin's email:**

1. On the server, inside `backend/`, run `npx prisma studio`. A browser tab opens.
2. Click the **User** model → find the row whose `role` is `superAdmin`.
3. Double-click the `email` cell → type the new address → click **Save 1 change** (top).
4. Log in with the new email and the old password, then change the password: Superadmin → **System settings** → **My account**.

**Then, as the superadmin:**

1. **System settings** → **My account** → **Two-factor login** → **Turn on** → scan with an authenticator app → save the
   recovery codes somewhere safe (a password manager).
2. If the phone and codes are ever lost: on the server, `cd backend && npm run reset-2fa -- owner@your-domain.pk`.
3. After setup, remove `SEED_SUPERADMIN_PASSWORD` from `.env` (it is only needed by the seed).

## 7. Contact details and WhatsApp number

Superadmin → **System settings** → tab **Contact & payments**.

| Field | Currently | Used on |
|---|---|---|
| Contact email | `eventorax@gmail.com` | Footer, Contact page, Terms/Privacy, Help & support. Contact-form messages are emailed here. |
| WhatsApp number | `+92 300 0000000` (**placeholder**) | Footer, Contact page, Help & support, Billing |
| Support hours | `Mon–Fri, 9:00 am – 6:00 pm (PKT)` | Footer, Contact page |

Replace the WhatsApp number with the real one (format `+92 3XX XXXXXXX`) or clear the field to hide it everywhere.
Click **Save**.

## 8. Payment account details

Superadmin → **System settings** → tab **Contact & payments** → **JazzCash number**, **Easypaisa number**, **Bank IBAN**.
**All three are empty now.** Organizations see these on their **Billing** page when they pay. Fill in the
accounts you actually use, leave the others empty (empty ones are hidden), and click **Save**.

How payments work: the organization pays outside the app, enters the transaction ID and a receipt screenshot, and the
superadmin confirms it in **Revenue & payments** → **Review** → **Confirm payment**. There is no payment gateway.

## 9. Plans, prices and trial length

- **Plans & prices:** Superadmin → **Plans & pricing**. The seeded plans are Pro (PKR 20,000/year) and Enterprise
  (PKR 25,000/year). Edit a plan to change its price, seat limits, features or description. The public Pricing page
  updates immediately. Price changes apply to future payments only.
- **Free trial length:** Superadmin → **System settings** → **Platform** → "Free trial (days)". It is **1 day** now,
  which is very short for a real launch; 7 or 14 days is common.

## 10. Branding: name, logo, favicon, share image, SEO

In the app (Superadmin → **System settings**):

- **Platform** tab: platform name, logo, favicon (a small square PNG, e.g. 64 × 64), max image upload size,
  default certificate design.
- **Banner & SEO** tab: the browser-tab title and the description search engines and link previews show.

In the code (change, rebuild, redeploy):

| File | What it is |
|---|---|
| `public/og-image.png` | The picture shown when a page link is shared on WhatsApp/Facebook (1200 × 630). Replace it with a final design. |
| `public/favicon.svg` | The default browser-tab icon (used until a favicon is uploaded in System settings) |
| `public/images/logo-orbit.png` | The ORBIT-I logo in the home page hero |
| `index.html` | Default title, description, keywords, `og:url` and `canonical` (`https://eventorax.com`) |

## 11. Team names on the About page

File: `src/pages/About.tsx`, the list that starts with `{ name: 'Member One', role: 'UI/Frontend Lead' }` (around line 150).
Replace each `Member …` with the real name. The roles are real; adjust them if needed. Then delete the comment
`{/* Placeholder names for now … */}` above the list. Rebuild and redeploy.

## 12. Terms of Service and Privacy Policy

Files: `src/pages/Terms.tsx` and `src/pages/Privacy.tsx`.

They describe how EventoraX really works (manual PKR payments, no auto-renew, organizers own attendee data, what the
public verify page shows, Pakistani law), but they are a **good-faith draft, not legal advice**. Before launch:

1. Have someone qualified review both pages.
2. Check the operator name ("ORBIT-I, Pakistan") is the right legal name.
3. Update `updated="October 2026"` in both files whenever the text changes.

## 13. Website content

Superadmin → **System settings** → tab **Website**. Each home page section stays hidden while it is empty, so the site
never shows invented content.

- **Show live numbers on the home page:** real counts of organizations, events and certificates.
  Leave it off until the numbers are impressive.
- **Testimonials:** up to 8 real quotes, with name, role and organization. Only add quotes you have permission to use.
- **Logos:** up to 16 logos of organizations that use EventoraX (with their permission).
- **Social links:** Facebook, Instagram, LinkedIn, X (Twitter), YouTube. Shown in the footer and on the Contact page.
- Click **Save website content**.

## 14. Remove the demo data

The development database contains the demo organization "Margalla University Computer Society" and possibly test
organizations. **Do not copy the development database to production.** Start production with an empty database
(`migrate deploy` + `db seed`, step 2).

If demo or test organizations ever end up on a live server: Superadmin → **Tenants** → open the organization →
**Danger zone** → **Delete**, typing its exact name. The demo seed refuses to run when `NODE_ENV=production`.

## 15. Backups

- **Manual:** Superadmin → **Maintenance** → **Database backups** → **Back up now**. The file is saved on the server in
  `backups/` (next to `backend/`) and can be downloaded from the same page.
- The backup uses `mysqldump`. If the page says it can't find it, set its full path in `backend/.env`:
  `MYSQLDUMP_PATH=/usr/bin/mysqldump` (Linux) or `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe` (Windows).
  `BACKUP_DIR=/path/to/folder` changes where backups go.
- **Also back up the files**, not just the database: `backend/uploads/` (logos, photos, receipts) and
  `backend/private-files/` (certificate PDFs).
- **Automatic:** use the hosting panel's daily backup feature (Hostinger hPanel → **Backups**), and download a copy
  regularly so it also exists off the server.

## 16. Move the code to its own GitHub repository

The code lives on the `integration/v1` branch of `orbit-i/EventoraX`, together with the 17 old team branches.

1. On GitHub, create a new, **private** repository (for example `orbit-i/eventorax-app`). Don't add a README.
2. In this folder:
   ```bash
   git remote add app https://github.com/orbit-i/eventorax-app.git
   git push app integration/v1:main
   ```
3. On GitHub → the new repository → **Settings** → **Collaborators**: add the team.
4. The CI checks (`.github/workflows/ci.yml`) run automatically on every push to `main`.
5. Because of step 1, consider this a good moment to make sure no secret is in the new repository's history
   (the `gmailpassword.txt` file is in the old history; revoking it, step 1, is what makes it harmless).

---

## Reference: every server setting

| Variable | Needed | Example / default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | yes | `mysql://user:pass@host:3306/eventorax` | Database for Prisma |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | yes | | Database for the app and backups |
| `JWT_SECRET` | yes | 64+ random characters | Signs logins |
| `ENCRYPTION_KEY` | recommended | 64+ random characters | Encrypts stored secrets |
| `PORT` | no | `5000` | Port the backend listens on |
| `FRONTEND_URL` | yes | `https://your-domain.pk` | Links in emails, link previews |
| `NODE_ENV` | production | `production` | Production security and behaviour |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | for email | | SMTP server (unless saved in the app) |
| `UPLOAD_DIR` | no | `uploads` | Public uploads folder |
| `PRIVATE_DIR` | no | `private-files` | Certificate PDFs folder |
| `BACKUP_DIR` | no | `../backups` | Database backups folder |
| `MYSQLDUMP_PATH` | if not found | | Path to `mysqldump` |
| `WEB_DIST` | no | `../dist` | The built website the backend serves |
| `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_PASSWORD` | for the seed | | The first superadmin |
