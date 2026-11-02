import { describe, it, expect, beforeEach, vi } from 'vitest';

// Storage mock store
let mockStorage: Record<string, any> = {};

vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
        set: vi.fn(async (obj: Record<string, any>) => {
          Object.assign(mockStorage, obj);
        })
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    },
    action: {
      setBadgeText: vi.fn(async () => {}),
      setBadgeBackgroundColor: vi.fn(async () => {})
    }
  }
}));

import { CaptureStorageService, MAX_LOCAL_CAPTURES } from '../src/services/capture-storage.service.js';

describe('Capture Storage Service', () => {
  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  it('should save a valid page capture and return result', async () => {
    const res = await CaptureStorageService.saveCapture({
      url: 'https://example.com/blog/article-1',
      title: 'My Article',
      sourceType: 'page',
      faviconUrl: 'https://example.com/favicon.ico'
    });

    expect(res.success).toBe(true);
    expect(res.isDuplicate).toBe(false);
    expect(res.capture).toBeDefined();
    expect(res.capture?.url).toBe('https://example.com/blog/article-1');
    expect(res.capture?.title).toBe('My Article');
    expect(res.capture?.sourceType).toBe('page');
    expect(res.capture?.platform).toBe('website');
  });

  it('should save exact clicked link target for link capture', async () => {
    const res = await CaptureStorageService.saveCapture({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: '', // Empty title
      sourceType: 'link',
      sourcePageUrl: 'https://news.ycombinator.com'
    });

    expect(res.success).toBe(true);
    expect(res.capture?.url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(res.capture?.sourceType).toBe('link');
    expect(res.capture?.platform).toBe('youtube');
    expect(res.capture?.title).toBe('YouTube Video'); // Fallback platform title
    expect(res.capture?.sourcePageUrl).toBe('https://news.ycombinator.com');
  });

  it('should save containing page for video capture', async () => {
    const res = await CaptureStorageService.saveCapture({
      url: 'https://vimeo.com/12345678',
      title: 'Cool Indie Film',
      sourceType: 'video'
    });

    expect(res.success).toBe(true);
    expect(res.capture?.sourceType).toBe('video');
    expect(res.capture?.url).toBe('https://vimeo.com/12345678');
  });

  it('should reject invalid URLs gracefully', async () => {
    const res = await CaptureStorageService.saveCapture({
      url: 'chrome://extensions',
      sourceType: 'page'
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
    expect(await CaptureStorageService.getCaptureCount()).toBe(0);
  });

  it('should handle duplicate URLs by moving them to top without creating duplicates', async () => {
    const url = 'https://github.com/trending';
    const first = await CaptureStorageService.saveCapture({
      url,
      title: 'GitHub Trending',
      sourceType: 'page'
    });

    expect(first.isDuplicate).toBe(false);
    expect(await CaptureStorageService.getCaptureCount()).toBe(1);

    // Save another URL
    await CaptureStorageService.saveCapture({
      url: 'https://news.ycombinator.com',
      title: 'Hacker News',
      sourceType: 'page'
    });
    expect(await CaptureStorageService.getCaptureCount()).toBe(2);

    // Now re-save the first URL
    const duplicate = await CaptureStorageService.saveCapture({
      url,
      title: 'GitHub Trending',
      sourceType: 'page'
    });

    expect(duplicate.isDuplicate).toBe(true);
    // Count remains 2
    const captures = await CaptureStorageService.getCaptures();
    expect(captures.length).toBe(2);
    // The duplicate was moved to top index 0
    expect(captures[0].url).toBe(url);
  });

  it('should respect MAX_LOCAL_CAPTURES (20) limit', async () => {
    for (let i = 1; i <= 25; i++) {
      await CaptureStorageService.saveCapture({
        url: `https://example.com/post-${i}`,
        title: `Post ${i}`,
        sourceType: 'page'
      });
    }

    const captures = await CaptureStorageService.getCaptures();
    expect(captures.length).toBe(MAX_LOCAL_CAPTURES);
    // Most recent is post-25
    expect(captures[0].url).toBe('https://example.com/post-25');
  });

  it('should delete an individual capture by ID', async () => {
    const res = await CaptureStorageService.saveCapture({
      url: 'https://example.com/to-delete',
      title: 'Delete me',
      sourceType: 'page'
    });

    expect(await CaptureStorageService.getCaptureCount()).toBe(1);

    const deleted = await CaptureStorageService.deleteCapture(res.capture!.id);
    expect(deleted).toBe(true);
    expect(await CaptureStorageService.getCaptureCount()).toBe(0);
  });

  it('should clear all captures', async () => {
    await CaptureStorageService.saveCapture({ url: 'https://example.com/1', sourceType: 'page' });
    await CaptureStorageService.saveCapture({ url: 'https://example.com/2', sourceType: 'page' });
    expect(await CaptureStorageService.getCaptureCount()).toBe(2);

    const cleared = await CaptureStorageService.clearAll();
    expect(cleared).toBe(true);
    expect(await CaptureStorageService.getCaptureCount()).toBe(0);
  });

  it('should handle corrupted or null storage gracefully', async () => {
    mockStorage = { bookmymark_local_captures_v1: 'not-an-array' };
    const captures = await CaptureStorageService.getCaptures();
    expect(captures).toEqual([]);
  });
});
