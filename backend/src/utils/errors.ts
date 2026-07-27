import { Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, errorCode = 5000, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed for request data', errorCode = 4001) {
    super(message, 400, errorCode);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication token required or invalid', errorCode = 4011) {
    super(message, 401, errorCode);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied: Insufficient permissions', errorCode = 4030) {
    super(message, 403, errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource not found', errorCode = 4040) {
    super(message, 404, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', errorCode = 4090) {
    super(message, 409, errorCode);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', errorCode = 4290) {
    super(message, 429, errorCode);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', errorCode = 5001) {
    super(message, 500, errorCode);
  }
}

export function formatErrorResponse(
  res: Response,
  statusCode: number,
  errorCode: number,
  message: string,
  requestId = 'N/A'
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      requestId,
      timestamp: new Date().toISOString()
    }
  });
}
