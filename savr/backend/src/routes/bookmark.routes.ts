import { Hono } from 'hono';
import { BookmarkService } from '../services/bookmark.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  createBookmarkSchema,
  updateBookmarkSchema,
  listBookmarksQuerySchema
} from '../validators/bookmark.validator.js';
import { successResponse, errorResponse } from '../utils/response.utils.js';
import type { AppEnv } from '../types/index.js';

export const bookmarkRoutes = new Hono<AppEnv>();

// Enforce authentication for all bookmark endpoints
bookmarkRoutes.use('*', authMiddleware);

// GET /api/bookmarks/search?q=query
// Defined before :id to prevent path collision
bookmarkRoutes.get('/search', (c) => {
  const userId = c.get('userId');
  const q = c.req.query('q') || '';

  const results = BookmarkService.searchBookmarks(userId, q);
  return successResponse(c, { items: results, total: results.length });
});

// POST /api/bookmarks
bookmarkRoutes.post('/', async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const validated = createBookmarkSchema.parse(body);

    const { bookmark, isDuplicate } = await BookmarkService.createBookmark(userId, {
      url: validated.url || '',
      sharedText: validated.sharedText,
      title: validated.title,
      notes: validated.notes
    });

    const status = isDuplicate ? 200 : 201;
    const message = isDuplicate ? 'Bookmark already saved' : 'Bookmark created successfully';

    return successResponse(c, bookmark, message, status, isDuplicate);
  } catch (err: any) {
    if (err.name === 'ZodError') {
      const msg = err.issues.map((i: any) => i.message).join(', ');
      return errorResponse(c, msg, 400);
    }
    return errorResponse(c, err.message || 'Failed to save bookmark', 400);
  }
});

// GET /api/bookmarks
bookmarkRoutes.get('/', (c) => {
  try {
    const userId = c.get('userId');
    const query = listBookmarksQuerySchema.parse(c.req.query());

    const result = BookmarkService.listBookmarks({
      userId,
      page: query.page,
      limit: query.limit,
      platform: query.platform,
      category: query.category,
      tag: query.tag,
      content_type: query.content_type,
      ai_status: query.ai_status
    });

    return successResponse(c, result);
  } catch (err: any) {
    return errorResponse(c, err.message || 'Failed to list bookmarks', 400);
  }
});

// GET /api/bookmarks/:id
bookmarkRoutes.get('/:id', (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const bookmark = BookmarkService.getBookmark(id, userId);
  if (!bookmark) {
    return errorResponse(c, 'Bookmark not found', 404);
  }

  return successResponse(c, bookmark);
});

// PATCH /api/bookmarks/:id
bookmarkRoutes.patch('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = updateBookmarkSchema.parse(body);

    const updated = BookmarkService.updateBookmark(id, userId, validated);
    if (!updated) {
      return errorResponse(c, 'Bookmark not found or unauthorized', 404);
    }

    return successResponse(c, updated, 'Bookmark updated successfully');
  } catch (err: any) {
    if (err.name === 'ZodError') {
      const msg = err.issues.map((i: any) => i.message).join(', ');
      return errorResponse(c, msg, 400);
    }
    return errorResponse(c, err.message || 'Failed to update bookmark', 400);
  }
});

// DELETE /api/bookmarks/:id
bookmarkRoutes.delete('/:id', (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const deleted = BookmarkService.deleteBookmark(id, userId);
  if (!deleted) {
    return errorResponse(c, 'Bookmark not found or unauthorized', 404);
  }

  return successResponse(c, null, 'Bookmark deleted successfully');
});

// POST /api/bookmarks/:id/reprocess
bookmarkRoutes.post('/:id/reprocess', (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const reprocessed = BookmarkService.reprocessBookmark(id, userId);
  if (!reprocessed) {
    return errorResponse(c, 'Bookmark not found or unauthorized', 404);
  }

  return successResponse(c, reprocessed, 'Reprocessing queued');
});
