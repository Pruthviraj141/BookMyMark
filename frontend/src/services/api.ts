import { supabase } from '../config/supabase.js';
import { getApiBaseUrl } from '../config/api.config.js';
import { BookmarksService } from './bookmarks.service.js';
import { PreviewService, type LinkPreviewData } from './preview.service.js';
import { EnrichmentService } from './enrichment.service.js';
import type { Bookmark, CategoryCount, TagCount } from '../types/index.js';

export type { LinkPreviewData };

export function getAuthToken(): string | null {
  return localStorage.getItem('savr_auth_token') || localStorage.getItem('mybookmark_auth_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('savr_auth_token', token);
    localStorage.setItem('mybookmark_auth_token', token);
  } else {
    localStorage.removeItem('savr_auth_token');
    localStorage.removeItem('mybookmark_auth_token');
  }
}

/**
 * Display external image URL directly without proxy or permanent storage.
 */
export function getProxyImageUrl(originalUrl: string | null | undefined): string | null {
  if (!originalUrl) return null;
  return originalUrl;
}

/**
 * Helper: Resolve current user and token directly from Supabase
 */
async function getCurrentSession(): Promise<{ userId: string; token: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error('User not authenticated');
  }
  return {
    userId: session.user.id,
    token: session.access_token
  };
}

export const api = {
  health: async (): Promise<{ status: string; service: string; time: string }> => {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/health`);
    return res.json();
  },

  bookmarks: {
    // 1. Direct Supabase Query
    list: async (params?: {
      category?: string;
      platform?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }): Promise<{ bookmarks: Bookmark[]; total: number }> => {
      const { userId } = await getCurrentSession();
      if (params?.search && params.search.trim()) {
        const results = await BookmarksService.searchBookmarks(userId, params.search.trim());
        return { bookmarks: results, total: results.length };
      }
      return BookmarksService.listBookmarks(userId, params);
    },

    // 2. Direct Supabase Get
    get: async (id: string): Promise<Bookmark> => {
      const { userId } = await getCurrentSession();
      const item = await BookmarksService.getBookmark(userId, id);
      if (!item) throw new Error('Bookmark not found');
      return item;
    },

    // 3. Direct Supabase Insert + Local-First + Worker AI enrichment
    create: async (data: {
      url: string;
      sharedText?: string | null;
      title?: string | null;
      notes?: string | null;
      imageUrl?: string | null;
    }): Promise<Bookmark> => {
      const { userId, token } = await getCurrentSession();
      return BookmarksService.createBookmark(userId, token, data);
    },

    // 4. Direct Supabase Search
    search: async (q: string): Promise<{ items: Bookmark[]; total: number }> => {
      const { userId } = await getCurrentSession();
      const items = await BookmarksService.searchBookmarks(userId, q);
      return { items, total: items.length };
    },

    // 5. Direct Supabase Update
    update: async (
      id: string,
      updates: {
        title?: string | null;
        description?: string | null;
        notes?: string | null;
        category?: string | null;
        tags?: string[];
        thumbnail_url?: string | null;
        is_favorite?: boolean;
      }
    ): Promise<Bookmark> => {
      const { userId } = await getCurrentSession();
      return BookmarksService.updateBookmark(userId, id, updates);
    },

    // 6. Direct Supabase Delete
    delete: async (id: string): Promise<void> => {
      const { userId } = await getCurrentSession();
      await BookmarksService.deleteBookmark(userId, id);
    },

    // 7. Reprocess / Enrich via Cloudflare Worker
    reprocess: async (id: string): Promise<{ success: boolean }> => {
      const { token } = await getCurrentSession();
      const res = await EnrichmentService.triggerEnrichment(id, token, undefined, true);
      return { success: res.success };
    },

    // 8. Categories directly from Supabase
    getCategories: async (): Promise<CategoryCount[]> => {
      const { userId } = await getCurrentSession();
      return BookmarksService.getCategories(userId);
    },

    // 9. Tags directly from Supabase
    getTags: async (): Promise<TagCount[]> => {
      const { userId } = await getCurrentSession();
      const { data } = await supabase
        .from('bookmarks')
        .select('tags')
        .eq('user_id', userId);

      const tagMap: Record<string, number> = {};
      (data || []).forEach((row) => {
        if (Array.isArray(row.tags)) {
          row.tags.forEach((t: string) => {
            if (t && t.trim()) {
              tagMap[t.trim()] = (tagMap[t.trim()] || 0) + 1;
            }
          });
        }
      });
      return Object.entries(tagMap).map(([tag, count]) => ({ tag, count }));
    },

    // 10. Link Preview: YouTube client-side or Worker GET /api/link-preview
    getLinkPreview: async (url: string): Promise<LinkPreviewData | null> => {
      return PreviewService.getPreview(url);
    }
  }
};
