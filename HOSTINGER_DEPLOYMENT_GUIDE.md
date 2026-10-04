# 🚀 EventoraX - Hostinger Unlimited / Business Plan Deployment Guide

This guide provides step-by-step instructions for deploying **EventoraX** to **Hostinger Unlimited / Business Web Hosting** running **Node.js + MySQL**.

---

## 📋 System Overview & Architecture

- **Backend:** Node.js (v18+ or v20+) + Express (ES Modules)
- **Database:** MySQL / MariaDB (via `mysql2/promise` with auto-migration and fallback)
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons
- **Application Startup File:** `server.js`
- **Build Directory:** `dist/` (Auto-served with SPA client fallback by `server.js`)
- **API Base:** `/api/...`

---

## 🛠️ Step 1: Create MySQL Database on Hostinger

1. Log in to your **Hostinger hPanel**.
2. Go to **Databases** ➔ **MySQL Databases**.
3. Create a new MySQL database:
   - **Database Name:** e.g. `u123456789_eventorax`
   - **Username:** e.g. `u123456789_admin`
   - **Password:** Choose a strong password and save it.
4. Click **Create**.
5. Note down:
   - Database Name
   - Username
   - Password
   - Host: **`localhost`** (On Hostinger, MySQL host is always `localhost`).

---

## 🗄️ Step 2: Import Database Schema (phpMyAdmin)

> **Note:** EventoraX has **built-in auto-migration** that automatically creates all tables and seeds the admin user on server start. However, you can also import manually via phpMyAdmin:

1. In Hostinger hPanel under **Databases**, find your database and click **Enter phpMyAdmin**.
2. Click on your database name in the left panel.
3. Click the **Import** tab at the top.
4. Choose the file **`database.sql`** from this project repository.
5. Click **Import** (or **Go**).
6. All 7 tables (`users`, `events`, `event_attendees`, `team_members`, `activity_logs`, `contact_messages`, `subscriptions`) with indexes and default seed data will be created!

---

## ⚙️ Step 3: Setup Node.js Application in Hostinger hPanel

1. In Hostinger hPanel, go to **Websites** ➔ click **Manage** next to your domain.
2. In the search box or sidebar, search for **Node.js**.
3. Click **Create Application** (or configure existing):
   - **Node.js Version:** Select `20.x` (or `18.x`)
   - **Application Mode:** `Production`
   - **Application Root:** `/` (or your domain folder)
   - **Application Startup File:** `server.js`
4. Click **Save** / **Create**.

---

## 🔐 Step 4: Configure Environment Variables (`.env`)

In Hostinger File Manager (or in the Node.js environment section in hPanel), create or edit the `.env` file in the root folder of EventoraX:

```env
# ==============================================================
# EventoraX Production Environment - Hostinger
# ==============================================================

PORT=5000
NODE_ENV=production

# Hostinger MySQL Database Settings
DB_HOST=localhost
DB_PORT=3306
DB_USER=u123456789_admin
DB_PASSWORD=your_actual_hostinger_db_password
DB_NAME=u123456789_eventorax

# Security & JWT
JWT_SECRET=eventorax_ultra_secure_jwt_token_key_2025_hostinger
```

---

## 📦 Step 5: Install Dependencies & Build Frontend

You can do this via Hostinger SSH/Terminal or through the hPanel Node.js interface:

1. Open **SSH / Terminal** in Hostinger hPanel (or connect via PuTTY / Terminal).
2. Navigate to your project folder:
   ```bash
   cd public_html
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the production React frontend:
   ```bash
   npm run build
   ```
5. Start or restart your Node.js application:
   - Click **Restart Application** in the Hostinger Node.js panel, or run:
     ```bash
     npm start
     ```

---

## 🔑 Default Admin Account Credentials

You can log in right away with the pre-seeded organizer account:

- **Login URL:** `https://yourdomain.com/login`
- **Email:** `admin@eventorax.com`
- **Password:** `admin123`

*(You can change your password and profile anytime from **Dashboard** ➔ **Settings**).*

---

## 🌟 Features Implemented & Working in EventoraX

1. **Authentication System:**
   - Real registration (`/register`) with automatic 14-day trial initialization.
   - Real login (`/login`) with bcrypt password hashing and JWT token storage.
   - Demo credentials 1-click auto-fill button.
   - Dynamic Navbar displaying logged-in user profile, avatar, and logout.

2. **Dashboard & Events Management:**
   - **Overview:** Live KPI cards (Total Events, Total Attendees, Revenue, Active Events), recent events, and live audit feed.
   - **Events (`/dashboard/events`):** Full CRUD — Create events, edit events, delete events, search and filter by category/status, view real-time attendee counts.
   - **Attendees & Digital Ticketing:** View registered attendees, ticket codes, and register walk-in attendees on the fly.
   - **Statistics (`/dashboard/statistics`):** Live fill rates, conversion metrics, and growth charts.
   - **Charts (`/dashboard/charts`):** Weekly registration curves and category distributions.
   - **Team Management (`/dashboard/team`):** Live member roster, role badges, and working "Invite Member" modal.
   - **Billing & Subscriptions (`/dashboard/billing`):** Interactive subscription upgrading and capacity monitoring.
   - **Settings (`/dashboard/settings`):** Live profile updates, password modification, and preference toggles.
   - **Activity Logs (`/dashboard/activity`):** Audit trail of all actions with category filters.

3. **Public Features:**
   - **Contact Form (`/contact`):** Real submissions stored in the MySQL database.
   - **Landing Page, Features, Pricing, About, Terms, Privacy:** Responsive, modern design with animations.

---

## 🛡️ Errors & Mismatches Resolved

- ✅ **Fixed Router Mismatch:** Removed fragmented `react-router` vs `react-router-dom` imports; unified completely on `react-router-dom` with `BrowserRouter`.
- ✅ **Fixed Protected Routes:** Wrapped dashboard routes with active `ProtectedRoute` guard.
- ✅ **Fixed Next.js Artifacts:** Removed `next/navigation` and `next/link` imports left over from previous templates in sidebar components.
- ✅ **Fixed Express 5 Route Matching:** Fixed `path-to-regexp` catch-all route to prevent 500 errors on Express 5.
- ✅ **Optimized Vite Bundler:** Configured chunk splitting for React, Recharts, and Three.js, reducing build time to ~30 seconds.
- ✅ **Dual-mode Database Engine:** Automatic MySQL pool connection with resilient fallback to prevent server crash loops on host reboots.
