# 10. Superadmin panel

*For the EventoraX team only.* The superadmin runs the platform: organizations (called **tenants**), their payments,
plans, users and platform-wide settings. After logging in, the superadmin lands on `/superadmin` with its own menu:
Customers, Money, Insights and Platform.

## Dashboard

![Platform overview](screenshots/sa-dashboard.webp)

- Tenants by status: total (and new this month), active (paid), on trial, expired and suspended.
- **Revenue** from confirmed payments: this month, this year, all time; platform totals (events, registrations,
  certificates, organization users).
- **Needs attention:** payments waiting for confirmation, server errors, many failed logins, plans ending this week,
  recently expired organizations. Click an item to go to it.
- New organizations per month and recent platform activity.
- Quick actions: **Refresh**, **View logs**, **Send announcement**, **Add tenant**.

---

## Customers

### Tenants

![Tenants](screenshots/sa-tenants.webp)

Every organization with its plan, status, end date, team and event counts. Tabs by status (All, Active, Trial, Expired,
Suspended); search by name, slug or any member's email; filter by plan and sign-up date; sort; **Export CSV**.

**Add tenant** creates an organization by hand (for example after a phone call):

![Add tenant](screenshots/sa-tenant-add.webp)

Enter the organization's name, email and phone, the first admin's name and email, the plan and whether it starts as a
trial or active. A **temporary password** is shown once: copy it and give it to the admin. No email is sent.

### A tenant's page

![Tenant detail](screenshots/sa-tenant-detail.webp)

Usage numbers, subscription (plan, status, end date, seats used), contact and branding, recent activity, team, payments
and events. Actions at the top:

| Action | What it does |
|---|---|
| **Log in as admin** | Opens their dashboard as their first admin for up to 1 hour, to help or investigate. A dark banner shows you're viewing as them; **Back to superadmin** returns. Everything you do is logged as done "via log in as". Password changes are blocked. |
| **Change plan** | Moves them to another plan. Nobody is removed; new limits apply to new invites. |
| **Extend** | Adds days (or sets a new end date) to their trial or plan, counting from the later of today and the current end date. |
| **Suspend** / **Reactivate** | Suspending (reason required) stops everyone in the organization from logging in; they see the reason. Reactivating restores it. |
| **Delete organization** (Danger zone) | Permanently deletes it and its files. You must type the exact name. Suspending is usually the better choice. |

### Users

![Users](screenshots/sa-users.webp)

Every account on the platform. Tabs (Active, Unverified, Disabled), search by name, email or organization, filter by role,
**Export CSV**. Click a person (or **View details**) to see their recent logins and activity. Actions:

- **Disable account** / **Enable account** (disabling also logs them out; Undo available).
- **Log out everywhere**.
- **Email reset link** (valid 15 minutes) or **Set temporary password** (shown once, you share it).
- **Reset two-factor login** (only after making sure who you're talking to).

You can't do these to yourself or to another superadmin.

### Certificates

![All certificates](screenshots/sa-certificates.webp)

All certificates of all organizations. Search by verify code, name or email; filter by status, organization and type.
Open one to see the PDF, an **integrity check** (is the PDF unchanged since it was issued?), downloads and the public
verify link, and to **Revoke** (reason required) or **Restore**.

**Bulk revoke…** revokes every valid certificate of one event or one organization (for example after fraud). It first
shows how many will be revoked; a second click does it.

---

## Money

### Revenue & payments

![Revenue and payments](screenshots/sa-revenue.webp)

- **Cards:** payments waiting for you, confirmed total, rejected, outstanding (expired or ending soon without payment).
- Revenue by month, by plan and by payment method.
- **Transactions** tab: every payment with filters (status, method, plan, date) and **Export CSV**.
- **Outstanding** tab: organizations that expired or end within 14 days without submitting a payment, with an Email button.

**Confirming a payment:** click **Review** on a payment that is *Awaiting confirmation*.

![Review a payment](screenshots/sa-payment-review.webp)

1. Check the transaction ID and amount against your JazzCash, Easypaisa or bank statement, and look at the receipt.
2. Optionally add a note. Leave **Email the organization's admins** ticked to tell them.
3. **Confirm payment**: the organization gets that plan, becomes active, and its end date moves one year forward (from
   its current end date if still running, otherwise from today). The dialog shows the exact new date.
4. Or **Reject…** with a reason (required). The organization sees the reason on its Billing page.

### Plans & pricing

![Plans](screenshots/sa-plans.webp)

The plans organizations can buy, with price, seat limits, how many organizations use each and a feature matrix.

![Plan editor](screenshots/sa-plan-editor.webp)

**New plan** / **Edit**: name, yearly price in PKR, maximum admins and managers (empty = unlimited), description,
feature switches (REST API, white label, custom domain, priority support…), whether it shows on the public pricing page,
and its order. **Hide** removes a plan from the pricing page (with Undo). **Delete** only works for plans nobody uses.
Price changes apply to future payments.

---

## Insights

### Analytics

![Platform analytics](screenshots/sa-analytics.webp)

Platform-wide totals, new organizations per month, plan distribution, events and registrations per month, certificates
per month, top 10 organizations and top 10 events. **PDF report** and **CSV** exports.

### Security & activity

![Security](screenshots/sa-security.webp)

- **Cards:** logins and failed logins in the last 24 hours, suspicious IP addresses, locked accounts.
- **Activity log:** every action on the platform, by every organization and superadmin, with filters (search by IP, name
  or email; action type; organization or "Platform only"; dates) and **Export CSV**.
- **Login attempts:** every login try with result, email, IP and device. Click an IP to see all its attempts.
- **Threats & sessions:** suspicious IPs (10+ failed logins in a day, or failures for 3+ different emails), currently
  locked accounts (they unlock by themselves after 15 minutes), and recent sessions with **Force logout**.

![Threats and sessions](screenshots/sa-security-threats.webp)

---

## Platform

### Announcements

![Announcements](screenshots/sa-announcements.webp)

Messages from the EventoraX team to organizations (new features, planned maintenance). Tabs: All, Sent, Scheduled, Drafts.

![New announcement](screenshots/sa-announcement-editor.webp)

1. **New announcement:** title and message.
2. **Who receives it:** all organizations or the organizations on one plan. It shows how many organizations, people and
   admins that is (suspended ones are skipped).
3. **Deliver by:** **In the dashboard** (everyone sees it under the bell) and/or **By email** (to each organization's admins).
4. **When:** **Send now** (asks first), **Schedule** (date and time, sent automatically) or **Save as draft**.

### Email templates

![Email templates](screenshots/sa-email-templates.webp)

The wording of every email the platform sends: Welcome, Verify email, Password reset, Team invite, Registration
confirmation, Event ticket, Certificate, Payment confirmed / renewal, Plan expiring soon, Announcement.

- Pick a template, edit the **subject** and **body**. The toolbar adds headings, bold, italic and links;
  **Insert value** adds things like the person's name (`{{name}}`); **Button** adds the purple button.
- A live preview with sample values sits below the editor.
- **Save template**, **Discard**, **Reset to default** (back to the original text), **Send test to me**.
- Edited templates are marked "Edited".

**SMTP server** tab: shows which mail server sends the emails, **Test connection**, and a form to save a different server.

![SMTP server](screenshots/sa-smtp.webp)

### System settings

Four tabs plus your own account:

| Tab | What's in it |
|---|---|
| **Platform** | Platform name, logo, favicon, free-trial length in days, maximum image upload size, default certificate design |
| **Contact & payments** | Contact email (contact-form messages go here), WhatsApp number, support hours, and the JazzCash, Easypaisa and bank accounts organizations pay into |
| **Banner & SEO** | A banner across the top of the website and every dashboard (message, style, optional link, preview; people can dismiss it); the title and description used by search engines and link previews |
| **Website** | Live numbers on the home page, testimonials, logos of organizations using EventoraX, social media links. Home page sections stay hidden while empty. |
| **My account** | The superadmin's own profile, password, two-factor login and sessions |

![System settings: platform](screenshots/sa-settings-platform.webp)
![System settings: contact and payments](screenshots/sa-settings-contact.webp)
![System settings: banner and SEO](screenshots/sa-settings-banner.webp)
![System settings: website](screenshots/sa-settings-website.webp)

### Maintenance

![Maintenance](screenshots/sa-maintenance.webp)

- **Version:** app version, code version (commit), Node.js version, how long the server has been up.
- **Maintenance mode:** switch on during upgrades. Organizations see a "we'll be right back" screen with your message;
  login, public certificate checks and the superadmin panel keep working.
- **Health:** database, storage (free disk space, size of uploads and certificates), email and background jobs.
- **Scheduled jobs:** expire finished plans (every 10 minutes), plan-ending reminders (every 6 hours, 3 days before the
  end), scheduled announcements (every minute), attendance summaries (every 30 minutes). Each shows its last result and
  next run, with **Run now**.
- **Database backups:** **Back up now** saves a copy of the database on the server and lists earlier backups to download.
  Backups contain personal data: keep downloaded copies safe.
- **Before an upgrade:** a 4-step checklist.
- **Error logs:** server errors with where they happened; click one for technical details. **Clear log**.
- **Clear cache** and **Refresh** at the top.
