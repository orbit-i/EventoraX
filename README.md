# EventoraX - Next-Gen Event Management & Analytics Platform

EventoraX is a modern, high-performance event management web application engineered for scale, speed, and sleek user experience. Built with **React 18 + Vite + Tailwind CSS (shadcn/ui)** on the frontend and an enterprise-grade **Node.js (Express) + MySQL** architecture on the backend, specifically optimized for **Hostinger Unlimited / Business Web Hosting** and modern cloud environments.

---

## Key Features

- **Event Management Lifecycle**: Create, update, publish, draft, and delete events with customizable categories, ticket pricing, dates, and venue details.
- **Attendee Tracking & Walk-In Ticketing**: Real-time attendee counter, attendee list inspection, and 1-click walk-in attendee badge generation.
- **Live Analytics & KPI Dashboard**: Real-time metrics for total events, active registrations, ticket revenue, engagement rates, weekly attendance charts, and category breakdown.
- **Team Collaboration**: Manage organization members, roles (Admin, Manager, Organizer), statuses, and team invitations.
- **Activity & Security Audit Trail**: Comprehensive tracking of all organizational actions with filtering and timestamps.
- **Subscriptions & Billing**: Tier-based pricing plans (Starter, Professional, Enterprise) with active plan switching.
- **Contact & Inquiries System**: Public inquiry form connected directly to database logging.
- **Authentication & Security**: Secure JWT authentication, password hashing with bcryptjs, protected API routes, and auto-session restoration.
- **Hostinger-Ready Architecture**: Single-port fullstack Express server serving production Vite client with SPA fallback routing + Passenger / hPanel support.
- **Resilient Dual-Mode Database**: Automatic MySQL connection pool with auto-migration and auto-seeding, plus an automatic in-memory fallback engine so the app works seamlessly even without an active MySQL server.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, React Router DOM |
| **Backend** | Node.js (ES Modules), Express 5, CORS, dotenv, jsonwebtoken, bcryptjs |
| **Database** | MySQL (with `mysql2/promise` connection pooling) + Automatic In-Memory Fallback |
| **Hosting Platform** | Hostinger Unlimited / Business Web Hosting (Cloud & VPS compatible) |

---

## Project Structure

```
EventoraX/
├── db/
│   └── db.js                 # MySQL connection pool, table migrations & in-memory fallback
├── middleware/
│   └── auth.js               # JWT auth & verification middleware
├── routes/
│   ├── activity.js           # Audit logs endpoints
│   ├── auth.js               # Login, register, profile endpoints
│   ├── billing.js            # Subscription tier endpoints
│   ├── contact.js            # Contact messages endpoints
│   ├── events.js             # Events CRUD & attendee endpoints
│   ├── stats.js              # KPI & analytics endpoints
│   └── team.js               # Team management endpoints
├── src/                      # React TypeScript Frontend
│   ├── components/           # UI components, Navbar, Footer, Modals
│   ├── context/              # AuthContext for session management
│   ├── pages/                # Landing, Login, Register, Dashboard (Home, Events, Team, Stats, etc.)
│   └── services/api.ts       # Unified API client
├── database.sql              # MySQL schema & sample seed data (for phpMyAdmin)
├── HOSTINGER_DEPLOYMENT_GUIDE.md # Step-by-step deployment guide for Hostinger
├── server.js                 # Express backend & static frontend server
└── package.json
```

---

## Getting Started Locally

### 1. Prerequisites
- Node.js (v18.x, v20.x, or v22+)
- MySQL Server (optional; in-memory fallback will automatically activate if MySQL is not detected)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/orbit-i/EventoraX.git
cd EventoraX

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=eventorax_jwt_super_secure_secret_key_2025

# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=eventorax_db
DB_PORT=3306
```

### 4. Database Setup (Optional)
If running MySQL locally or in phpMyAdmin:
- Create database `eventorax_db`
- Import `database.sql`
*(Note: If MySQL credentials are not provided or connection fails, the server will gracefully switch to its built-in in-memory database with pre-populated demo data).*

### 5. Running Development Server
```bash
# Run both Frontend & Backend concurrently
npm run dev

# Or run backend server:
node server.js
```

### 6. Default Demo Credentials
- **Email:** `admin@eventorax.com`
- **Password:** `admin123`
*(A 1-click auto-fill button is available on the login page)*

---

## Hostinger Unlimited / Business Deployment

For complete, detailed instructions on deploying to Hostinger (via hPanel Node.js Application Manager, Git Deployment, or File Manager), refer to [HOSTINGER_DEPLOYMENT_GUIDE.md](HOSTINGER_DEPLOYMENT_GUIDE.md).

### Quick Summary for Hostinger:
1. **Create Database in hPanel**: Create MySQL database and user in Hostinger **Databases -> Management**, and import `database.sql` in phpMyAdmin.
2. **Build Frontend**: Run `npm run build` to generate the `dist/` directory.
3. **Configure Node.js in hPanel**:
   - Application Root: `public_html` (or subdomain folder)
   - Application Startup File: `server.js`
   - Node.js Version: `20.x` or `22.x`
4. **Set Environment Variables**: Add `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `NODE_ENV=production` in hPanel or `.env`.
5. **Start Application**: Click **Restart Application** in hPanel.

---

## License

This project is licensed under the MIT License.
