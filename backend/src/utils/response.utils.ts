import type { Context } from 'hono';
import type { ApiResponse } from '../types/index.js';

export function successResponse<T>(
  c: Context,
  data?: T,
  message?: string,
  status: 200 | 201 = 200,
  is_duplicate: boolean = false
) {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message !== undefined && { message }),
    ...(is_duplicate && { is_duplicate: true })
  };
  return c.json(response, status as any);
}

export function errorResponse(
  c: Context,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 500 = 400,
  details?: any
) {
  const response: ApiResponse = {
    success: false,
    error: message,
    ...(details !== undefined && { data: details })
  };
  return c.json(response, status as any);
}
