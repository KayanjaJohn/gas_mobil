import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Never print raw Error objects: database drivers and HTTP clients can attach
  // SQL parameters, connection URLs, request headers or credentials to them.
  const errorName = typeof err?.name === 'string' ? err.name : 'Error';
  const status = Number(err?.statusCode || err?.status || 500);
  console.error('[API Error]', {
    name: errorName,
    status: Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500,
    method: req.method,
    path: req.path,
  });

  if (errorName === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  if (errorName === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired' });
  }
  if (errorName === 'QueryFailedError') {
    return res.status(400).json({ success: false, error: 'Database query failed' });
  }
  if (errorName === 'EntityNotFoundError') {
    return res.status(404).json({ success: false, error: 'Resource not found' });
  }
  if (errorName === 'ValidationError') {
    return res.status(400).json({ success: false, error: 'Validation failed' });
  }

  const statusCode = Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : 'Something went wrong';

  return res.status(statusCode).json({ success: false, error: message });
};
