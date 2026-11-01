import { Hono } from 'hono';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../utils/response.utils.js';
import type { AppEnv } from '../types/index.js';

export const authRoutes = new Hono<AppEnv>();

// POST /api/auth/register
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const validated = registerSchema.parse(body);
    const result = await AuthService.register(validated);

    return successResponse(c, result, 'User registered successfully', 201);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      const msg = err.issues.map((i: any) => i.message).join(', ');
      return errorResponse(c, msg, 400);
    }
    return errorResponse(c, err.message || 'Registration failed', 400);
  }
});

// POST /api/auth/login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const validated = loginSchema.parse(body);
    const result = await AuthService.login(validated);

    return successResponse(c, result, 'Login successful');
  } catch (err: any) {
    if (err.name === 'ZodError') {
      const msg = err.issues.map((i: any) => i.message).join(', ');
      return errorResponse(c, msg, 400);
    }
    return errorResponse(c, err.message || 'Login failed', 401);
  }
});

// GET /api/auth/me
authRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = await AuthService.getUser(userId);

  if (!user) {
    return errorResponse(c, 'User not found', 404);
  }

  return successResponse(c, { user });
});

// POST /api/auth/logout
authRoutes.post('/logout', (c) => {
  return successResponse(c, null, 'Logged out successfully');
});
