import { browser } from 'wxt/browser';
import type { PendingSaveOperation } from '../types/index.js';

const STORAGE_KEY_PENDING = 'bookmymark_pending_queue_v2';

export class PendingQueueService {
  /**
   * Get all pending operations waiting to be synced to production
   */
  static async getPending(): Promise<PendingSaveOperation[]> {
    try {
      const data = await browser.storage.local.get(STORAGE_KEY_PENDING);
      const raw = data[STORAGE_KEY_PENDING];
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  /**
   * Get count of pending operations
   */
  static async getCount(): Promise<number> {
    const list = await this.getPending();
    return list.length;
  }

  /**
   * Add a pending save operation
   */
  static async enqueue(op: Omit<PendingSaveOperation, 'id' | 'createdAt' | 'retryCount'>): Promise<PendingSaveOperation> {
    const list = await this.getPending();

    // Check if URL is already in queue
    const existing = list.find((item) => item.url === op.url);
    if (existing) {
      return existing;
    }

    const item: PendingSaveOperation = {
      ...op,
      id: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      retryCount: 0
    };

    const updated = [item, ...list];
    await browser.storage.local.set({ [STORAGE_KEY_PENDING]: updated });
    return item;
  }

  /**
   * Remove a single pending operation after successful sync
   */
  static async remove(id: string): Promise<void> {
    const list = await this.getPending();
    const updated = list.filter((item) => item.id !== id);
    await browser.storage.local.set({ [STORAGE_KEY_PENDING]: updated });
  }

  /**
   * Clear all pending operations
   */
  static async clear(): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEY_PENDING]: [] });
  }
}
