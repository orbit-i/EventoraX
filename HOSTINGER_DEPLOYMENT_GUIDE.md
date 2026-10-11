# 🚀 EventoraX Enterprise - Multi-Tenant SaaS & PaaS Deployment Guide

A battle-tested, step-by-step production deployment guide for deploying **EventoraX v2.0 Enterprise** to **Hostinger (Shared / Cloud / VPS), AWS, DigitalOcean, or Docker** with full **Multi-Tenancy, Subdomain Routing, PaaS REST APIs, and White-Labeling**.

---

## 📑 Table of Contents
1. [Architecture & Multi-Tenancy Overview](#-architecture--multi-tenancy-overview)
2. [Step 1: Domain & Wildcard DNS Configuration](#-step-1-domain--wildcard-dns-configuration)
3. [Step 2: MySQL Database Setup (Hostinger hPanel / phpMyAdmin)](#-step-2-mysql-database-setup-hostinger-hpanel--phpmyadmin)
4. [Step 3: Import Enterprise Multi-Tenant Schema](#-step-3-import-enterprise-multi-tenant-schema)
5. [Step 4: Prepare & Build Application Files](#-step-4-prepare--build-application-files)
   - [Option A (Fastest): Local Vite Build + File Upload](#option-a-fastest-local-vite-build--upload)
   - [Option B: Hostinger Cloud / VPS SSH Build](#option-b-hostinger-cloud--vps-ssh-build)
   - [Option C: 1-Click Docker Compose (Hostinger VPS)](#option-c-1-click-docker-compose-hostinger-vps)
6. [Step 5: Hostinger Node.js Application Setup](#-step-5-hostinger-nodejs-application-setup)
7. [Step 6: Production Environment Variables (`.env`)](#-step-6-production-environment-variables-env)
8. [Step 7: LiteSpeed / Apache Configuration (`.htaccess`)](#-step-7-litespeed--apache-configuration-htaccess)
9. [Step 8: Health Check & System Verification](#-step-8-health-check--system-verification)
10. [🏢 Default Tenant Workspaces & Credentials](#-default-tenant-workspaces--credentials)
11. [🔌 PaaS Developer API & Widget Verification](#-paas-developer-api--widget-verification)
12. [🛠️ Troubleshooting & Production Gotchas](#️-troubleshooting--production-gotchas)
13. [💰 Ready-to-Sell SaaS Monetization Playbook](#-ready-to-sell-saas-monetization-playbook)

---

## 🏛️ Architecture & Multi-Tenancy Overview

EventoraX Enterprise employs a hybrid multi-tenant architecture designed to scale seamlessly on cost-effective infrastructure like Hostinger:

```
                               ┌─────────────────────────────────────────────────────────────┐
                               │       Incoming Traffic (*.eventorax.com / custom domains)   │
                               └──────────────────────────────┬──────────────────────────────┘
                                                              │
                               ┌──────────────────────────────▼──────────────────────────────┐
                               │           Hostinger Edge / LiteSpeed Reverse Proxy          │
                               │                SSL Termination & .htaccess                  │
                               └──────────────┬──────────────────────────────┬───────────────┘
                                              │                              │
                        /api/v1/* (PaaS API)  │                              │ /t/:slug or Subdomain
                   x-api-key Authentication   │                              │ Workspace Session
                                              │                              │
                               ┌──────────────▼──────────────────────────────▼───────────────┐
                               │              EventoraX Express Server (server.js)           │
                               │                  Node.js v20 LTS / ESM Engine               │
                               ├─────────────────────────────────────────────────────────────┤
                               │  Tenant Resolver Middleware (Header, Subdomain, JWT, Slug) │
                               ├──────────────────────────────┬──────────────────────────────┤
                               │  PaaS Engine (/api/v1)       │  SaaS SPA Client (dist/)     │
                               │  - API Key Auth & Scoping    │  - Workspace Switcher        │
                               │  - Ticket Issuance & Checkin │  - White-Label Portals       │
                               │  - Webhook Dispatcher        │  - Platform Owner Console    │
                               └──────────────┬───────────────┴──────────────────────────────┘
                                              │ Partitioned Queries (tenant_id foreign key)
                               ┌──────────────▼──────────────────────────────────────────────┐
                               │          Hostinger MySQL 8.0 / MariaDB (Port 3306)          │
                               │        tenants | members | events | attendees | api_keys    │
                               └─────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Resolution Priority:
1. **Header-Based (`x-tenant-id` or `x-tenant-slug`):** Used by SPA dashboard and mobile apps.
2. **API Key-Based (`x-api-key`):** Automatically resolves tenant in `/api/v1/*` PaaS requests.
3. **Subdomain-Based (`slug.eventorax.com`):** Parsed dynamically against `BASE_DOMAIN`.
4. **Path-Based (`/t/:slug`):** Out-of-the-box public branded registration portals.
5. **JWT Token Fallback:** Stored in user session.

---

## 🌐 Step 1: Domain & Wildcard DNS Configuration

To enable white-label subdomains for each customer (e.g. `acme.yourdomain.com`), configure a **Wildcard DNS Record**:

### In Hostinger DNS Zone / Cloudflare:
1. Log in to **Hostinger hPanel** ➔ **Domains** ➔ Select your domain ➔ **DNS / Nameservers**.
2. Add a new **A Record**:
   - **Type:** `A`
   - **Name:** `*` *(wildcard)*
   - **Points to:** Your Hostinger Server IP Address
   - **TTL:** `300` or `Automatic`
3. Also ensure the primary `@` and `www` records point to the same IP.
4. If using **Cloudflare**: Set SSL/TLS mode to **Full (strict)** and enable wildcard proxying.

> [!NOTE]
> Even without wildcard DNS, EventoraX **works instantly** out-of-the-box using path-based tenant portals: `https://yourdomain.com/t/:tenant-slug`.

---

## 🗄️ Step 2: MySQL Database Setup (Hostinger hPanel)

1. In **hPanel**, navigate to **Databases** ➔ **MySQL Databases**.
2. Under **Create a New MySQL Database**, enter:
   - **Database Name:** `eventorax` *(Full: e.g. `u123456789_eventorax`)*
   - **Username:** `admin` *(Full: e.g. `u123456789_admin`)*
   - **Password:** Strong generated password *(e.g. 18+ characters)*
3. Click **Create**.
4. Note down:
   - **DB_HOST:** `localhost`
   - **DB_PORT:** `3306`
   - **DB_NAME:** `u123456789_eventorax`
   - **DB_USER:** `u123456789_admin`
   - **DB_PASSWORD:** `your_password`

---

## 📥 Step 3: Import Enterprise Multi-Tenant Schema

1. In hPanel, click **Enter phpMyAdmin** next to your database.
2. Select your database from the left sidebar.
3. Click the **Import** tab.
4. Choose the `database.sql` file from this repository.
5. Click **Import** (or **Go**).
6. Verify that the enterprise tables are created:
   - `tenants` (Multi-tenant organizations, subdomains, branding, plan tiers)
   - `tenant_members` (Users mapped to tenants with role: owner, admin, member)
   - `tenant_api_keys` (PaaS developer keys: `evx_live_...`)
   - `tenant_webhooks` (Automated event webhooks)
   - `users` (Global authentication credentials)
   - `events` (Partitioned by `tenant_id`)
   - `event_attendees` (Partitioned by `tenant_id`, QR ticket codes)
   - `subscriptions` & `activity_logs`

---

## 📦 Step 4: Prepare & Build Application Files

### Option A (Fastest & Recommended): Local Vite Build + Upload

1. On your local machine, run the production build:
   ```bash
   npm run build
   ```
2. Create a zip archive containing:
   ```
   ├── dist/                 (Vite production build)
   ├── db/                   (Database connector & schema migrations)
   ├── middleware/           (Tenant resolver & auth guards)
   ├── routes/               (SaaS & PaaS REST routes)
   ├── .env                  (Production environment configuration)
   ├── .htaccess             (LiteSpeed security & proxy rules)
   ├── database.sql          (Schema backup)
   ├── package.json          (Dependencies)
   ├── package-lock.json     (Locked dependency tree)
   └── server.js             (Unified Express production server)
   ```
   *(Do NOT include `node_modules/` or `src/`)*
3. Upload and extract the zip in `public_html/` via Hostinger File Manager.

---

### Option B: Hostinger Cloud / VPS SSH Build

1. Connect via SSH:
   ```bash
   ssh -p 65002 u123456789@your-server-ip
   cd ~/public_html
   ```
2. Clone repository:
   ```bash
   git clone https://github.com/your-username/EventoraX.git .
   npm install
   NODE_OPTIONS="--max-old-space-size=2048" npm run build
   ```

---

### Option C: 1-Click Docker Compose (Hostinger VPS)

If using Hostinger VPS (Ubuntu 22.04 / 24.04):
1. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
2. Launch stack:
   ```bash
   docker compose up -d --build
   ```
3. EventoraX and MySQL 8.0 will spin up automatically on port 5000 with healthy auto-restart.

---

## ⚙️ Step 5: Hostinger Node.js Application Setup

1. In Hostinger hPanel, search for **Node.js** in the left sidebar.
2. Click **Create Application**:
   - **Node.js Version:** `20.x` LTS
   - **Application Mode:** `Production`
   - **Application Root:** `public_html`
   - **Application Startup File:** `server.js`
   - **Application URL:** Your primary domain
3. Click **Create Application**.
4. In the Node.js dashboard, click **Run npm install** (or via SSH: `npm install --omit=dev`).

---

## 🔐 Step 6: Production Environment Variables (`.env`)

Create `public_html/.env`:

```env
# ==============================================================
# EventoraX Enterprise Multi-Tenant SaaS & PaaS (.env)
# ==============================================================

# Server Runtime
PORT=5000
NODE_ENV=production

# Multi-Tenant Base Domain (for wildcard subdomain routing)
BASE_DOMAIN=yourdomain.com

# Hostinger MySQL Database Settings
DB_HOST=localhost
DB_PORT=3306
DB_USER=u123456789_admin
DB_PASSWORD=your_actual_hostinger_db_password
DB_NAME=u123456789_eventorax

# Security & Session Secrets
JWT_SECRET=eventorax_enterprise_secret_key_prod_8492049182390123
```

---

## 🛡️ Step 7: LiteSpeed / Apache Configuration (`.htaccess`)

Verify `public_html/.htaccess` contains:

```apache
# Enable Rewrite Engine
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # 2. Block direct HTTP access to sensitive files
  RewriteRule ^(\.env|\.git|database\.sql|package\.json|package-lock\.json|tsconfig.*\.json|server\.js)$ - [F,L]

  # 3. Ensure Authorization & API Key headers pass to Express
  RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
</IfModule>

# Security HTTP Headers & Iframe Widget Support
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  # Allows clients to embed your EventoraX booking widget on external websites
  Header always set Content-Security-Policy "frame-ancestors 'self' *;"
</IfModule>

# Caching for Vite Assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
```

---

## 🚀 Step 8: Health Check & System Verification

Open your browser and test the health endpoint:
```
https://yourdomain.com/api/health
```

Expected JSON response:
```json
{
  "status": "ok",
  "app": "EventoraX Multi-Tenant SaaS & PaaS",
  "version": "2.0.0-enterprise",
  "databaseConnected": true,
  "environment": "production",
  "tenantsCount": 2,
  "uptime": 124.5
}
```

---

## 🏢 Default Tenant Workspaces & Credentials

The database comes pre-seeded with two fully isolated sample tenants and an administrative user:

| Role / User | Email | Password | Assigned Tenants |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@eventorax.com` | `admin123` | EventoraX HQ, Apex Tech Ventures |
| **Workspace 1 (HQ)** | Subdomain: `eventorax-hq` | Slug: `/t/eventorax-hq` | Primary workspace |
| **Workspace 2 (Client)** | Subdomain: `apex-tech` | Slug: `/t/apex-tech` | Client demo workspace |

### Live Navigation Shortcuts:
- **Main SaaS Portal:** `https://yourdomain.com/`
- **Platform Owner Admin:** `https://yourdomain.com/dashboard/platform`
- **Developer PaaS Console:** `https://yourdomain.com/dashboard/developer`
- **Tenant 1 Public Portal:** `https://yourdomain.com/t/eventorax-hq`
- **Tenant 2 Public Portal:** `https://yourdomain.com/t/apex-tech`

---

## 🔌 PaaS Developer API & Widget Verification

### 1. Test REST API with API Key:
```bash
curl -X GET https://yourdomain.com/api/v1/events \
  -H "x-api-key: evx_live_99d8b746a5124e93bc48102a9b31"
```

### 2. Issue a Ticket via API:
```bash
curl -X POST https://yourdomain.com/api/v1/events/1/attendees \
  -H "x-api-key: evx_live_99d8b746a5124e93bc48102a9b31" \
  -H "Content-Type: application/json" \
  -d '{"name": "Sarah Connor", "email": "sarah@cyberdyne.io", "ticketType": "VIP"}'
```

### 3. Embed Widget on Any Customer Website:
```html
<iframe 
  src="https://yourdomain.com/t/eventorax-hq?embed=true" 
  width="100%" 
  height="720" 
  style="border:none; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,0.2);">
</iframe>
```

---

## 🛠️ Troubleshooting & Production Gotchas

1. **Subdomains show 404 or default Hostinger page:**
   - Make sure you added the `*` Wildcard A-record pointing to your server IP.
   - In hPanel ➔ **Subdomains**, if wildcard isn't supported on basic shared tiers, use the `/t/:slug` URLs which work unconditionally.
2. **API Keys return `401 Unauthorized: Invalid API key`:**
   - Verify `.htaccess` has the `RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]` rule.
3. **Database connection failed (`ECONNREFUSED`):**
   - On Hostinger shared hosting, `DB_HOST` must be `localhost` (not `127.0.0.1` or the domain name).
   - Ensure the database user is assigned to the database in hPanel with all privileges.

---

## 💰 Ready-to-Sell SaaS Monetization Playbook

Your platform is completely architected to sell:

| Package | Target Customer | Pricing | Feature Limits |
| :--- | :--- | :--- | :--- |
| **Starter** | Independent Organizers | $29/mo | 3 Active Events, 500 Attendees, Standard Support |
| **Professional** | Event Agencies & Meetups | $79/mo | Unlimited Events, 5,000 Attendees, Custom Slug, Analytics |
| **Enterprise** | Corporate & Festivals | $199/mo | Custom Subdomain, Dedicated Support, White-Labeling |
| **PaaS Developer** | Tech Companies & SaaS Apps | $299/mo | REST API Access, Webhooks, Embedded Iframe Widgets |

Superadmins can manage tenant subscriptions, switch plan tiers, and monitor platform MRR directly from the **Platform Owner Console** (`/dashboard/platform`).

---

*EventoraX Enterprise 2.0 is now 100% ready for hosting, deployment, and commercial SaaS/PaaS operations!*
