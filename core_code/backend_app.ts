import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import apiRouter from './routes/api';
import sequelize, { connectWithRetry } from './db/database';
import { runMigrations } from './db/migrate';
import db from './db/dbStore';

// Load Environment Variables
dotenv.config();

const app = express();

// Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Request Compression
app.use(compression());

// Logger
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// Dynamic CORS Configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://clarafashionspot.vercel.app']
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or serverless functions)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Body Parsing
app.use(express.json({ limit: '10mb' })); // Limit body sizes to prevent crash
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests max per window
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Serve Static Uploads (local dev only — Vercel uses Cloudinary)
if (!process.env.VERCEL) {
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));
}

// Database Connection, Migration & Cache Loading on Startup
connectWithRetry()
  .then(() => {
    return runMigrations();
  })
  .then(() => {
    return db.loadFromDatabase();
  })
  .then(() => {
    console.log('Database store and cache initialized successfully.');
  })
  .catch((error) => {
    console.error('Critical database initialization failure:', error);
    process.exit(1);
  });

// Apply rate limiter to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Register API Routes
app.use('/api', apiRouter);

// Basic Ping/Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected server error occurred',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

export default app;
