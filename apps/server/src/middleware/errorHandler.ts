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

  console.error('Unhandled Server Error:', err);

  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';

  return res.status(500).json({
    success: false,
    error: message,
  });
};
