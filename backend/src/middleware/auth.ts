import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { formatErrorResponse, AppError } from '../utils/errors';

/**
 * Dynamically resolves JWT secret from environment variables.
 * In production, JWT_SECRET MUST be set in environment variables.
 * Never uses a hardcoded fallback secret in production.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  if (!secret || secret === 'dev_only_secret_change_in_production') {
    if (isProduction) {
      console.error(JSON.stringify({
        level: 'FATAL',
        event: 'AUTH_CONFIG_ERROR',
        message: 'JWT_SECRET environment variable is missing or insecure in production environment.',
        timestamp: new Date().toISOString()
      }));
      throw new AppError('Authentication service is misconfigured. Please contact system administrator.', 500, 5000, true);
    }
    // Development mode only: permissive fallback for local developer testing
    return 'dev_only_secret_change_in_production';
  }
  return secret;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'boutique' | 'designer' | 'admin';
  };
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    const value = decodeURIComponent(parts.join('='));
    if (name) list[name] = value;
  });
  return list;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId || 'N/A';
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies['clara_access_token'] || cookies['clara_luxe_token'];
  }

  if (!token) {
    return formatErrorResponse(res, 401, 4011, 'Authentication token required', requestId);
  }

  try {
    const secret = getJwtSecret();
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return formatErrorResponse(res, 401, 4012, 'Session expired. Please log in again.', requestId);
        }
        return formatErrorResponse(res, 401, 4013, 'Invalid or corrupted token', requestId);
      }
      req.user = decoded as { id: string; email: string; role: 'user' | 'boutique' | 'designer' | 'admin' };
      next();
    });
  } catch (err: any) {
    next(err);
  }
}

export function optionalAuthenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies['clara_access_token'] || cookies['clara_luxe_token'];
  }

  if (!token) return next();

  try {
    const secret = getJwtSecret();
    jwt.verify(token, secret, (err, decoded) => {
      if (!err) {
        req.user = decoded as { id: string; email: string; role: 'user' | 'boutique' | 'designer' | 'admin' };
      }
      next();
    });
  } catch {
    next();
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId || 'N/A';
  if (!req.user || req.user.role !== 'admin') {
    return formatErrorResponse(res, 403, 4030, 'Access denied: Admin permissions required', requestId);
  }
  next();
}

export function requireBoutique(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId || 'N/A';
  if (!req.user || (req.user.role !== 'boutique' && req.user.role !== 'admin')) {
    return formatErrorResponse(res, 403, 4030, 'Access denied: Boutique role required', requestId);
  }
  next();
}

export function requireDesigner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId || 'N/A';
  if (!req.user || (req.user.role !== 'designer' && req.user.role !== 'admin')) {
    return formatErrorResponse(res, 403, 4030, 'Access denied: Designer role required', requestId);
  }
  next();
}
