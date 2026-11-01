import { Hono } from 'hono';
import { successResponse } from '../utils/response.utils.js';

export const healthRoutes = new Hono();

healthRoutes.get('/health', (c) => {
  return successResponse(c, {
    status: 'ok',
    app: 'MyBookMark',
    timestamp: new Date().toISOString()
  }, 'MyBookMark API is healthy');
});
