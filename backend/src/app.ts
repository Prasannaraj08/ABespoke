import express, { Request, Response } from 'express';
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
process.on('uncaughtException', (error: Error) => {
  console.error(JSON.stringify({
    level: 'FATAL',
    type: 'UNCAUGHT_EXCEPTION',
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  }));
});

process.on('unhandledRejection', (reason: any) => {
  console.error(JSON.stringify({
    level: 'FATAL',
    type: 'UNHANDLED_REJECTION',
    reason: reason?.message || String(reason),
    stack: reason?.stack,
    timestamp: new Date().toISOString()
  }));
});

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// ─── Security Headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Vite in dev
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

// ─── CORS ─────────────────────────────────────────────────────────────────
const allowedOrigins = isProduction
  ? ['https://clarafashionspot.vercel.app']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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

// ─── Static Uploads (local dev only — Vercel uses Cloudinary) ─────────────
if (!process.env.VERCEL) {
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
}

// ─── Database Connection & Migrations ─────────────────────────────────────
connectWithRetry()
  .then(() => runMigrations())
  .then(() => {
    console.log('Database initialized and migrations completed.');
  })
  .catch((error) => {
    console.error('Critical database initialization failure:', error);
    process.exit(1);
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
