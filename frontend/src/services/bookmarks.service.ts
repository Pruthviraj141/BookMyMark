import { supabase } from '../config/supabase.js';
import { LocalDbService } from './local-db.service.js';
import { EnrichmentService } from './enrichment.service.js';
import type { Bookmark, Platform } from '../types/index.js';

export class BookmarksService {
  /**
   * Helper: Normalize URL
   */
  private static normalizeUrl(rawUrl: string): string {
    try {
      const url = new URL(rawUrl.trim());
      url.hash = '';
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'igshid'];
      trackingParams.forEach((p) => url.searchParams.delete(p));
      return url.toString().replace(/\/$/, '');
    } catch {
      return rawUrl.trim();
    }
  }

  /**
   * Helper: Detect Platform
   */
  private static detectPlatform(url: string): Platform {
    const l = url.toLowerCase();
    if (l.includes('instagram.com')) return 'instagram';
    if (l.includes('twitter.com') || l.includes('x.com')) return 'x';
    if (l.includes('youtube.com') || l.includes('youtu.be')) return 'youtube';
    if (l.includes('tiktok.com')) return 'tiktok';
    if (l.includes('reddit.com')) return 'reddit';
    return 'website';
  }

  /**
   * 1. CREATE BOOKMARK
   * - Saves to local storage immediately (0ms instant response).
   * - Inserts directly into Supabase PostgreSQL.
   * - Triggers Cloudflare Worker AI enrichment.
   */
  static async createBookmark(
    userId: string,
    token: string,
    data: {
      url: string;
      sharedText?: string | null;
      title?: string | null;
      notes?: string | null;
    }
  ): Promise<Bookmark> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const normalized = this.normalizeUrl(data.url);
    const platform = this.detectPlatform(data.url);

    const newBookmark: Bookmark = {
      id,
      user_id: userId,
      url: data.url,
      original_url: data.url,
      normalized_url: normalized,
      platform,
      title: data.title || (data.sharedText ? data.sharedText.slice(0, 80) : data.url),
      description: data.sharedText || null,
      shared_text: data.sharedText || null,
      thumbnail_url: null, // Critical: No image persistence
      notes: data.notes || null,
      summary: null,
      category: 'Other',
      tags: [],
      ai_status: 'pending',
      created_at: now,
      updated_at: now,
      synced_at: now
    };

    // 1. Instant local store update
    LocalDbService.upsertBookmark(userId, newBookmark);

    // 2. Direct Supabase INSERT
    try {
      const { data: inserted, error } = await supabase
        .from('bookmarks')
        .insert({
          id,
          user_id: userId,
          original_url: data.url,
          normalized_url: normalized,
          platform,
          title: newBookmark.title,
          description: newBookmark.description,
          shared_text: newBookmark.shared_text,
          notes: newBookmark.notes,
          thumbnail_url: null,
          ai_status: 'pending',
          tags: [],
          created_at: now,
          updated_at: now,
          synced_at: now
        })
        .select()
        .single();

      if (error) {
        // If unique constraint violation (duplicate URL for user)
        if (error.code === '23505') {
          const { data: existing } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .eq('normalized_url', normalized)
            .maybeSingle();
          if (existing) {
            LocalDbService.upsertBookmark(userId, existing);
            return existing;
          }
        }
        throw error;
      }

      const activeRecord = inserted || newBookmark;
      LocalDbService.upsertBookmark(userId, activeRecord);

      // 3. Trigger Cloudflare Worker AI enrichment in background
      EnrichmentService.triggerEnrichment(id, token, data.sharedText).catch(() => {});

      return activeRecord;
    } catch (err) {
      console.warn('Direct Supabase insert failed, enqueued for offline sync:', err);
      // Queue for offline synchronization
      LocalDbService.enqueueSyncAction(userId, {
        id,
        type: 'create',
        bookmark: newBookmark,
        timestamp: Date.now()
      });
      return newBookmark;
    }
  }

  /**
   * 2. LIST BOOKMARKS
   * Direct Supabase query with local cache fallback and background sync.
   */
  static async listBookmarks(
    userId: string,
    params?: {
      category?: string;
      platform?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ bookmarks: Bookmark[]; total: number }> {
    // 1. Direct Supabase Query
    try {
      let query = supabase
        .from('bookmarks')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (params?.category && params.category !== 'All') {
        query = query.eq('category', params.category);
      }

      if (params?.platform && params.platform !== 'all') {
        query = query.eq('platform', params.platform);
      }

      if (params?.limit) {
        const offset = params.offset || 0;
        query = query.range(offset, offset + params.limit - 1);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      const remoteBookmarks = data || [];
      // Cache fresh bookmarks locally if this was an unfiltered query
      if (!params?.category && (!params?.platform || params.platform === 'all')) {
        LocalDbService.saveBookmarks(userId, remoteBookmarks);
      }

      return {
        bookmarks: remoteBookmarks,
        total: count || remoteBookmarks.length
      };
    } catch (err) {
      console.warn('Supabase query failed, returning local cache:', err);
      let cached = LocalDbService.getBookmarks(userId);
      if (params?.category && params.category !== 'All') {
        cached = cached.filter((b) => b.category === params.category);
      }
      if (params?.platform && params.platform !== 'all') {
        cached = cached.filter((b) => b.platform === params.platform);
      }
      return { bookmarks: cached, total: cached.length };
    }
  }

  /**
   * 3. GET SINGLE BOOKMARK
   */
  static async getBookmark(userId: string, id: string): Promise<Bookmark | null> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      const cached = LocalDbService.getBookmarks(userId).find((b) => b.id === id);
      return cached || null;
    }

    return data;
  }

  /**
   * 4. UPDATE BOOKMARK
   */
  static async updateBookmark(
    userId: string,
    id: string,
    updates: Partial<Bookmark>
  ): Promise<Bookmark> {
    const now = new Date().toISOString();
    const updatePayload = {
      ...updates,
      updated_at: now
    };

    // 1. Instant local update
    const cached = LocalDbService.getBookmarks(userId).find((b) => b.id === id);
    if (cached) {
      LocalDbService.upsertBookmark(userId, { ...cached, ...updatePayload });
    }

    // 2. Direct Supabase UPDATE
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (data) LocalDbService.upsertBookmark(userId, data);
      return data;
    } catch (err) {
      LocalDbService.enqueueSyncAction(userId, {
        id,
        type: 'update',
        bookmark: updatePayload,
        timestamp: Date.now()
      });
      return { ...(cached || {}), ...updatePayload } as Bookmark;
    }
  }

  /**
   * 5. DELETE BOOKMARK
   */
  static async deleteBookmark(userId: string, id: string): Promise<boolean> {
    // 1. Remove from local store immediately
    LocalDbService.removeBookmark(userId, id);

    // 2. Direct Supabase DELETE
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      LocalDbService.enqueueSyncAction(userId, {
        id,
        type: 'delete',
        bookmark: {},
        timestamp: Date.now()
      });
      return true;
    }
  }

  /**
   * 6. SEARCH BOOKMARKS (PostgreSQL Full-Text Search with GIN Index)
   */
  static async searchBookmarks(userId: string, query: string): Promise<Bookmark[]> {
    const q = query.trim();
    if (!q) return [];

    try {
      // Primary: PostgreSQL Full-Text Search using generated search_vector and GIN index
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .textSearch('search_vector', q, {
          type: 'websearch',
          config: 'english'
        })
        .order('created_at', { ascending: false })
        .limit(40);

      if (!error && data && data.length > 0) {
        return data;
      }

      // Secondary fallback: ILIKE search for partial substrings
      const { data: fallbackData } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,summary.ilike.%${q}%,extracted_text.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(40);

      return fallbackData || data || [];
    } catch (err) {
      // Offline local search fallback
      const cached = LocalDbService.getBookmarks(userId);
      const lower = q.toLowerCase();
      return cached.filter(
        (b) =>
          b.title?.toLowerCase().includes(lower) ||
          b.description?.toLowerCase().includes(lower) ||
          b.summary?.toLowerCase().includes(lower) ||
          b.tags?.some((t) => t.toLowerCase().includes(lower))
      );
    }
  }

  /**
   * 7. GET CATEGORIES
   */
  static async getCategories(userId: string): Promise<{ category: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('category')
        .eq('user_id', userId);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((row) => {
        const cat = row.category || 'Other';
        counts[cat] = (counts[cat] || 0) + 1;
      });

      return Object.entries(counts).map(([category, count]) => ({ category, count }));
    } catch {
      const cached = LocalDbService.getBookmarks(userId);
      const counts: Record<string, number> = {};
      cached.forEach((b) => {
        const cat = b.category || 'Other';
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return Object.entries(counts).map(([category, count]) => ({ category, count }));
    }
  }

  /**
   * 8. PROCESS OFFLINE SYNC QUEUE
   */
  static async processSyncQueue(userId: string, token: string): Promise<void> {
    const queue = LocalDbService.getSyncQueue(userId);
    if (!queue.length) return;

    for (const action of queue) {
      try {
        if (action.type === 'create') {
          const { error } = await supabase.from('bookmarks').insert({
            ...action.bookmark,
            user_id: userId
          });
          if (!error) {
            LocalDbService.removeSyncAction(userId, action.id);
            EnrichmentService.triggerEnrichment(action.id, token).catch(() => {});
          }
        } else if (action.type === 'update') {
          const { error } = await supabase
            .from('bookmarks')
            .update(action.bookmark)
            .eq('id', action.id)
            .eq('user_id', userId);
          if (!error) {
            LocalDbService.removeSyncAction(userId, action.id);
          }
        } else if (action.type === 'delete') {
          const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', action.id)
            .eq('user_id', userId);
          if (!error) {
            LocalDbService.removeSyncAction(userId, action.id);
          }
        }
      } catch (err) {
        console.warn('Sync queue action error:', err);
      }
    }
  }
}
