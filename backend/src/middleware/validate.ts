import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { formatErrorResponse } from '../utils/errors';

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body === undefined || req.body === null) {
        const requestId = (req as any).requestId || 'N/A';
        return formatErrorResponse(res, 400, 4000, 'Request payload body cannot be null or undefined', requestId);
      }
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const requestId = (req as any).requestId || 'N/A';
        const formatted = error.issues.map((err: any) => {
          const field = err.path.join('.');
          return field ? `${field}: ${err.message}` : err.message;
        }).join(' · ');

        return formatErrorResponse(
          res,
          400,
          4001,
          `Validation failed: ${formatted}`,
          requestId
        );
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = (await schema.parseAsync(req.query)) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const requestId = (req as any).requestId || 'N/A';
        const formatted = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(' · ');
        return formatErrorResponse(res, 400, 4001, `Invalid query parameters: ${formatted}`, requestId);
      }
      next(error);
    }
  };
};

export default validateBody;
