import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { formatErrorResponse } from '../utils/errors';

// Fail fast if JWT_SECRET is not set — never fall back to a hardcoded string in production
const JWT_SECRET = process.env.JWT_SECRET?.trim();
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}
const SECRET = JWT_SECRET || 'dev_only_secret_change_in_production';

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

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return formatErrorResponse(res, 401, 4012, 'Session expired. Please log in again.', requestId);
      }
      return formatErrorResponse(res, 401, 4013, 'Invalid or corrupted token', requestId);
    }
    req.user = decoded as { id: string; email: string; role: 'user' | 'boutique' | 'designer' | 'admin' };
    next();
  });
}

export function optionalAuthenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies['clara_access_token'] || cookies['clara_luxe_token'];
  }

  if (!token) return next();

  jwt.verify(token, SECRET, (err, decoded) => {
    if (!err) {
      req.user = decoded as { id: string; email: string; role: 'user' | 'boutique' | 'designer' | 'admin' };
    }
    next();
  });
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

export const JWT_SECRET_KEY = SECRET;
