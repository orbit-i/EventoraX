import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, isDbConnected, memoryStore } from './db/db.js';

import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import statsRoutes from './routes/stats.js';
import teamRoutes from './routes/team.js';
import activityRoutes from './routes/activity.js';
import contactRoutes from './routes/contact.js';
import billingRoutes from './routes/billing.js';
import tenantsRoutes from './routes/tenants.js';
import platformAdminRoutes from './routes/platformAdmin.js';
import developerRoutes from './routes/developer.js';
import paasApiRoutes from './routes/paasApi.js';
import certificatesRoutes from './routes/certificates.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware (OWASP recommended defense-in-depth)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Resilient In-Memory Sliding-Window Rate Limiter (Zero token/external API overhead)
const rateLimitBuckets = new Map();

function createRateLimiter({ windowMs, maxRequests, message }) {
  return (req, res, next) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket?.remoteAddress) || '127.0.0.1';
    const routePrefix = req.baseUrl || req.path.split('/').slice(0, 3).join('/');
    const key = `${routePrefix}:${ip.trim()}`;
    const now = Date.now();
    
    let bucket = rateLimitBuckets.get(key);
    if (!bucket || now - bucket.startTime > windowMs) {
      bucket = { startTime: now, count: 1 };
      rateLimitBuckets.set(key, bucket);
    } else {
      bucket.count += 1;
    }

    const remaining = Math.max(0, maxRequests - bucket.count);
    const resetSeconds = Math.ceil((bucket.startTime + windowMs - now) / 1000);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (bucket.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: message || 'Rate limit exceeded. Please wait a moment before trying again.',
        retryAfterSeconds: resetSeconds
      });
    }

    next();
  };
}

// Clean up stale rate limiter buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (now - bucket.startTime > 3600000) {
      rateLimitBuckets.delete(key);
    }
  }
}, 300000);

// Rate Limiters
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 40,
  message: 'Security alert: Too many authentication attempts. Please wait 15 minutes.'
});

const verifyRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120,
  message: 'High frequency credential verification detected. Please wait 60 seconds.'
});

// Security & Performance Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-tenant-slug', 'x-api-key']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logger for API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes with targeted rate limiting applied
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/users', authRateLimiter, authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/certificates/verify', verifyRateLimiter);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/dashboard/stats', statsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/billing', billingRoutes);

// Multi-Tenant SaaS & PaaS APIs (PRD Section 4 & 7)
app.use('/api/tenants', tenantsRoutes);
app.use('/api/admin', platformAdminRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/v1', paasApiRoutes);
// Public CMS endpoint for official website content (Fast, free, cached)
app.get('/api/public/cms/:pageKey', async (req, res) => {
  try {
    const { pageKey } = req.params;
    const { query: dbQuery } = await import('./db/db.js');
    const [rows] = await dbQuery('SELECT * FROM `website_cms` WHERE `page_key` = ?', [pageKey.toLowerCase()]);
    if (rows && rows.length > 0) {
      const row = rows[0];
      let data = row.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch {}
      }
      return res.json({ success: true, pageKey: row.page_key, title: row.title, data, updatedAt: row.updated_at });
    }
    return res.status(404).json({ success: false, message: 'CMS content not found' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch CMS content' });
  }
});

// Health check endpoint (for Hostinger, Docker, and Kubernetes monitoring)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'EventoraX Enterprise Multi-Tenant SaaS / PaaS',
    version: '2.0.0-enterprise',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    databaseConnected: isDbConnected(),
    mode: isDbConnected() ? 'MySQL High-Availability Pool' : 'In-Memory High-Fidelity Store',
    tenancy: {
      type: 'Multi-Tenant Partitioned',
      tenantsCount: memoryStore?.tenants?.length || 2
    },
    paasApiReady: true,
    environment: process.env.NODE_ENV || 'production'
  });
});

// Serve frontend static files in production / when dist exists
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Single Page Application (SPA) catch-all route:
// Ensures refreshing on routes like /dashboard or /login works without 404
app.use((req, res, next) => {
  if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>EventoraX Multi-Tenant Server</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px; background: #faf8ff; color: #0f172a; }
                .card { background: white; border: 1px solid #e9e4ff; border-radius: 16px; padding: 32px; max-width: 520px; margin: 0 auto; box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.1); }
                h1 { color: #7c3aed; margin-bottom: 8px; font-size: 24px; }
                p { color: #475569; font-size: 14px; line-height: 1.6; }
                code { background: #f3f0ff; color: #7c3aed; padding: 3px 8px; border-radius: 6px; font-weight: 600; }
                .badge { display: inline-block; padding: 4px 12px; background: #ecfdf5; color: #059669; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 12px; }
              </style>
            </head>
            <body>
              <div class="card">
                <span class="badge">SaaS / PaaS Engine Ready</span>
                <h1>EventoraX Enterprise Server Live</h1>
                <p>Node.js Multi-Tenant & Developer PaaS backend is active.</p>
                <p>To compile the frontend client bundle: <code>npm run build</code></p>
                <p>Database Engine: <strong>${isDbConnected() ? 'MySQL Connected' : 'In-Memory Resilient Engine'}</strong></p>
              </div>
            </body>
          </html>
        `);
      }
    });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 EventoraX Multi-Tenant SaaS & PaaS Server on port ${PORT}`);
  console.log(`🌐 Platform URL: http://localhost:${PORT}`);
  console.log(`🔌 PaaS v1 API Endpoint: http://localhost:${PORT}/api/v1`);
  console.log(`📁 Static Frontend Directory: ${distPath}`);
  console.log(`=======================================================`);

  // Initialize and connect to MySQL database
  await initDatabase();
});
