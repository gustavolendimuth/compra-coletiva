import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      status: 'error',
      message: 'Database operation failed',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }

  // Prisma initialization errors
  if (err.name === 'PrismaClientInitializationError') {
    return res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid database query',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }

  // Default error
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
