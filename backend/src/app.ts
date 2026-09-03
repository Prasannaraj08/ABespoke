import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import apiRouter from './routes/api';
import sequelize, { connectWithRetry } from './db/database';
import { runMigrations } from './db/migrate';
import { globalLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

// ─── Process Level Unhandled Rejection & Uncaught Exception Handlers ──────
// Issue 4 Fix: Log error and exit process cleanly so process manager/Vercel can restart a clean process instance
process.on('uncaughtException', (error: Error) => {
  console.error(JSON.stringify({
    level: 'FATAL',
    type: 'UNCAUGHT_EXCEPTION',
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  }));
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  console.error(JSON.stringify({
    level: 'FATAL',
    type: 'UNHANDLED_REJECTION',
    reason: reason?.message || String(reason),
    stack: reason?.stack,
    timestamp: new Date().toISOString()
  }));
  process.exit(1);
});

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ─── Security Headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://images.unsplash.com'],
      connectSrc: ["'self'", 'https://api.cloudinary.com'],
    },
  },
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

// ─── Compression ───────────────────────────────────────────────────────────
app.use(compression());

// ─── Request Logger ────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── HTTP Logger (dev only) ────────────────────────────────────────────────
if (!isProduction) {
  app.use(morgan('dev'));
}

// ─── CORS (Strict Whitelist - CWE-346 Fix) ─────────────────────────────────
const trustedOrigins = new Set([
  'https://abespokefashionspot.vercel.app',
  'https://clarafashionspot.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []),
  ...(!isProduction ? ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'] : [])
]);

// Helper to validate trusted Vercel preview deployments for this project only
function isAuthorizedOrigin(origin: string): boolean {
  if (trustedOrigins.has(origin)) return true;
  // Match only official Vercel preview deployments belonging to tprraj2k8-8535s-projects
  if (origin.startsWith('https://clarafashionspot-') && origin.endsWith('-tprraj2k8-8535s-projects.vercel.app')) {
    return true;
  }
  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or non-browser tools (no origin header)
    if (!origin) {
      return callback(null, true);
    }
    if (isAuthorizedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: Origin is not trusted.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ─── Global Rate Limiter ───────────────────────────────────────────────────
app.use('/api', globalLimiter);

// ─── Static Uploads (local dev only) ──────────────────────────────────────
if (!process.env.VERCEL) {
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
}

// ─── DB Connection & Migration Initialization Promise ─
let dbInitPromise: Promise<void> | null = null;

function ensureDbConnected(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = connectWithRetry()
      .then(() => runMigrations())
      .then(async () => {
        console.log('Database initialized and migrations completed.');
        // Production safety: Auto-seeding requires explicit ALLOW_AUTO_SEED=true env flag
        if (process.env.ALLOW_AUTO_SEED === 'true') {
          const { User: UserModel } = await import('./db/models.js');
          const { seedDatabase } = await import('./db/seed.js');
          const count = await UserModel.count();
          if (count === 0) {
            console.log('ALLOW_AUTO_SEED=true detected on empty DB. Seeding initial accounts...');
            await seedDatabase();
          }
        }
      })
      .catch((error) => {
        console.error('Critical database initialization failure:', error);
        dbInitPromise = null;
        throw error;
      });
  }
  return dbInitPromise;
}

// Middleware ensuring DB connection and migrations complete before handling incoming requests
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/api/health') return next();
  try {
    await ensureDbConnected();
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Enhanced Diagnostics & Health Endpoint ───────────────────────────────
app.get(['/health', '/api/health'], async (req: Request, res: Response) => {
  let dbStatus = 'HEALTHY';
  try {
    await sequelize.authenticate();
  } catch {
    dbStatus = 'UNHEALTHY';
  }

  const memory = process.memoryUsage();
  const memoryMB = {
    rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
  };

  res.status(dbStatus === 'HEALTHY' ? 200 : 503).json({
    status: dbStatus === 'HEALTHY' ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      dialect: sequelize.getDialect(),
    },
    system: {
      memoryMB,
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── 404 Route Not Found Handler ──────────────────────────────────────────
app.use(notFoundHandler);

// ─── Centralized Global Error Handler Middleware ──────────────────────────
app.use(globalErrorHandler);

export default app;
