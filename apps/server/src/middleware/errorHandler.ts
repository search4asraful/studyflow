import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  console.error('[Unhandled Server Error]:', err);

  // Do not expose unhandled database errors or stacks to clients
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};
