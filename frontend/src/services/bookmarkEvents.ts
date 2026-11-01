import type { Bookmark } from '../types/index.js';

type BookmarkEventMap = {
  created: Bookmark;
  updated: Bookmark;
  deleted: string; // bookmark id
  refresh: void;
};

type Listener<T> = (data: T) => void;

class BookmarkEventEmitter {
  private listeners: { [K in keyof BookmarkEventMap]?: Set<Listener<any>> } = {};

  on<K extends keyof BookmarkEventMap>(event: K, listener: Listener<BookmarkEventMap[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(listener);
    return () => {
      this.listeners[event]?.delete(listener);
    };
  }

  emit<K extends keyof BookmarkEventMap>(event: K, data?: BookmarkEventMap[K]): void {
    const set = this.listeners[event];
    if (set) {
      set.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error(`Error in bookmark event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const bookmarkEvents = new BookmarkEventEmitter();
