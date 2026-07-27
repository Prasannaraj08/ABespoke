import { Response } from 'express';

/** Standardised API response helpers */
export const ApiResponse = {
  success(res: Response, data: any, status = 200) {
    return res.status(status).json({ success: true, data });
  },

  created(res: Response, data: any) {
    return res.status(201).json({ success: true, data });
  },

  error(res: Response, message: string, errorCode: number, status = 400, requestId = 'N/A') {
    return res.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        requestId,
        timestamp: new Date().toISOString()
      }
    });
  },

  paginated(
    res: Response,
    rows: any[],
    count: number,
    page: number,
    limit: number
  ) {
    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasMore: page * limit < count,
      },
    });
  },
};

/** Standard error codes */
export const ErrorCode = {
  // 4xx
  BAD_REQUEST: 4000,
  VALIDATION_FAILED: 4001,
  INVALID_CREDENTIALS: 4010,
  TOKEN_REQUIRED: 4011,
  TOKEN_EXPIRED: 4012,
  TOKEN_INVALID: 4013,
  FORBIDDEN: 4030,
  NOT_FOUND: 4040,
  CONFLICT: 4090,
  RATE_LIMITED: 4290,
  // 5xx
  SERVER_ERROR: 5000,
  DB_ERROR: 5001,
} as const;
