import type { Bookmark } from '../types/index.js';

export interface PendingSyncAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  bookmark: Partial<Bookmark>;
  timestamp: number;
}

export class LocalDbService {
  private static getBookmarksKey(userId: string): string {
    return `savr_bookmarks_${userId}`;
  }

  private static getQueueKey(userId: string): string {
    return `savr_sync_queue_${userId}`;
  }

  // 1. Get cached bookmarks for the current user
  static getBookmarks(userId: string): Bookmark[] {
    if (!userId) return [];
    try {
      const raw = localStorage.getItem(this.getBookmarksKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // 2. Save entire bookmark list locally
  static saveBookmarks(userId: string, bookmarks: Bookmark[]): void {
    if (!userId) return;
    try {
      localStorage.setItem(this.getBookmarksKey(userId), JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('LocalDb saveBookmarks error:', e);
    }
  }

  // 3. Upsert a single bookmark locally (for instant 0ms optimistic UI updates)
  static upsertBookmark(userId: string, bookmark: Bookmark): void {
    if (!userId) return;
    const existing = this.getBookmarks(userId);
    const idx = existing.findIndex((b) => b.id === bookmark.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...bookmark };
    } else {
      existing.unshift(bookmark);
    }
    this.saveBookmarks(userId, existing);
  }

  // 4. Remove a bookmark locally
  static removeBookmark(userId: string, id: string): void {
    if (!userId) return;
    const existing = this.getBookmarks(userId);
    const filtered = existing.filter((b) => b.id !== id);
    this.saveBookmarks(userId, filtered);
  }

  // 5. Offline sync queue
  static getSyncQueue(userId: string): PendingSyncAction[] {
    if (!userId) return [];
    try {
      const raw = localStorage.getItem(this.getQueueKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static enqueueSyncAction(userId: string, action: PendingSyncAction): void {
    if (!userId) return;
    const queue = this.getSyncQueue(userId);
    // Replace duplicate queue items for the same bookmark if appropriate
    const filtered = queue.filter(
      (a) => !(a.id === action.id && a.type === action.type)
    );
    filtered.push(action);
    try {
      localStorage.setItem(this.getQueueKey(userId), JSON.stringify(filtered));
    } catch (e) {
      console.warn('LocalDb enqueueSyncAction error:', e);
    }
  }

  static removeSyncAction(userId: string, actionId: string): void {
    if (!userId) return;
    const queue = this.getSyncQueue(userId);
    const filtered = queue.filter((a) => a.id !== actionId);
    try {
      localStorage.setItem(this.getQueueKey(userId), JSON.stringify(filtered));
    } catch (e) {
      console.warn('LocalDb removeSyncAction error:', e);
    }
  }

  static clearUserCache(userId: string): void {
    if (!userId) return;
    localStorage.removeItem(this.getBookmarksKey(userId));
    localStorage.removeItem(this.getQueueKey(userId));
  }
}
