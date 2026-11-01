import type { ErrorHandler, NotFoundHandler } from 'hono';
import { ZodError } from 'zod';
import { errorResponse } from '../utils/response.utils.js';

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return errorResponse(c, `Validation error: ${issues}`, 400, err.issues);
  }

  const message = err.message || 'Internal server error';
  const status = (err as any).status || 500;

  console.error('[Error Middleware]', err);

  return errorResponse(c, message, status >= 400 && status < 600 ? status : 500);
};

export const notFoundHandler: NotFoundHandler = (c) => {
  return errorResponse(c, `Not Found: ${c.req.method} ${c.req.path}`, 404);
};
