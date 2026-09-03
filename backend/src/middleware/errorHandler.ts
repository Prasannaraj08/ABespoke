import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse } from '../utils/errors';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

/**
 * Global Express Error Handler Middleware.
 * Catches all thrown exceptions & unhandled rejections, converts them into standard
 * JSON error responses, and prevents raw stack traces or 500 HTML dumps.
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  const requestId = (req as any).requestId || 'N/A';
  let statusCode = err.statusCode || err.status || 500;
  let errorCode = err.errorCode || 5000;
  let message = err.message || 'An unexpected error occurred';

  // Specific Error Category Handlers
  if (err.message && (err.message.includes('CORS') || err.message.includes('Not allowed by CORS'))) {
    statusCode = 403;
    errorCode = 4030;
    message = 'Cross-Origin Request Blocked. Access from this domain is not permitted.';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    errorCode = 4090;
    message = 'A record with this identifier or unique attribute already exists.';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    errorCode = 4001;
    message = err.errors?.map((e: any) => e.message).join(' · ') || 'Database validation failed.';
  } else if (err.name === 'SequelizeConnectionRefusedError' || err.name === 'SequelizeConnectionError' || err.name === 'SequelizeHostNotFoundError') {
    statusCode = 503;
    errorCode = 5001;
    message = 'Database service is temporarily unavailable. Please try again shortly.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 4013;
    message = 'Authentication token invalid or corrupted.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 4012;
    message = 'Authentication session expired. Please log in again.';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    errorCode = 4000;
    message = 'Malformed JSON payload received in request body.';
  }

  // Operational errors (e.g. AppError, RateLimitError, AuthError) retain human-readable messages in production
  if (statusCode >= 500 && isProduction && !(err instanceof AppError)) {
    message = 'Service temporarily unavailable. Our engineering team has been notified.';
  }

  // Server-side structured error logging
  console.error(JSON.stringify({
    level: 'ERROR',
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  }));

  return formatErrorResponse(res, statusCode, errorCode, message, requestId);
}

/**
 * Handle 404 Route Not Found
 */
export function notFoundHandler(req: Request, res: Response) {
  const requestId = (req as any).requestId || 'N/A';
  return formatErrorResponse(
    res,
    404,
    4040,
    `Route ${req.method} ${req.path} not found on this server`,
    requestId
  );
}
