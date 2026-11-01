import { getApiBaseUrl } from '../config/api.config.js';
import type { Bookmark, ApiResponse, User, CategoryCount, TagCount } from '../types/index.js';

class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('mybookmark_auth_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('mybookmark_auth_token', token);
  } else {
    localStorage.removeItem('mybookmark_auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (err: any) {
    throw new ApiError(
      `Unable to connect to backend at ${baseUrl}. Ensure backend is running and reachable on Wi-Fi.`,
      0
    );
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(`Unexpected response from server (HTTP ${response.status})`, response.status);
  }

  if (!response.ok || !json.success) {
    throw new ApiError(json.error || json.message || 'Request failed', response.status, json.data);
  }

  return json.data as T;
}

export const api = {
  health: async (): Promise<{ status: string; app: string; timestamp: string }> => {
    return request('/health');
  },

  auth: {
    register: async (username: string, password: string): Promise<{ user: User; token: string }> => {
      return request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
    },

    login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
      return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
    },

    getMe: async (): Promise<{ user: User }> => {
      return request('/api/auth/me');
    },

    logout: async (): Promise<void> => {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } catch {
        // ignore network error on logout
      }
    }
  },

  bookmarks: {
    list: async (params?: {
      page?: number;
      limit?: number;
      platform?: string;
      category?: string;
      tag?: string;
      content_type?: string;
      ai_status?: string;
    }): Promise<{ bookmarks: Bookmark[]; total: number; page: number; limit: number }> => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            searchParams.set(key, String(val));
          }
        });
      }
      const qs = searchParams.toString();
      return request(`/api/bookmarks${qs ? `?${qs}` : ''}`);
    },

    get: async (id: string): Promise<Bookmark> => {
      return request(`/api/bookmarks/${id}`);
    },

    create: async (data: {
      url?: string;
      sharedText?: string;
      title?: string;
      notes?: string;
    }): Promise<Bookmark> => {
      return request('/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    search: async (q: string): Promise<{ items: Bookmark[]; total: number }> => {
      return request(`/api/bookmarks/search?q=${encodeURIComponent(q)}`);
    },

    update: async (
      id: string,
      updates: {
        title?: string | null;
        description?: string | null;
        notes?: string | null;
        category?: string | null;
        tags?: string[];
        thumbnail_url?: string | null;
      }
    ): Promise<Bookmark> => {
      return request(`/api/bookmarks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },

    delete: async (id: string): Promise<void> => {
      return request(`/api/bookmarks/${id}`, {
        method: 'DELETE'
      });
    },

    reprocess: async (id: string): Promise<Bookmark> => {
      return request(`/api/bookmarks/${id}/reprocess`, {
        method: 'POST'
      });
    },

    getCategories: async (): Promise<CategoryCount[]> => {
      return request('/api/categories');
    },

    getTags: async (): Promise<TagCount[]> => {
      return request('/api/tags');
    }
  }
};
