import { Response, Request, NextFunction } from 'express';
import { sendError } from '../utils/response';
import ApiError from '../utils/errors';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    sendError(res, err);
  }
  // TypeORM query errors (e.g., duplicate key, foreign key violation)
  else if (err instanceof QueryFailedError) {
    const code = (err as any).code;
    // MySQL error codes
    if (code === 'ER_DUP_ENTRY') {
      sendError(res, new ApiError(409, 'Duplicate entry - already exists', 'DUPLICATE_ENTRY'));
    } else if (code === 'ER_NO_REFERENCED_ROW' || code === 'ER_ROW_IS_REFERENCED') {
      sendError(res, new ApiError(400, 'Foreign key constraint violated', 'FK_CONSTRAINT'));
    } else if (code === 'ER_BAD_FIELD_ERROR') {
      sendError(res, new ApiError(400, 'Invalid field in query', 'INVALID_FIELD'));
    } else {
      sendError(res, new ApiError(400, err.message || 'Database query failed', 'QUERY_ERROR'));
    }
  }
  // TypeORM entity not found
  else if (err instanceof EntityNotFoundError) {
    sendError(res, new ApiError(404, 'Resource not found', 'NOT_FOUND'));
  }
  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    sendError(res, new ApiError(401, 'Invalid token', 'INVALID_TOKEN'));
  } else if (err.name === 'TokenExpiredError') {
    sendError(res, new ApiError(401, 'Token expired', 'TOKEN_EXPIRED'));
  }
  // Generic fallback
  else {
    sendError(res, new ApiError(500, err.message || 'Internal Server Error', 'INTERNAL_SERVER_ERROR'));
  }
};