import { getSupabase } from './supabase-client.js';
import { AuthService } from './auth.service.js';
import { PendingQueueService } from './pending-queue.service.js';
import { CONFIG } from '../config/env.config.js';
import type { Bookmark, SaveBookmarkResponse, CaptureSourceType } from '../types/index.js';
import { validateUrl, normalizeUrlForProduction } from '../utils/url-validator.js';
import { detectPlatform, generateDefaultTitle } from '../utils/platform-detector.js';

export class ProductionBookmarksService {
  /**
   * Save a bookmark directly through the authorized production pipeline
   */
  static async saveBookmark(params: {
    url: string;
    title?: string;
    sourceType: CaptureSourceType;
    sourcePageUrl?: string;
    faviconUrl?: string;
  }): Promise<SaveBookmarkResponse> {
    const validation = validateUrl(params.url);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || 'Invalid URL'
      };
    }

    // 1. Check user authentication
    const auth = await AuthService.getAuthStatus();
    if (!auth.isAuthenticated || !auth.user || !auth.token) {
      // Offline/unauthenticated: queue in pending storage
      await PendingQueueService.enqueue({
        url: validation.normalizedUrl,
        title: params.title,
        sourceType: params.sourceType,
        sourcePageUrl: params.sourcePageUrl,
        faviconUrl: params.faviconUrl
      });

      return {
        success: true,
        isPendingOffline: true,
        error: 'Saved locally. Sign in with BookMyMark to sync to your account and Android app.'
      };
    }

    const supabase = getSupabase();
    const userId = auth.user.id;
    const token = auth.token;
    const rawUrl = validation.normalizedUrl;
    const normalizedUrl = normalizeUrlForProduction(rawUrl);
    const platform = detectPlatform(rawUrl);

    // Clean title
    let resolvedTitle = (params.title || '').trim();
    if (!resolvedTitle || resolvedTitle.startsWith('http://') || resolvedTitle.startsWith('https://')) {
      resolvedTitle = generateDefaultTitle(rawUrl, platform);
    }

    const bookmarkId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 2. Direct INSERT to Supabase PostgreSQL table
    try {
      const { data: inserted, error } = await supabase
        .from('bookmarks')
        .insert({
          id: bookmarkId,
          user_id: userId,
          original_url: rawUrl,
          normalized_url: normalizedUrl,
          platform,
          title: resolvedTitle,
          description: null,
          shared_text: null,
          thumbnail_url: null, // Strict no image persistence policy
          ai_status: 'pending',
          tags: [],
          created_at: now,
          updated_at: now,
          synced_at: now
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (duplicate URL for this user)
        if (error.code === '23505') {
          const { data: existing } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .eq('normalized_url', normalizedUrl)
            .maybeSingle();

          return {
            success: true,
            isDuplicate: true,
            bookmark: existing || undefined
          };
        }
        throw error;
      }

      // 3. Asynchronously trigger Cloudflare Worker AI Enrichment
      this.triggerWorkerEnrichment(bookmarkId, token).catch(() => {});

      return {
        success: true,
        isDuplicate: false,
        bookmark: inserted,
        enrichmentTriggered: true
      };
    } catch (err: any) {
      console.warn('[BookMyMark] Production insert error:', err);

      // If network failure, queue for offline sync
      await PendingQueueService.enqueue({
        url: rawUrl,
        title: resolvedTitle,
        sourceType: params.sourceType,
        sourcePageUrl: params.sourcePageUrl,
        faviconUrl: params.faviconUrl
      });

      return {
        success: true,
        isPendingOffline: true,
        error: 'Network issue. Saved locally and queued for synchronization.'
      };
    }
  }

  /**
   * Fetch recent production bookmarks for current authenticated user
   */
  static async listRecentBookmarks(limit: number = 10): Promise<Bookmark[]> {
    const auth = await AuthService.getAuthStatus();
    if (!auth.isAuthenticated || !auth.user) {
      return [];
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[BookMyMark] Error listing bookmarks:', err);
      return [];
    }
  }

  /**
   * Trigger Cloudflare Worker AI Enrichment endpoint
   */
  private static async triggerWorkerEnrichment(bookmarkId: string, token: string): Promise<boolean> {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/bookmarks/${bookmarkId}/enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(6000)
      });
      return res.ok || res.status === 202;
    } catch {
      return false;
    }
  }

  /**
   * Process all pending offline operations when user is online & authenticated
   */
  static async processPendingQueue(): Promise<number> {
    const auth = await AuthService.getAuthStatus();
    if (!auth.isAuthenticated || !auth.user) {
      return 0;
    }

    const pending = await PendingQueueService.getPending();
    if (!pending.length) return 0;

    let processedCount = 0;

    for (const item of pending) {
      try {
        const res = await this.saveBookmark({
          url: item.url,
          title: item.title,
          sourceType: item.sourceType,
          sourcePageUrl: item.sourcePageUrl,
          faviconUrl: item.faviconUrl
        });

        if (res.success && !res.isPendingOffline) {
          await PendingQueueService.remove(item.id);
          processedCount++;
        }
      } catch {
        // Keep in queue for next cycle
      }
    }

    return processedCount;
  }
}
