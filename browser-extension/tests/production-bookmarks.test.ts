import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage
let mockStorage: Record<string, any> = {};

vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
        set: vi.fn(async (obj: Record<string, any>) => {
          Object.assign(mockStorage, obj);
        }),
        remove: vi.fn(async (key: string) => {
          delete mockStorage[key];
        })
      }
    },
    action: {
      setBadgeText: vi.fn(async () => {}),
      setBadgeBackgroundColor: vi.fn(async () => {})
    }
  }
}));

// Mock Supabase
let mockUser: any = { id: 'user-uuid-1234', email: 'test@bookmymark.app' };
let mockToken: string | null = 'mock-jwt-token';
let mockDbBookmarks: any[] = [];
let shouldFailInsert = false;
let insertErrorCode: string | null = null;

vi.mock('../src/services/auth.service.js', () => ({
  AuthService: {
    getAuthStatus: vi.fn(async () => ({
      isAuthenticated: Boolean(mockUser),
      user: mockUser,
      token: mockToken
    }))
  }
}));

vi.mock('../src/services/supabase-client.js', () => ({
  getSupabase: () => ({
    from: (_table: string) => ({
      insert: (record: any) => ({
        select: () => ({
          single: async () => {
            if (shouldFailInsert) {
              return { data: null, error: { code: insertErrorCode || '500', message: 'DB Error' } };
            }
            // Check unique constraint violation
            const duplicate = mockDbBookmarks.find(
              (b) => b.user_id === record.user_id && b.normalized_url === record.normalized_url
            );
            if (duplicate) {
              return { data: null, error: { code: '23505', message: 'Duplicate bookmark' } };
            }
            mockDbBookmarks.push(record);
            return { data: record, error: null };
          }
        })
      }),
      select: () => ({
        eq: (col1: string, val1: any) => ({
          eq: (col2: string, val2: any) => ({
            maybeSingle: async () => {
              const found = mockDbBookmarks.find((b) => b[col1] === val1 && b[col2] === val2);
              return { data: found || null, error: null };
            }
          }),
          order: () => ({
            limit: async (limit: number) => {
              const matches = mockDbBookmarks.filter((b) => b[col1] === val1).slice(0, limit);
              return { data: matches, error: null };
            }
          })
        })
      })
    })
  })
}));

// Mock fetch for Cloudflare Worker enrichment endpoint
global.fetch = vi.fn(async () => ({
  ok: true,
  status: 202,
  json: async () => ({ success: true, message: 'Enrichment accepted' })
})) as any;

import { ProductionBookmarksService } from '../src/services/production-bookmarks.service.js';
import { PendingQueueService } from '../src/services/pending-queue.service.js';
import { normalizeUrlForProduction } from '../src/utils/url-validator.js';

describe('Production Bookmarks Service', () => {
  beforeEach(() => {
    mockStorage = {};
    mockDbBookmarks = [];
    mockUser = { id: 'user-uuid-1234', email: 'test@bookmymark.app' };
    mockToken = 'mock-jwt-token';
    shouldFailInsert = false;
    insertErrorCode = null;
    vi.clearAllMocks();
  });

  it('should save a valid webpage directly to Supabase production schema', async () => {
    const res = await ProductionBookmarksService.saveBookmark({
      url: 'https://news.ycombinator.com',
      title: 'Hacker News',
      sourceType: 'page'
    });

    expect(res.success).toBe(true);
    expect(res.isDuplicate).toBe(false);
    expect(res.bookmark).toBeDefined();
    expect(res.bookmark?.user_id).toBe('user-uuid-1234');
    expect(res.bookmark?.original_url).toBe('https://news.ycombinator.com');
    expect(res.bookmark?.normalized_url).toBe('https://news.ycombinator.com');
    expect(res.bookmark?.platform).toBe('website');
    expect(res.bookmark?.thumbnail_url).toBeNull(); // No image persistence
    expect(res.bookmark?.ai_status).toBe('pending');
    expect(res.enrichmentTriggered).toBe(true);
  });

  it('should normalize tracking parameters matching mobile BookmarksService', () => {
    const raw = 'https://example.com/post?utm_source=twitter&utm_medium=social&fbclid=12345&id=99#content';
    const normalized = normalizeUrlForProduction(raw);
    expect(normalized).toBe('https://example.com/post?id=99');
    expect(normalized).not.toContain('utm_source');
    expect(normalized).not.toContain('fbclid');
    expect(normalized).not.toContain('#content');
  });

  it('should handle duplicate URL saving by returning existing record with isDuplicate true', async () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    // First save
    const first = await ProductionBookmarksService.saveBookmark({
      url,
      sourceType: 'link'
    });
    expect(first.success).toBe(true);
    expect(first.isDuplicate).toBe(false);

    // Second save (triggers 23505 duplicate constraint)
    const second = await ProductionBookmarksService.saveBookmark({
      url,
      sourceType: 'link'
    });

    expect(second.success).toBe(true);
    expect(second.isDuplicate).toBe(true);
    expect(second.bookmark?.id).toBe(first.bookmark?.id);
  });

  it('should queue locally in pending storage if user is not authenticated', async () => {
    mockUser = null;
    mockToken = null;

    const res = await ProductionBookmarksService.saveBookmark({
      url: 'https://github.com/trending',
      title: 'GitHub Trending',
      sourceType: 'page'
    });

    expect(res.success).toBe(true);
    expect(res.isPendingOffline).toBe(true);

    const pending = await PendingQueueService.getPending();
    expect(pending.length).toBe(1);
    expect(pending[0].url).toBe('https://github.com/trending');
  });

  it('should drain and sync pending queue when authenticated', async () => {
    // Add pending item
    await PendingQueueService.enqueue({
      url: 'https://example.com/pending-sync',
      title: 'Pending Item',
      sourceType: 'page'
    });

    expect(await PendingQueueService.getCount()).toBe(1);

    // User is logged in, process queue
    const synced = await ProductionBookmarksService.processPendingQueue();
    expect(synced).toBe(1);
    expect(await PendingQueueService.getCount()).toBe(0);
    expect(mockDbBookmarks.length).toBe(1);
    expect(mockDbBookmarks[0].original_url).toBe('https://example.com/pending-sync');
  });

  it('should reject invalid URLs without querying database', async () => {
    const res = await ProductionBookmarksService.saveBookmark({
      url: 'javascript:alert(1)',
      sourceType: 'page'
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(mockDbBookmarks.length).toBe(0);
  });
});
