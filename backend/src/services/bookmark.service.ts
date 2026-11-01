import { randomUUID } from 'node:crypto';
import { BookmarkRepository, type ListBookmarksFilter } from '../repositories/bookmark.repository.js';
import { PlatformService } from './platform.service.js';
import { MetadataService } from './metadata.service.js';
import { AiService } from './ai.service.js';
import { normalizeUrl, extractUrlFromText, isValidHttpUrl } from '../utils/url.utils.js';
import type { Bookmark, BookmarkResponse, Platform } from '../types/index.js';

export function formatBookmarkResponse(bookmark: Bookmark): BookmarkResponse {
  let tags: string[] = [];
  try {
    tags = JSON.parse(bookmark.tags_json || '[]');
    if (!Array.isArray(tags)) tags = [];
  } catch {
    tags = [];
  }

  const { tags_json, ...rest } = bookmark;
  return {
    ...rest,
    tags
  };
}

export interface CreateBookmarkInput {
  url: string;
  sharedText?: string | null;
  title?: string | null;
  notes?: string | null;
}

export class BookmarkService {
  // In-process set to avoid concurrent redundant processing
  private static processingQueue = new Set<string>();

  /**
   * Main entry point for bookmark creation.
   * Persists immediately and launches asynchronous metadata/AI pipeline.
   */
  static async createBookmark(
    userId: string,
    input: CreateBookmarkInput
  ): Promise<{ bookmark: BookmarkResponse; isDuplicate: boolean }> {
    let rawUrl = input.url?.trim() || '';

    // If url is not valid or empty, attempt extraction from sharedText
    if (!isValidHttpUrl(rawUrl) && input.sharedText) {
      const extracted = extractUrlFromText(input.sharedText);
      if (extracted) {
        rawUrl = extracted;
      }
    }

    if (!isValidHttpUrl(rawUrl)) {
      throw new Error('A valid HTTP or HTTPS URL is required');
    }

    const normalized = normalizeUrl(rawUrl);
    const platform: Platform = PlatformService.detectPlatform(normalized);

    // Check duplicate
    const existing = BookmarkRepository.findByUserAndNormalizedUrl(userId, normalized);
    if (existing) {
      return {
        bookmark: formatBookmarkResponse(existing),
        isDuplicate: true
      };
    }

    const now = new Date().toISOString();
    const bookmarkId = randomUUID();

    // Check if YouTube thumbnail can be determined immediately
    let initialThumbnail: string | null = null;
    const ytId = PlatformService.extractYouTubeVideoId(normalized);
    if (ytId) {
      initialThumbnail = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
    }

    const newBookmark: Bookmark = {
      id: bookmarkId,
      user_id: userId,
      url: rawUrl,
      normalized_url: normalized,
      platform,
      title: input.title?.trim() || null,
      description: null,
      thumbnail_url: initialThumbnail,
      author_name: null,
      shared_text: input.sharedText?.trim() || null,
      extracted_text: null,
      summary: null,
      category: null,
      tags_json: '[]',
      content_type: null,
      ai_status: 'pending',
      ai_confidence: null,
      ai_error: null,
      notes: input.notes?.trim() || null,
      created_at: now,
      updated_at: now
    };

    const saved = BookmarkRepository.create(newBookmark);

    // Trigger async background processing without blocking the HTTP response
    this.enqueueBackgroundProcessing(bookmarkId, userId, rawUrl);

    return {
      bookmark: formatBookmarkResponse(saved),
      isDuplicate: false
    };
  }

  /**
   * Enqueues background job for metadata extraction and AI categorization.
   */
  static enqueueBackgroundProcessing(bookmarkId: string, userId: string, url: string): void {
    if (this.processingQueue.has(bookmarkId)) {
      return;
    }

    this.processingQueue.add(bookmarkId);

    // Execute in next tick
    setImmediate(async () => {
      try {
        await this.runPipeline(bookmarkId, userId, url);
      } catch (err) {
        console.error(`Background processing failed for bookmark ${bookmarkId}:`, err);
      } finally {
        this.processingQueue.delete(bookmarkId);
      }
    });
  }

  /**
   * Runs the complete pipeline: Metadata Extraction -> AI Categorization
   */
  static async runPipeline(bookmarkId: string, userId: string, url: string): Promise<void> {
    const bookmark = BookmarkRepository.findById(bookmarkId, userId);
    if (!bookmark) return;

    // Step 1: Metadata extraction
    const metadata = await MetadataService.extract(url);

    // Update with extracted metadata, preserving manually provided title
    BookmarkRepository.update(bookmarkId, userId, {
      title: bookmark.title || metadata.title || (bookmark.shared_text && !isValidHttpUrl(bookmark.shared_text) ? bookmark.shared_text.trim().slice(0, 100) : null),
      description: metadata.description || null,
      thumbnail_url: bookmark.thumbnail_url || metadata.thumbnail_url || null,
      author_name: metadata.author_name || null,
      extracted_text: metadata.extracted_text || null
    });

    // Step 2: AI categorization
    await AiService.processBookmark(bookmarkId, userId);
  }

  static getBookmark(id: string, userId: string): BookmarkResponse | null {
    const bookmark = BookmarkRepository.findById(id, userId);
    return bookmark ? formatBookmarkResponse(bookmark) : null;
  }

  static listBookmarks(params: ListBookmarksFilter): {
    bookmarks: BookmarkResponse[];
    total: number;
    page: number;
    limit: number;
  } {
    const result = BookmarkRepository.list(params);
    return {
      bookmarks: result.items.map(formatBookmarkResponse),
      total: result.total,
      page: result.page,
      limit: result.limit
    };
  }

  static searchBookmarks(userId: string, query: string): BookmarkResponse[] {
    const result = BookmarkRepository.search(userId, query);
    return result.items.map(formatBookmarkResponse);
  }

  static updateBookmark(
    id: string,
    userId: string,
    updates: Partial<Bookmark> & { tags?: string[] }
  ): BookmarkResponse | null {
    const payload: Partial<Bookmark> = { ...updates };
    if (updates.tags && Array.isArray(updates.tags)) {
      payload.tags_json = JSON.stringify(updates.tags);
      delete (payload as any).tags;
    }

    const updated = BookmarkRepository.update(id, userId, payload);
    return updated ? formatBookmarkResponse(updated) : null;
  }

  static deleteBookmark(id: string, userId: string): boolean {
    return BookmarkRepository.delete(id, userId);
  }

  static reprocessBookmark(id: string, userId: string): BookmarkResponse | null {
    const bookmark = BookmarkRepository.findById(id, userId);
    if (!bookmark) return null;

    BookmarkRepository.update(id, userId, {
      ai_status: 'pending',
      ai_error: null
    });

    this.enqueueBackgroundProcessing(id, userId, bookmark.url);
    const updated = BookmarkRepository.findById(id, userId);
    return updated ? formatBookmarkResponse(updated) : null;
  }

  static getCategories(userId: string): { category: string; count: number }[] {
    return BookmarkRepository.getCategories(userId);
  }

  static getTags(userId: string): { tag: string; count: number }[] {
    return BookmarkRepository.getTags(userId);
  }
}
