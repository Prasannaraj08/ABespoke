import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/** Paths to skip logging (health checks, etc.) */
const SKIP_PATHS = new Set(['/health', '/api/health']);

/** Headers/body keys that must never be logged */
const REDACTED = new Set(['password', 'passwordHash', 'authorization', 'cookie', 'token', 'secret']);

function redactSensitive(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = REDACTED.has(k.toLowerCase()) ? '[REDACTED]' : v;
  }
  return out;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (SKIP_PATHS.has(req.path)) return next();

  const requestId = randomUUID();
  const start = Date.now();

  // Attach request ID to response headers for tracing
  res.setHeader('X-Request-Id', requestId);
  (req as any).requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';

    const log = {
      level,
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    if (level === 'ERROR') {
      console.error(JSON.stringify(log));
    } else if (level === 'WARN') {
      console.warn(JSON.stringify(log));
    } else {
      console.log(JSON.stringify(log));
    }
  });

  next();
}
