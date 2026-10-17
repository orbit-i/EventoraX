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
import certificatesRoutes from './routes/certificates.js';
import caseStudiesRoutes from './routes/caseStudies.js';
import merchantGatewaysRoutes from './routes/merchantGateways.js';
import directoryEventsRoutes from './routes/directoryEvents.js';
import uploadRoutes from './routes/upload.js';
import { cacheService } from './services/cacheService.js';

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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static Media Uploads Directory Serving
const uploadsPath = path.join(__dirname, 'public', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Strict System Resource & Environment Key Protection (.env, .git, dumps, certificates, secrets)
const SENSITIVE_PATTERNS = [
  /\.env(\..+)?$/i,
  /\.git(\/.*)?$/i,
  /\.htaccess$/i,
  /local_store\.json$/i,
  /\.(bak|backup|sql|dump|sqlite|sqlite3|db)$/i,
  /\.(pem|key|crt|csr|p12|pfx)$/i,
  /(id_rsa|id_dsa|id_ecdsa|id_ed25519)(\..*)?$/i,
  /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/i,
  /web\.config$/i
];

app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(p)) {
      console.warn(`[Security Alert] Blocked unauthorized probe to sensitive resource: ${req.path} from IP: ${req.ip}`);
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access Denied: Protected System Resource'
      });
    }
  }
  next();
});

// Automatic Sensitive Key & Secret Sanitizer Middleware
// Recursively sanitizes JSON responses to prevent leakage of credentials, passwords, or master keys
function sanitizeSecrets(data, depth = 0) {
  if (!data || depth > 8) return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeSecrets(item, depth + 1));
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean = {};
    for (const [k, v] of Object.entries(data)) {
      const lower = k.toLowerCase();
      // Completely remove critical password hashes and internal database/JWT secrets
      if (lower === 'password' || lower === 'password_hash' || lower === 'db_password' || lower === 'jwt_secret') {
        continue;
      }
      // Mask master key
      if (lower === 'master_key') {
        clean[k] = typeof v === 'string' && v.length > 8 ? `${v.slice(0, 4)}****${v.slice(-4)}` : '[PROTECTED]';
        continue;
      }
      clean[k] = sanitizeSecrets(v, depth + 1);
    }
    return clean;
  }
  return data;
}

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    return originalJson(sanitizeSecrets(body));
  };
  next();
});

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
app.use('/api/upload', uploadRoutes);
app.use('/api/certificates/verify', verifyRateLimiter);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/dashboard/stats', statsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/billing', billingRoutes);

// Multi-Tenant SaaS Platform APIs
app.use('/api/tenants', tenantsRoutes);
app.use('/api/admin', platformAdminRoutes);
app.use('/api/case-studies', caseStudiesRoutes);
app.use('/api/merchant-gateways', merchantGatewaysRoutes);
app.use('/api/public/merchant-gateways', merchantGatewaysRoutes);
app.use('/api/directory-events', directoryEventsRoutes);
// Public CMS endpoint for official website content (Fast, free, cached for 300s)
app.get('/api/public/cms/:pageKey', cacheService.middleware({ ttl: 300, prefix: 'cms:' }), async (req, res) => {
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
// Public Testimonials endpoint for verified client reviews (Cached for 300s)
app.get('/api/public/testimonials', cacheService.middleware({ ttl: 300, prefix: 'testimonials:' }), async (req, res) => {
  try {
    const { query: dbQuery } = await import('./db/db.js');
    const [rows] = await dbQuery('SELECT * FROM `testimonials` WHERE `is_featured` = 1 ORDER BY `created_at` DESC');
    return res.json({ success: true, testimonials: rows || [] });
  } catch (err) {
    console.error('[Public Testimonials Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
  }
});

// Public Platform Team endpoint (ORBIT-I leadership & core platform team - Cached for 300s)
app.get('/api/public/platform-team', cacheService.middleware({ ttl: 300, prefix: 'platform_team:' }), async (req, res) => {
  try {
    const { query: dbQuery } = await import('./db/db.js');
    const [rows] = await dbQuery('SELECT * FROM `platform_team_members` WHERE `is_active` = 1 ORDER BY `display_order` ASC, `id` ASC');
    
    const officialBaseTeam = [
      {
        id: 1,
        name: 'Abdul Samad Rind',
        role: 'Full Stack Web Developer & Platform Architect',
        department: 'Leadership & Engineering',
        bio: 'Founder & Platform Architect at ORBIT-I Private Limited. Lead Full Stack Web Developer heading Eventrye core distributed multi-tenant engine, high-concurrency event registration pipelines, and tamper-evident credential verification.',
        display_order: 1,
        is_active: 1
      },
      {
        id: 2,
        name: 'Maria Almani',
        role: 'Full Stack Web Developer, SEO & Content Specialist',
        department: 'Product & Web Growth',
        bio: 'Full Stack Web Developer, SEO Strategist and Technical Content Specialist at ORBIT-I Private Limited. Leading fast-loading frontend architecture, organic search visibility, platform content strategy, and intuitive organizer UX.',
        display_order: 2,
        is_active: 1
      },
      {
        id: 3,
        name: 'Muhammad Muneeb Ur Rahman Shahzad',
        role: 'DevOps Engineer',
        department: 'DevOps & Systems Infrastructure',
        bio: 'DevOps & Systems Infrastructure Engineer at ORBIT-I Private Limited. Spearheading zero-downtime CI/CD deployment pipelines, Dockerized microservices, high-availability database clustering, and SBP-compliant server hardening.',
        display_order: 3,
        is_active: 1
      },
      {
        id: 4,
        name: 'Hassan Ansar',
        role: 'Web Developer',
        department: 'Web Development & Engineering',
        bio: 'Web Developer at ORBIT-I Private Limited. Specializing in modern web applications, performant user interfaces, responsive frontends, and dynamic event management workflows.',
        display_order: 4,
        is_active: 1
      },
      {
        id: 5,
        name: 'Chander Parakash',
        role: 'Backend Developer',
        department: 'Backend Engineering & Distributed Systems',
        bio: 'Backend Developer at ORBIT-I Private Limited. Specializing in high-concurrency Node.js microservices, database query optimization, Redis caching layers, and secure payment webhook pipelines for Eventrye.',
        display_order: 5,
        is_active: 1
      },
      {
        id: 6,
        name: 'Laiba',
        role: 'Backend Developer',
        department: 'Backend Engineering & Cloud Architecture',
        bio: 'Backend Developer at ORBIT-I Private Limited. Expert in RESTful API architecture, cryptographic ticket verification algorithms, automated batch processing, and scalable cloud database structures for Eventrye.',
        display_order: 6,
        is_active: 1
      }
    ];

    let finalTeam = Array.isArray(rows) && rows.length >= 6 ? rows : [...officialBaseTeam];
    
    // If rows has some members, merge them
    if (Array.isArray(rows) && rows.length > 0 && rows.length < 6) {
      const existingNames = new Set(rows.map(r => r.name.toLowerCase()));
      const missing = officialBaseTeam.filter(m => !existingNames.has(m.name.toLowerCase()));
      finalTeam = [...rows, ...missing];
      finalTeam.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    }

    return res.json({ success: true, team: finalTeam });
  } catch (err) {
    console.error('[Public Platform Team Error]:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch platform team' });
  }
});

// Health check endpoint (for Cloud, Docker, and Production monitoring)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Eventrye Enterprise Multi-Tenant SaaS / PaaS',
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
              <title>Eventrye Multi-Tenant Server</title>
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
                <h1>Eventrye Enterprise Server Live</h1>
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
  console.log(`🚀 Eventrye Multi-Tenant SaaS Platform on port ${PORT}`);
  console.log(`🌐 Platform URL: http://localhost:${PORT}`);
  console.log(`📁 Static Frontend Directory: ${distPath}`);
  console.log(`=======================================================`);

  // Initialize and connect to MySQL database
  await initDatabase();
});
