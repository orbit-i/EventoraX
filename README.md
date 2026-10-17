# Eventrye Enterprise - Multi-Tenant Event SaaS & Developer PaaS Platform

Eventrye is an enterprise-grade, high-performance **Multi-Tenant Event Management Platform** engineered to be hosted, scaled, and monetized both as a **B2B SaaS** (for event organizers, universities, conference agencies) and as a **Developer PaaS** (Platform-as-a-Service for external mobile apps, websites, and ticketing systems).

Built with **React 19 + Vite + TypeScript + Tailwind CSS** on the frontend and an enterprise **Node.js (Express) + MySQL 8** multi-tenant partitioned architecture on the backend.

---

## 🚀 Live Demo & Access Links

When running locally (`http://localhost:5000`) or hosted on your production domain:

| Portal / Feature | URL Path | Description & Credentials |
|---|---|---|
| **Main Landing Page** | `/` | Showcase of features, live 3D canvas, interactive pricing |
| **Pricing (SaaS & PaaS)** | `/pricing` | 4-Tier monetization matrix (Starter, Pro, Enterprise, PaaS) |
| **Sign In** | `/login` | Demo credentials: `admin@eventrye.com` / `admin123` |
| **Sign Up & Workspace** | `/register` | Auto-provisions isolated tenant workspace + PaaS API key |
| **Multi-Tenant Dashboard** | `/dashboard` | Tenant-scoped event KPIs, tickets, revenue & activities |
| **Workspace Switcher** | Top Bar in Dashboard | 1-click switch between client tenant organizations |
| **White-Label & Branding** | `/dashboard/settings` | Custom logo, primary/secondary colors, custom slug & CNAME |
| **Developer PaaS Console** | `/dashboard/developer` | API Keys manager, Webhook subscriptions, Embed Widget SDK |
| **Platform Superadmin** | `/dashboard/platform` | SaaS Owner console (Platform MRR, ARR, tenant health, suspend/upgrade) |
| **Branded Public Portal 1** | `/t/eventrye-hq` | Eventrye HQ public event ticketing & RSVP showcase |
| **Branded Public Portal 2** | `/t/apex-tech` | Apex Tech Ventures public event showcase (Blue theme) |
| **Health & Monitoring** | `/api/health` | Real-time tenancy status, uptime, MySQL connection pool |

---

## 💎 Core SaaS & PaaS Architecture

### 1. Multi-Tenant Data Partitioning & Isolation
- **Tenant Context Resolution**: Discovers tenant via header (`x-tenant-id`, `x-tenant-slug`), query string, JWT claims, or subdomain matching (`tenant.yourdomain.com`).
- **Complete Data Partitioning**: All events, attendees, team members, activity audit trails, and financial metrics are strictly scoped by `tenant_id`. Zero cross-tenant data leakage.
- **Tenant Quotas & Limits**: Enforces plan quotas for maximum events, attendee registration limits, and API throughput.

### 2. Developer PaaS (Platform-as-a-Service) Features
- **API Key Authentication**: Issue live keys (`evx_live_...`) with permission scopes.
- **RESTful PaaS v1 API**:
  - `GET /api/v1/events` - Retrieve organization events.
  - `POST /api/v1/events` - Create events programmatically.
  - `POST /api/v1/events/:id/attendees` - Register attendees and generate unique QR ticket passes.
  - `POST /api/v1/checkin` - Real-time barcode & QR scanner validation with duplicate check-in prevention.
  - `GET /api/v1/stats` - Pull event metrics into custom client dashboards.
- **Webhooks Dispatcher**: Register external HTTP callbacks for `attendee.registered` and `attendee.checked_in` with payload signing.
- **Embeddable Ticket Widget**: 1-click iframe snippet generator with live color customizer for embedding on WordPress, Webflow, Shopify, or React.

### 3. White-Labeling & Custom Branding
- Custom workspace subdomains (`/t/:slug`).
- Custom primary & secondary brand colors with live preview.
- Custom organization logos.
- Custom CNAME domain support (`events.clientcompany.com`).

### 4. SaaS Platform Owner Console (Super Admin)
- Global Platform MRR & ARR tracking.
- Global counts for tenants, attendees, events, and API keys.
- Tenant directory with 1-click plan upgrades, tenant suspension, and tenant inspection.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, GSAP, Lucide Icons, React Router 7 |
| **Backend** | Node.js (ES Modules), Express 5, CORS, jsonwebtoken, bcryptjs, crypto |
| **Database** | MySQL 8 / MariaDB (Pool Connection) + High-Fidelity In-Memory Fallback Engine |
| **DevOps & Hosting** | Docker, docker-compose, Hostinger LiteSpeed/cPanel, VPS, Nginx |

---

## 📦 Quick Start & Local Run

### Prerequisites
- Node.js 18+ installed

### Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Build frontend production assets
npm run build

# 3. Start unified backend & frontend server
node server.js
```

Open **`http://localhost:5000`** in your browser.

---

## 🐳 1-Click Docker Deployment

Run the complete multi-tenant platform with MySQL 8 container in seconds:

```bash
# Start Eventrye App + MySQL 8 container
docker compose up -d

# View running services
docker compose ps

# View logs
docker compose logs -f app
```

Access the platform at `http://your-server-ip:5000`.

---

## 🌐 Deploying to Hostinger (cPanel / hPanel)

Eventrye is natively optimized for Hostinger Business and Cloud hosting:

1. **Upload Files**: Upload the project directory to your Hostinger `public_html` or Node.js application directory.
2. **Environment Variables**: Configure `.env`:
   ```ini
   PORT=5000
   NODE_ENV=production
   DB_HOST=localhost
   DB_USER=u123456789_eventrye
   DB_PASSWORD=YourPassword
   DB_NAME=u123456789_eventrye_db
   JWT_SECRET=your_ultra_secure_jwt_secret
   ```
3. **Database Import**: In phpMyAdmin, import `database.sql`.
4. **Hostinger Node.js Setup**:
   - Application Root: `/`
   - Application Startup File: `server.js`
   - Node.js Version: `20.x` or `22.x`
5. **Run**: Click **Restart Application**.

See [HOSTINGER_DEPLOYMENT_GUIDE.md](file:///c:/Users/orbit-iX/OneDrive/Desktop/Eventrye/Eventrye-main/HOSTINGER_DEPLOYMENT_GUIDE.md) for step-by-step screenshots and wildcard DNS configuration.

---

## 💰 Monetization & How to Sell

### As a B2B SaaS
- **Starter ($0)**: Community events, up to 500 attendees.
- **Professional ($49/mo)**: Frequent organizers, 5,000 attendees, branded public portals, custom colors.
- **Enterprise ($199/mo)**: Agencies, venues, 50,000+ attendees, full white-labeling, custom CNAME domains.

### As a Developer PaaS
- **Developer Tier ($299/mo)**: Charge clients or software houses for API keys, webhooks, and embedded ticketing widgets to power custom mobile apps or third-party platforms.
