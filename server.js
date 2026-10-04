import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, isDbConnected } from './db/db.js';

import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import statsRoutes from './routes/stats.js';
import teamRoutes from './routes/team.js';
import activityRoutes from './routes/activity.js';
import contactRoutes from './routes/contact.js';
import billingRoutes from './routes/billing.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/dashboard/stats', statsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/billing', billingRoutes);

// Health check endpoint (for Hostinger monitoring)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'EventoraX',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    databaseConnected: isDbConnected(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Serve frontend static files in production / when dist exists
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Single Page Application (SPA) catch-all route:
// Ensures refreshing on routes like /dashboard or /login works without 404
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>EventoraX Server</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px; background: #faf8ff; color: #0f172a; }
                .card { background: white; border: 1px solid #e9e4ff; border-radius: 16px; padding: 32px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.1); }
                h1 { color: #7c3aed; margin-bottom: 8px; }
                p { color: #475569; font-size: 15px; }
                code { background: #f3f0ff; color: #7c3aed; padding: 3px 8px; border-radius: 6px; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>EventoraX Server Running</h1>
                <p>Node.js & MySQL backend is live!</p>
                <p>Please build the frontend by running: <code>npm run build</code></p>
                <p>Database Status: <strong>${isDbConnected() ? 'Connected' : 'Connecting/Offline'}</strong></p>
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
  console.log(`===============================================`);
  console.log(`🚀 EventoraX Production Server Running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`📁 Static Files Directory: ${distPath}`);
  console.log(`===============================================`);

  // Initialize and connect to MySQL database
  await initDatabase();
});
