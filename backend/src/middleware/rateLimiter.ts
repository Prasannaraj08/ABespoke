import rateLimit from 'express-rate-limit';

/** Global limit: 200 requests per 15 minutes per IP */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.', errorCode: 4290 },
  skip: (req) => req.path === '/health' || req.path === '/api/health',
});

/** Strict limit for auth endpoints: 10 requests per 15 minutes per IP */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.', errorCode: 4290 },
});

/** Upload limit: 30 uploads per hour per IP */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached. Please try again later.', errorCode: 4290 },
});
