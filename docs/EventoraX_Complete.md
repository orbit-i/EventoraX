# EventoraX — Complete Project Document

Merged from: `EventoraX_Build_Specs.pdf` (build specification), `Project.pdf` (team/module/week breakdown), `merged_output.csv` (task tracker).

---

# PART 1 — BUILD SPECIFICATION (EventoraX v1.0)

ORBIT-I — Building Ideas. Creating Impact. Scope: Frontend · Superadmin Panel · Organization Panel. Audience: Development Team. Confidential, internal use only. eventorax.com

## 01 — Product Overview

**What is EventoraX?** A multi-tenant SaaS platform for universities, colleges, companies, and NGOs to manage events end-to-end — from creation to QR ticketing, digital certificates, ID cards, and automated emails.

### User Roles
| Role | Access | Who |
|---|---|---|
| Superadmin | Full platform control | ORBIT-I / Owner |
| Org Admin | Full control of their org | University registrar, company admin |
| Org Manager | Create events, manage attendees, issue certs | Event coordinator |
| Org Viewer | View only — reports, analytics | Department head, auditor |
| Public User | Register, download certs, verify | Students, participants |

### Core Problems Solved
| Problem | EventoraX Solution |
|---|---|
| Manual paper attendance | Digital QR-based attendance tracking |
| Handwritten/Word certificates | 50 professional certificate templates + PDF export |
| No certificate verification | SHA-256 public verification page |
| Scattered tools (Forms, Excel, email) | One unified platform for entire event lifecycle |
| Expensive foreign SaaS (USD pricing) | Affordable PKR pricing — JazzCash / Easypaisa support |
| No ID cards for participants | 4 professional ID card templates with PDF export |
| Manual email sending | Automated emails: confirmation, certificate, reminders |

### Plans
| Feature | Pro — PKR 20,000/yr | Enterprise — PKR 25,000/yr |
|---|---|---|
| Events | Unlimited | Unlimited |
| Attendees per event | Unlimited | Unlimited |
| Admin users | 3 | Unlimited |
| Manager users | 7 | Unlimited |
| Certificates (50 templates) | Yes | Yes |
| QR Ticketing & Scanner | Yes | Yes |
| Bulk Certificate Generator | Yes | Yes |
| ID Card Generator (4 templates) | Yes | Yes |
| Analytics Dashboard | Yes | Yes |
| Email Automation | Yes | Yes |
| Audit Logs | Yes | Yes |
| REST API Access | No | Yes |
| Custom Domain | No | Yes |
| White Label Branding | No | Yes |
| Priority Support | No | Yes |
| Free Trial | 1 day | 1 day |

## 02 — Frontend — Public Website
Tech stack, design language, and visual style are entirely the team's choice. Pages below define required content and functionality.

### Home `/`
- Hero section: headline, subtext, 2 CTA buttons (Start Free Trial, View Pricing)
- Stats bar: events hosted, certificates issued, organizations count
- Feature grid: 6–8 features with icons and descriptions
- How it works: 3-step visual flow (Sign up → Create Event → Issue Certs)
- Pricing section: 2 plan cards (Pro & Enterprise) with feature lists
- Testimonials: 3–4 quotes from organizations
- Logo wall: Trusted by (university / company logos)
- FAQ section: 6–8 common questions
- Footer: links, social, contact, copyright ORBIT-I

### About `/about`
- Hero: What is EventoraX, born from ORBIT-I
- Mission & Vision statements
- The Problem We Solve section
- Team section: ORBIT-I team with photos, roles, LinkedIn
- Built by ORBIT-I — logo, tagline
- Timeline: EventoraX journey / milestones
- CTA: Join us / Try it free

### Pricing `/pricing`
- Plan comparison table: Pro vs Enterprise feature-by-feature
- Pro: PKR 20,000/year — all features listed
- Enterprise: PKR 25,000/year — all features listed
- 1-day free trial badge on both plans
- Payment method badges: JazzCash, Easypaisa, Bank Transfer
- FAQ: billing, cancellation, upgrades
- CTA: Start Free Trial button

### Features `/features`
- Full breakdown of every feature
- Sections: Event Management, Certificate System, QR Ticketing, ID Card Generator, Analytics, Email Automation, REST API, Multi-tenancy

### Certificate Verify `/verify`
- Search input: enter verify code
- Result card: Name, Event, Organization, Date, Category
- Green badge: VERIFIED / Red badge: INVALID
- SHA-256 hash display
- No login required — fully public
- Share button for social proof

### Contact `/contact`
- Contact form: Name, Email, Organization, Message
- WhatsApp direct link button
- Email address displayed
- Social media links
- Location: Pakistan
- Response time note

### Login `/login`
- Email + Password form
- Remember me checkbox
- Forgot password link
- Sign up link

### Register / Trial `/register`
- Fields: Full Name, Organization Name, Email, Password, Phone
- 1-day free trial clearly stated
- No credit card required badge
- On submit: account created → redirect to org dashboard
- Terms & Privacy links

### Terms of Service `/terms`
- Full legal terms — ORBIT-I / EventoraX ownership

### Privacy Policy `/privacy`
- Data collection, usage, and storage policy

### 404 Page
- Branded error page with back-home button

## 03 — Superadmin Panel
Access: separate login at `/superadmin` or `admin.eventorax.com` — ORBIT-I / platform owner only.

### Dashboard `/superadmin`
- Total tenants: active, trial, expired, suspended
- Revenue overview: monthly, yearly, all-time (PKR)
- Total events across all orgs
- Total registrations and certificates issued
- New signups this month (chart)
- Recent activity feed
- Alerts: expired trials, failed payments, errors
- Quick actions: Add tenant, View logs, Send announcement

### Tenant Management `/superadmin/tenants`
- Table: Org Name, Plan, Status, Trial End, Created, Actions
- Actions: View details, Change plan, Extend trial, Suspend, Delete
- Filter by: status, plan, date range
- Search by org name or email
- Drill-down: see tenant's events, team, usage stats
- Impersonate tenant: login as that org admin

### Plans & Pricing `/superadmin/plans`
- List all plans with feature matrix
- Edit plan: name, price, feature toggles
- Create new plan
- Toggle plan visibility (show/hide on pricing page)
- See how many tenants are on each plan

### Revenue & Payments `/superadmin/revenue`
- Revenue by month (chart)
- Revenue by plan (pie chart)
- All transactions: org, plan, amount, date, method, status
- Manual payment confirmation (for bank/JazzCash/Easypaisa)
- Export transactions as CSV
- Outstanding / unpaid list

### Certificates `/superadmin/certificates`
- All certificates across all tenants
- Search by verify code, name, email
- Revoke certificate (with reason)
- View certificate details
- Download count per cert
- Bulk revoke by event or tenant

### Users `/superadmin/users`
- All user accounts across platform
- Filter by role, tenant, status
- Reset password
- Disable / enable user
- View user's tenant and activity

### Analytics & Reports `/superadmin/analytics`
- Monthly new orgs chart (12 months)
- Monthly events and registrations charts
- Plan distribution pie chart
- Top 10 most active organizations
- Top 10 events by registrations
- Certificate issuance trend
- Export all reports as PDF or CSV

### Email Templates `/superadmin/emails`
- Edit all system email templates
- Template types: Welcome, Registration Confirm, Certificate, Renewal, Expiry Warning
- Rich text editor for HTML emails
- Preview email
- Send test email
- SMTP configuration (host, port, user, pass)

### System Settings `/superadmin/settings`
- Platform name, logo, favicon
- Contact email, WhatsApp number
- Trial period in days (global default)
- Maintenance mode toggle
- Announcement banner (sitewide message)
- Payment account details: JazzCash, Easypaisa, Bank IBAN
- File upload limits
- Default certificate template
- SEO: meta title, meta description

### Security & Activity Log `/superadmin/security`
- Full activity log: who, what, when, IP address
- Filter by action type, user, date
- Failed login attempts list
- Suspicious IP detection
- Export security log
- Session management: force logout any user

### Maintenance `/superadmin/maintenance`
- Version number display
- Enable / disable maintenance mode
- Database backup trigger
- Cache clear button
- Error logs viewer
- System health check: DB, storage, email, queue
- Cron job status

### Announcements `/superadmin/announcements`
- Send email announcement to all tenants
- Send to specific plan (Pro only, Enterprise only)
- In-app notification to all dashboards
- Schedule announcement for future date
- View sent announcements history

## 04 — Organization Panel
Each org gets their own dashboard at `/dashboard` after login. All data is fully isolated per tenant.

### Dashboard `/dashboard`
- Welcome message with org name and plan badge
- Trial expiry warning bar (if on trial)
- Stats: Total Events, Total Registrations, Certificates Issued, Team Members
- Recent events table (last 5)
- Registration trend chart (last 6 months)
- Quick actions: Create Event, Add Attendee, Generate Certs
- Upcoming events list
- Recent activity feed

### Events `/dashboard/events`
- List: Name, Date, Mode, Status, Registrations, Actions
- Status badges: Draft, Upcoming, Active, Completed, Archived
- Create Event fields: Name, Mode (Physical/Online/Hybrid), Date, Time, End Date, Venue, Organizer, Topic, Description, Categories, Certificate Template, Max Attendees, Ticket Price, Registration Open toggle, Meeting Link (online), Auto-issue Cert toggle
- Edit / Delete / Duplicate event
- View event detail page with full stats
- Filter by status, mode, date range
- Search by name

### Registrations / Attendees `/dashboard/registrations`
- Filter by event (dropdown)
- Table: Ref No, Name, Email, Phone, Department, Roll No, Category, Status, Registered Via, Date
- Status options: Registered, Attended, Absent, Cancelled
- Add attendee manually (form)
- Import CSV: upload → map columns → preview → confirm
- Mark attendance: change status to Attended
- Bulk actions: mark all attended, export selected
- Export to Excel / CSV
- Send email to selected attendees
- Delete attendee
- Search by name, email, ref no

### Certificates `/dashboard/certificates`
- List: Name, Event, Verify Code, Type, Issued Date, Downloads, Status
- Generate single certificate: pick attendee → generates immediately
- Bulk generate: select event → generate for all Attended attendees
- Send certificate via email (with verify link)
- Download certificate as PDF
- Revoke certificate
- Preview certificate before generating
- Certificate template selector (50 templates)
- Customization: org logo, signature field
- Verify code and SHA-256 hash shown on each cert

### Certificate Verification `/verify` (public)
- Public page — no login required
- Enter verify code → show result
- Result: Name, Event, Org, Date, Category
- VERIFIED (green) or INVALID (red) badge
- SHA-256 hash shown
- Share button

### QR Tickets `/dashboard/tickets`
- Auto-generated on each registration
- List: Ticket No, Attendee Name, Event, Type, Used/Unused, Issued Date
- QR code display per ticket
- QR scanner page: camera-based scan at event entrance
- Mark ticket as used on scan
- Bulk download tickets (ZIP of PDFs)
- Send ticket via email

### ID Cards `/dashboard/idcards`
- Select event and attendees (or all)
- Choose ID card template (4 templates)
- Customize: org logo, fields to show
- Preview ID card
- Generate & download as PDF (bulk or individual)

### Speakers `/dashboard/speakers`
- Per-event speaker list
- Add speaker: Name, Title, Company, Topic, Bio, Photo, LinkedIn
- Edit / delete / reorder speakers
- Option to display on public event page

### Sponsors `/dashboard/sponsors`
- Per-event sponsor list
- Add sponsor: Name, Logo, Website, Tier (Platinum/Gold/Silver/Bronze)
- Edit / delete sponsor
- Option to display on public event page

### Schedule / Agenda `/dashboard/schedule`
- Per-event session schedule
- Add session: Title, Speaker, Time Start, Time End, Location/Room
- Edit / delete / reorder sessions
- Option to display on public event page

### Analytics `/dashboard/analytics`
- Total stats: events, registrations, certs, attended
- Monthly registrations chart (12 months)
- Events by status pie chart
- Attendance rate per event (bar chart)
- Category breakdown: General, VIP, Speaker etc.
- Certificate issuance timeline
- Top events by registrations
- Export analytics as PDF report

### Team Members `/dashboard/team`
- List: Name, Email, Role, Status, Joined Date
- Roles: Admin, Manager, Viewer
- Invite member: enter email → sends invite email
- Change role / remove member
- Role permission matrix shown
- Max team size enforced by plan (Pro: 3 admins + 7 managers)

### API Tokens `/dashboard/api` (Enterprise only)
- Create API token: give it a name, optional expiry
- Token shown once on creation — copy it
- List tokens: name, last used, expiry, status
- Revoke token
- API documentation link
- Base URL shown: `/api/v1/`

### Billing & Plan `/dashboard/billing`
- Current plan name and price
- Renewal date and trial status
- Upgrade plan button
- Payment history table
- Payment instructions: JazzCash, Easypaisa, Bank Transfer
- Contact support link (WhatsApp)

### Settings `/dashboard/settings`
- Organization name, email, phone
- Upload organization logo
- Primary color & accent color pickers (for certificates/ID cards)
- White label name (Enterprise: changes EventoraX branding)
- Custom domain setup instructions (Enterprise)
- Change admin password
- Notification preferences: new registration, attendance, cert
- Danger zone: Delete all data, Cancel account

### Contact Us `/dashboard/contact`
- WhatsApp direct button
- Email support form
- Support hours shown
- Link to documentation

### Activity Log `/dashboard/activity`
- All actions in this org workspace
- Columns: Who, Action, Entity, When, IP
- Filter by action type, user, date
- Export log

ORBIT-I Pakistan · Building Ideas. Creating Impact.

---

# PART 2 — TEAM, MODULES & TIMELINE (Project.pdf)

### Team and git branches
| Member | Role | Modules / Pages | Main Responsibilities | Git Branch |
|---|---|---|---|---|
| Amina Sahar | UI/Frontend Lead | Home, About, Features, Pricing, Contact, Terms, Privacy, 404 | Overall UI design, Navbar, Footer, Hero section, Responsive design, Common layouts | feature/publicwebsite |
| Shahid | Auth & Components Developer | Login, Register | Authentication screens, Sidebar, Topbar, Buttons, Inputs, Tables, Cards, Modals, Search, Pagination | feature/authcomponents |
| Anamta | Dashboard Core Developer | Dashboard, Team, Billing, Settings, Contact, Activity | Dashboard statistics, Charts, Team Management, Billing, Settings, Activity Logs | feature/dashboardcore |
| Hassan Anser | Event Management Developer | Events, Registrations, Speakers, Sponsors, Schedule | Event CRUD, Attendee Management, CSV Import, Attendance, Speaker Module, Sponsor Module, Agenda/Schedule | feature/eventsmodule |
| Isha | Certificate & QR Developer | Certificates, Tickets, ID Cards, Analytics, Verify Page | Certificate Generation, QR Tickets, QR Scanner, ID Cards, Analytics Charts, Public Verification Page | feature/certificatesystem |
| M Adeel Umer | Superadmin Developer | All Superadmin Pages | Tenant Management, Revenue, Users, Plans, Analytics, Emails, Security, Maintenance, Announcements | feature/superadmin |
| Mehwish | Database Manager | Database & API Structure | ER Diagram, Table Design, Relationships, JSON Response Structure, API Documentation, Naming Conventions | database/schemadesign |

### Module assignment
| Module | Assigned To | Work Included |
|---|---|---|
| Public Website | Amina Sahar | Landing Pages, Pricing, Features, Contact, Responsive UI |
| Shared Components | Shahid | Button, Input, Table, Modal, Sidebar, Topbar |
| Authentication | Shahid | Login, Register, Forgot Password |
| Dashboard Core | Anamta | Dashboard Stats, Team, Billing, Settings |
| Event Management | Hasan Anser | Event CRUD, Filters, Event Details |
| Registration System | Hasan Anser | Attendees, CSV Import, Export, Attendance |
| Speakers & Sponsors | Hasan Anser | Speaker and Sponsor Management |
| Schedule Module | Hasan Anser | Session Management |
| Certificates | Isha | Generate, Preview, Revoke, Download |
| QR Tickets | Isha | QR Generation, Scanner, ZIP Download |
| ID Cards | Isha | Template Selection and PDF Generation |
| Analytics | Isha | Charts and Reports |
| Public Verification Page | Isha | Certificate Verification |
| Superadmin Panel | M Adeel Umer | Tenants, Revenue, Plans, Security, Logs, Emails |
| Database Design | Mehwish | Schema, Relationships, API Structure |

### Weekly plan
| Week | Tasks |
|---|---|
| Week 1 | Database Design + UI System + Shared Components |
| Week 2 | Public Website + Authentication + Dashboard Layout |
| Week 3 | Events + Registrations + Speakers + Schedule |
| Week 4 | Certificates + QR Tickets + ID Cards + Analytics |
| Week 5 | Superadmin Panel Development |
| Week 6 | Integration + Testing + Bug Fixing + Deployment |

---

# PART 3 — TASK TRACKER (merged_output.csv)

**How the CSV is structured:** it contains two overlapping tables pasted side by side. Table A (left) lists tasks with a newer status and an empty Notes column; table B (right) lists the same tasks with Assigned To, Week and an older status. Below, every task from table A is shown with Assigned/Week taken from table B, plus both statuses. "(blank)" = no status entered in table A (not started). "—" = no value in table B. The Notes column ("Notes (any difficulty)") is empty for all tasks.

**Name notes:** the CSV assignee names differ from Project.pdf. In table A, section labels "Laiba Tasks (1-7)" and "Fazal Wadood Tasks (8-15)" split the shared-components/auth work (table B calls this assignee "zainab"). "Abeera and Muhammad saeed" = certificate/QR/ID/analytics work (PDF: Isha). "Adeel and Hassan Raza" = superadmin (PDF: M Adeel Umer). "shahbaz" = Auth API. "Adeel" = database. Email Module has no assignee. Table A also contains a stray row "new".

**Totals (205 tasks, latest status):** 117 Completed · 5 In Progress · 44 To Do · 39 blank/not started.

### Database

**DB Setup**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Project structure setup (folders, config) | Adeel | Week 1 | Completed | To Do |
| 2 | MySQL database creation + connection (config/db.js) | Adeel | Week 1 | Completed | To Do |

**DB Design**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | ER diagram finalize | Adeel | Week 1 | Completed | To Do |
| 2 | Tables: users, organizations, plans | Adeel | Week 1 | Completed | To Do |
| 3 | Tables: events, registrations | Adeel | Week 1 | Completed | To Do |
| 4 | Tables: certificates, tickets, id_cards | Adeel | Week 1 | Completed | To Do |
| 5 | Tables: speakers, sponsors, schedules | Adeel | Week 1 | Completed | To Do |
| 6 | Tables: team_members, activity_logs | Adeel | Week 1 | Completed | To Do |
| 7 | Tables: email_templates, transactions | Adeel | Week 1 | Completed | To Do |
| 8 | Foreign keys + relationships setup | Adeel | Week 1 | Completed | To Do |
| 9 | Seed data script (for testing) | Adeel | Week 1 | Completed | To Do |
| 10 | API documentation structure / template | Adeel | Week 1 | Completed | To Do |

### Backend

**Email Module**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Nodemailer setup + SMTP config | — | Week 2 | Completed | To Do |
| 2 | Welcome email template + sender | — | Week 2 | Completed | To Do |
| 3 | Registration confirmation email | — | Week 2 | Completed | To Do |
| 4 | Certificate email (with verify link) | — | Week 4 | Completed | To Do |
| 5 | Renewal / expiry warning email | — | Week 5 | Completed | To Do |
| 6 | Test email sender API | — | Week 2 | Completed | To Do |

**Superadmin API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Superadmin auth (separate login check) | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 2 | Tenant list + view + suspend + delete + extend trial APIs | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 3 | Impersonate tenant API (generate token as org admin) | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 4 | Plans CRUD API | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 5 | Revenue aggregation APIs | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 6 | Transactions CSV export API | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 7 | Global certificates management API (search, revoke, bulk revoke) | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 8 | Users management API (cross-tenant) | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 9 | Global analytics APIs | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 10 | Email template CRUD API | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 11 | SMTP config API | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 12 | System settings API | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 13 | Security + activity log API | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 14 | Failed login tracking | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 15 | Maintenance mode toggle API | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 16 | Database backup trigger API | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 17 | System health check API (DB, storage, email, queue) | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 18 | Announcements API (send + schedule) | Adeel and Hassan Raza | Week 5 | To Do | To Do |

**Activity Log API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Get security log API (superadmin-level) | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 2 | IP tracking | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 3 | Force logout API (session management) | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 4 | Activity logging middleware (auto-log all actions) | Anamta | Week 2 | To Do | To Do |
| 5 | Get activity log API (org-level) | Anamta | Week 2 | To Do | To Do |

**Certificates API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Generate single certificate API (PDF + hash) | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 2 | Bulk generate certificates API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 3 | SHA-256 hash generation utility | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 4 | Verify code generation logic | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 5 | Public verify API (/api/v1/verify) | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 6 | Revoke certificate API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 7 | Send certificate email API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |

**QR API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Auto-generate QR on registration (hook) | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 2 | QR code generation utility (qrcode package) | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 3 | Scan / verify ticket API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 4 | Mark ticket as used API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 5 | Bulk download tickets ZIP API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 6 | Send ticket via email API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |

**ID Cards API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Generate ID card PDF API (single) | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 2 | Bulk generate ID cards API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |

**Analytics API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Org-level analytics aggregation API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 2 | Monthly registrations data API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 3 | Events by status aggregation API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 4 | Attendance rate calculation API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 5 | Export analytics PDF API | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |

**Events API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Create event API | Hassan Anser | Week 3 | Completed | To Do |
| 2 | Get all events API (with filters) | Hassan Anser | Week 3 | Completed | To Do |
| 3 | Get single event API | Hassan Anser | Week 3 | Completed | To Do |
| 4 | Update event API | Hassan Anser | Week 3 | Completed | To Do |
| 5 | Delete event API | Hassan Anser | Week 3 | Completed | To Do |
| 6 | Duplicate event API | Hassan Anser | Week 3 | Completed | To Do |

**Registrations API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Add attendee API | Hassan Anser | Week 3 | Completed | To Do |
| 2 | Get attendees list API (filter by event) | Hassan Anser | Week 3 | Completed | To Do |
| 3 | CSV import API (parse + insert) | Hassan Anser | Week 3 | Completed | To Do |
| 4 | Export attendees API (CSV / Excel) | Hassan Anser | Week 3 | Completed | To Do |
| 5 | Mark attendance API | Hassan Anser | Week 3 | Completed | To Do |
| 6 | Bulk action API (mark attended / export) | Hassan Anser | Week 3 | Completed | To Do |
| 7 | Send email to selected attendees API | Hassan Anser | Week 3 | Completed | To Do |

**Speakers API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Speakers CRUD API | Hassan Anser | Week 3 | Completed | To Do |

**Sponsors API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Sponsors CRUD API | Hassan Anser | Week 3 | Completed | To Do |

**Schedule API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Schedule / Sessions CRUD API | Hassan Anser | Week 3 | Completed | To Do |
| 2 | Reorder API (speakers / sessions) | Hassan Anser | Week 3 | Completed | To Do |

**Auth API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Register API (org + admin user creation) | shahbaz | Week 1 | Completed | Completed |
| 2 | Login API + JWT token generation | shahbaz | Week 1 | Completed | Completed |
| 3 | Password hashing (bcrypt) | shahbaz | Week 1 | Completed | Completed |
| 4 | Forgot password API (token + email) | shahbaz | Week 1 | Completed | Completed |
| 5 | Auth middleware (verify JWT) | shahbaz | Week 1 | Completed | Completed |
| 6 | Role-check middleware (admin/manager/viewer/superadmin) | shahbaz | Week 1 | Completed | Completed |

**Org API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Get org profile API | Anamta | Week 2 | Completed | To Do |
| 2 | Update org settings API | Anamta | Week 2 | Completed | To Do |
| 3 | Logo upload API | Anamta | Week 2 | Completed | To Do |
| 4 | Trial expiry logic (auto-expire after 1 day) | Anamta | Week 2 | Completed | To Do |
| 5 | Plan assignment logic | Anamta | Week 2 | Completed | To Do |
| 6 | Multi-tenant isolation middleware (org_id filter) | Anamta | Week 2 | Completed | To Do |

**Team API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Invite member API (send invite email) | Anamta | Week 2 | Completed | To Do |
| 2 | Get team members API | Anamta | Week 2 | Completed | To Do |
| 3 | Update role API | Anamta | Week 2 | Completed | To Do |
| 4 | Remove member API | Anamta | Week 2 | Completed | To Do |
| 5 | Plan-based limit enforcement (3 admins / 7 managers) | Anamta | Week 2 | Completed | To Do |

**Billing API**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Get billing info API | Anamta | Week 2 | In Progress | To Do |
| 2 | Payment history API | Anamta | Week 2 | In Progress | To Do |
| 3 | Manual payment confirmation API | Anamta | Week 2 | In Progress | To Do |
| 4 | Plan upgrade request API | Anamta | Week 2 | In Progress | To Do |

### Frontend

**Superadmin**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Tenant Management — table + filters | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 2 | Tenant Management — view/edit/suspend/delete actions | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 3 | Tenant Management — impersonate feature UI | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 4 | Plans & Pricing — list + edit/create plan form | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 5 | Revenue — charts (monthly + by plan pie) | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 6 | Revenue — transactions table + export | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 7 | SA Certificates — search + revoke UI | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 8 | Users — table + filters + reset/disable actions | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 9 | SA Analytics — charts + top 10 lists | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 10 | Email Templates — list + rich text editor | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 11 | Email Templates — preview + send test | Adeel and Hassan Raza | Week 5 | Completed | To Do |
| 12 | System Settings page — all config fields | Adeel and Hassan Raza | Week 5 | In Progress | To Do |
| 13 | Security & Activity Log — table + filters | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 14 | Maintenance — toggles + system health UI | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 15 | Announcements — send form + history table | Adeel and Hassan Raza | Week 5 | To Do | To Do |
| 16 | Superadmin login page (separate) | Anamta | Week 5 | To Do | To Do |
| 17 | SA Dashboard — tenant stats + revenue overview | anamta | Week 5 | To Do | To Do |
| 18 | SA Dashboard — alerts + quick actions | anamta | Week 5 | To Do | To Do |

**Certificates**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Certificates list page | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 2 | Generate single certificate flow | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 3 | Bulk generate certificates flow | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 4 | Certificate preview component | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 5 | Template selector (50 templates) UI | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 6 | Customization panel (logo + signature field) | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 7 | Send certificate via email action | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 8 | Revoke certificate modal | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |

**QR Tickets**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | QR Tickets list page | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 2 | QR code display component | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 3 | QR scanner page (camera integration) | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 4 | Bulk download tickets (ZIP) action | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |

**ID Cards**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | ID Cards — select event/attendees UI | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 2 | ID Cards — template selector (4 templates) | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 3 | ID Cards — preview + generate/download | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |

**Analytics**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Analytics — stats cards | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 2 | Analytics — charts (registrations, status pie, attendance bar) | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |
| 3 | Analytics — export PDF report | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |

**Verify Page**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Public Verify page — search input + result card | Abeera and Muhammad saeed | Week 4 | (blank) | To Do |

**Events**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Events list page (table + filters) | Hassan Anser | Week 3 | Completed | To Do |
| 2 | Create event form (all fields) | Hassan Anser | Week 3 | Completed | To Do |
| 3 | Edit / Delete / Duplicate event actions | Hassan Anser | Week 3 | Completed | To Do |
| 4 | Event detail page (stats view) | Hassan Anser | Week 3 | Completed | To Do |

**Registrations**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Registrations list page + filters | Hassan Anser | Week 3 | Completed | To Do |
| 2 | Add attendee manually — form | Hassan Anser | Week 3 | Completed | To Do |
| 3 | CSV import flow (upload → map → preview → confirm) | Hassan Anser | Week 3 | Completed | To Do |
| 4 | Attendance marking UI | Hassan Anser | Week 3 | Completed | To Do |
| 5 | Bulk actions (mark attended / export) | Hassan Anser | Week 3 | Completed | To Do |
| 6 | Export to Excel / CSV button | Hassan Anser | Week 3 | Completed | To Do |

**Speakers**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Speakers list + add/edit form | Hassan Anser | Week 3 | Completed | To Do |
| 2 | Speakers reorder UI | Hassan Anser | Week 3 | Completed | To Do |

**Sponsors**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Sponsors list + add/edit form (tier selection) | Hassan Anser | Week 3 | Completed | To Do |

**Schedule**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Schedule — session list + add/edit form | Hassan Anser | Week 3 | Completed | To Do |
| 2 | Schedule — reorder/drag UI | Hassan Anser | Week 3 | Completed | To Do |

**Dashboard Core**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Dashboard layout (sidebar + topbar wrapper) | Anamta | Week 2 | Completed | To Do |
| 2 | Dashboard — welcome + plan badge + trial warning bar | Anamta | Week 2 | Completed | To Do |
| 3 | Dashboard — stats cards (events, regs, certs, team) | Anamta | Week 2 | Completed | To Do |
| 4 | Dashboard — recent events table | Anamta | Week 2 | Completed | To Do |
| 5 | Dashboard — registration trend chart (6 months) | Anamta | Week 2 | Completed | To Do |
| 6 | Dashboard — quick actions buttons | Anamta | Week 2 | Completed | To Do |
| 7 | Dashboard — activity feed widget | Anamta | Week 2 | Completed | To Do |
| 8 | Team page — members table | Anamta | Week 2 | Completed | To Do |
| 9 | Team page — invite member modal | Anamta | Week 2 | Completed | To Do |
| 10 | Team page — role permission matrix UI | Anamta | Week 2 | Completed | To Do |
| 11 | Billing — current plan + renewal info | Anamta | Week 2 | Completed | To Do |
| 12 | Billing — payment history table | Anamta | Week 2 | Completed | To Do |
| 13 | Billing — upgrade plan flow | Anamta | Week 2 | Completed | To Do |
| 14 | Settings — org profile form | Anamta | Week 2 | Completed | To Do |
| 15 | Settings — logo upload + color pickers | Anamta | Week 2 | Completed | To Do |
| 16 | Settings — white label / custom domain (Enterprise UI) | Anamta | Week 2 | Completed | To Do |
| 17 | Settings — danger zone (delete / cancel account) | Anamta | Week 2 | Completed | To Do |
| 18 | Contact Us page (dashboard version) | Anamta | Week 2 | Completed | To Do |
| 19 | Activity Log page — table + filters | Anamta | Week 2 | Completed | To Do |

**Shared Components**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Button component (primary, secondary, danger variants) | zainab | Week 1 | Completed | Completed |
| 2 | Input field component (text, password, select, textarea) | zainab | Week 1 | Completed | Completed |
| 3 | Table component (sortable + paginated) | zainab | Week 1 | Completed | Completed |
| 4 | Modal / Popup component | zainab | Week 1 | Completed | Completed |
| 5 | Card component | zainab | Week 1 | Completed | Completed |
| 6 | Sidebar component (collapsible) | zainab | Week 1 | Completed | Completed |
| 7 | Topbar / Navbar component | zainab | Week 1 | Completed | Completed |
| 8 | Search bar component | zainab | Week 1 | Completed | Completed |
| 9 | Pagination component | zainab | Week 1 | Completed | Completed |
| 10 | Loading spinner + Toast notification | zainab | Week 1 | Completed | Completed |

**Authentication**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Login page UI + form validation | zainab | Week 2 | Completed | Completed |
| 2 | Register / Trial page UI + form validation | zainab | Week 2 | Completed | Completed |
| 3 | Forgot password page | zainab | Week 2 | Completed | Completed |
| 4 | Remember me checkbox logic | zainab | Week 2 | Completed | Completed |
| 5 | Redirect logic after login (role-based) | zainab | Week 2 | Completed | Completed |

**Public Website**

| # | Task | Assigned To | Week | Status (latest) | Status (older table) |
|---|---|---|---|---|---|
| 1 | Navbar + Footer (common across all pages) | Amina Sahar | Week 2 | To Do | Completed |
| 2 | Home — Hero section | Amina Sahar | Week 2 | To Do | Completed |
| 3 | Home — Stats bar | Amina Sahar | Week 2 | To Do | Completed |
| 4 | Home — Feature grid | Amina Sahar | Week 2 | To Do | Completed |
| 5 | Home — How it works (3-step) | Amina Sahar | Week 2 | To Do | Completed |
| 6 | Home — Pricing cards | Amina Sahar | Week 2 | To Do | Completed |
| 7 | Home — Testimonials section | Amina Sahar | Week 2 | To Do | Completed |
| 8 | Home — Logo wall (Trusted by) | Amina Sahar | Week 2 | To Do | Completed |
| 9 | Home — FAQ accordion | Amina Sahar | Week 2 | To Do | Completed |
| 10 | About — Hero + Mission / Vision | Amina Sahar | Week 2 | To Do | Completed |
| 11 | About — Team section | Amina Sahar | Week 2 | To Do | Completed |
| 12 | About — Timeline milestones | Amina Sahar | Week 2 | To Do | Completed |
| 13 | Pricing page — Comparison table | Amina Sahar | Week 2 | To Do | Completed |
| 14 | Pricing page — Payment badges + FAQ | Amina Sahar | Week 2 | To Do | Completed |
| 15 | Features page — full breakdown sections | Amina Sahar | Week 2 | To Do | Completed |
| 16 | Contact page — form + WhatsApp button | Amina Sahar | Week 2 | To Do | Completed |
| 17 | Terms of Service page | Amina Sahar | Week 2 | To Do | In Progress |
| 18 | Privacy Policy page | Amina Sahar | Week 2 | To Do | Completed |
| 19 | 404 page (branded) | Amina Sahar | Week 2 | To Do | In Progress |
| 20 | Responsive design pass (all public pages) | Amina Sahar | Week 2 | To Do | Completed |