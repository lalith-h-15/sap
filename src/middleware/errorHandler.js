import { ZodError } from 'zod';

export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
  }
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal server error' : error.message,
    ...(error.details ? { details: error.details } : {})
  });
}
