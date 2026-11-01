import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { bookmarkRoutes } from './routes/bookmark.routes.js';
import { categoryRoutes } from './routes/category.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import type { AppEnv } from './types/index.js';

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  // Basic logging
  app.use('*', logger());

  // CORS configuration supporting local Vite, Android Capacitor and LAN IP
  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin) return '*';
        if (
          origin.startsWith('http://localhost') ||
          origin.startsWith('http://127.0.0.1') ||
          origin.startsWith('capacitor://localhost') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('http://10.') ||
          origin.startsWith('http://172.')
        ) {
          return origin;
        }
        return origin; // Permissive for prototype mobile access
      },
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      credentials: true
    })
  );

  // Error handling
  app.onError(errorHandler);

  // Mount routes
  app.route('/', healthRoutes);
  app.route('/api/auth', authRoutes);
  app.route('/api/bookmarks', bookmarkRoutes);
  app.route('/api', categoryRoutes);

  // 404 handler
  app.notFound(notFoundHandler);

  return app;
}
