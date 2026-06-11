import { Response } from 'express';
import { ApiResponse } from '../types/response';
import ApiError from './errors';

export const sendSuccess = <T>(res: Response, data: T, statusCode: number = 200, message?: string) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date(),
  };
  res.status(statusCode).json(response);
};

export const sendError = (res: Response, error: ApiError | Error) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date(),
    });
  } else {
    res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date(),
    });
  }
};
