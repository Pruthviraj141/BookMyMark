import type { Context, Next } from 'hono';
import { AuthService } from '../services/auth.service.js';
import { errorResponse } from '../utils/response.utils.js';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(c, 'Authorization bearer token is required', 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return errorResponse(c, 'Authorization token cannot be empty', 401);
  }

  const payload = await AuthService.verifyToken(token);
  if (!payload || !payload.sub) {
    return errorResponse(c, 'Invalid or expired authentication token', 401);
  }

  c.set('userId', payload.sub);
  c.set('username', payload.username);

  await next();
}
