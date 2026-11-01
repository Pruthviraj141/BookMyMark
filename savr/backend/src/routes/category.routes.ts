import { Hono } from 'hono';
import { BookmarkService } from '../services/bookmark.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { successResponse } from '../utils/response.utils.js';
import type { AppEnv } from '../types/index.js';

export const categoryRoutes = new Hono<AppEnv>();

categoryRoutes.use('*', authMiddleware);

categoryRoutes.get('/categories', (c) => {
  const userId = c.get('userId');
  const categories = BookmarkService.getCategories(userId);
  return successResponse(c, categories);
});

categoryRoutes.get('/tags', (c) => {
  const userId = c.get('userId');
  const tags = BookmarkService.getTags(userId);
  return successResponse(c, tags);
});
