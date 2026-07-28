import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { CONFIG } from './config.js';
import { initDatabase } from './database.js';
import authRoutes from './routes/auth.js';
import detectionRoutes from './routes/detection.js';
import predictionRoutes from './routes/predictions.js';
import reportRoutes from './routes/reports.js';
import adminRoutes from './routes/admin.js';
import healthRoutes from './routes/health.js';
import { ensureUploadDirs } from './services/storage.js';


const app = express();

app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cors({ origin: CONFIG.CORS_ORIGINS }));
app.use(rateLimit({ windowMs: CONFIG.RATE_LIMIT_WINDOW_MS, max: CONFIG.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false }));
app.use(morgan('combined'));

app.use('/api/auth', authRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);

// Serve frontend production build when available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', '..', 'dist');
const isVercel = Boolean(process.env.VERCEL);
const isRender = Boolean(process.env.RENDER || process.env.RENDER_INTERNAL_HOSTNAME);

if (!isVercel && !isRender) {
  if (fs.existsSync(distPath)) {
    console.log('Serving static files from', distPath, ' (dist exists)');
    app.use(express.static(distPath));
    // Serve HTML for any GET to support client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else if (process.env.NODE_ENV === 'production') {
    console.warn('Production mode but dist directory not found at', distPath);
  }
} else {
  // ensure directories exist in ephemeral temp storage on serverless platforms
  try {
    ensureUploadDirs();
  } catch (err) {
    console.warn('Could not ensure upload dirs on serverless runtime:', err.message || err);
  }
}

app.use((req, res) => {
  res.status(404).json({ success: false, status: 404, message: 'Endpoint not found', data: null });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, status: err.status || 500, message: err.message || 'Internal server error', data: null, errors: err.errors || null });
});

export default app;
