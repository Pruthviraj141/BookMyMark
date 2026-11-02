import { browser } from 'wxt/browser';
import type { LocalCaptureDraft, CaptureResult, CaptureSourceType } from '../types/index.js';
import { validateUrl, getDomainFromUrl } from '../utils/url-validator.js';
import { detectPlatform, generateDefaultTitle } from '../utils/platform-detector.js';

export const STORAGE_KEY_CAPTURES = 'bookmymark_local_captures_v1';
export const MAX_LOCAL_CAPTURES = 20;

export class CaptureStorageService {
  /**
   * Fetch all local captures from browser storage
   */
  static async getCaptures(): Promise<LocalCaptureDraft[]> {
    try {
      const data = await browser.storage.local.get(STORAGE_KEY_CAPTURES);
      const raw = data[STORAGE_KEY_CAPTURES];
      if (Array.isArray(raw)) {
        return raw;
      }
      return [];
    } catch (err) {
      console.warn('[BookMyMark] Failed to read from storage:', err);
      return [];
    }
  }

  /**
   * Get the current count of stored captures
   */
  static async getCaptureCount(): Promise<number> {
    const list = await this.getCaptures();
    return list.length;
  }

  /**
   * Save a capture draft to local storage
   */
  static async saveCapture(params: {
    url: string;
    title?: string;
    sourceType: CaptureSourceType;
    sourcePageUrl?: string;
    faviconUrl?: string;
  }): Promise<CaptureResult> {
    const validation = validateUrl(params.url);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || 'Invalid URL'
      };
    }

    const currentCaptures = await this.getCaptures();
    const cleanUrl = validation.normalizedUrl;
    const platform = detectPlatform(cleanUrl);
    const domain = validation.domain || getDomainFromUrl(cleanUrl);

    // Clean up title: if missing or raw URL, generate fallback title
    let resolvedTitle = (params.title || '').trim();
    if (!resolvedTitle || resolvedTitle.startsWith('http://') || resolvedTitle.startsWith('https://')) {
      resolvedTitle = generateDefaultTitle(cleanUrl, platform);
    }

    // Check for existing duplicate by URL
    const existingIndex = currentCaptures.findIndex(
      (item) => item.url.toLowerCase().replace(/\/$/, '') === cleanUrl.toLowerCase().replace(/\/$/, '')
    );

    if (existingIndex !== -1) {
      // Re-order duplicate to front with updated timestamp
      const existing = currentCaptures[existingIndex];
      const updatedItem: LocalCaptureDraft = {
        ...existing,
        capturedAt: Date.now(),
        title: resolvedTitle || existing.title
      };

      const remaining = currentCaptures.filter((_, idx) => idx !== existingIndex);
      const updatedList = [updatedItem, ...remaining].slice(0, MAX_LOCAL_CAPTURES);

      await this.persistList(updatedList);
      await this.updateActionBadge(updatedList.length);

      return {
        success: true,
        isDuplicate: true,
        capture: updatedItem
      };
    }

    const newCapture: LocalCaptureDraft = {
      id: `capture_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      url: cleanUrl,
      title: resolvedTitle,
      sourceType: params.sourceType,
      sourcePageUrl: params.sourcePageUrl,
      platform,
      faviconUrl: params.faviconUrl,
      domain,
      capturedAt: Date.now()
    };

    const updatedList = [newCapture, ...currentCaptures].slice(0, MAX_LOCAL_CAPTURES);

    await this.persistList(updatedList);
    await this.updateActionBadge(updatedList.length);

    return {
      success: true,
      isDuplicate: false,
      capture: newCapture
    };
  }

  /**
   * Delete a single capture by ID
   */
  static async deleteCapture(id: string): Promise<boolean> {
    try {
      const list = await this.getCaptures();
      const filtered = list.filter((item) => item.id !== id);
      await this.persistList(filtered);
      await this.updateActionBadge(filtered.length);
      return true;
    } catch (err) {
      console.warn('[BookMyMark] Failed to delete capture:', err);
      return false;
    }
  }

  /**
   * Clear all local captures
   */
  static async clearAll(): Promise<boolean> {
    try {
      await this.persistList([]);
      await this.updateActionBadge(0);
      return true;
    } catch (err) {
      console.warn('[BookMyMark] Failed to clear captures:', err);
      return false;
    }
  }

  /**
   * Helper to write capture list to storage
   */
  private static async persistList(list: LocalCaptureDraft[]): Promise<void> {
    await browser.storage.local.set({
      [STORAGE_KEY_CAPTURES]: list
    });
  }

  /**
   * Update browser action badge
   */
  static async updateActionBadge(count: number): Promise<void> {
    try {
      const badgeText = count > 0 ? String(count) : '';
      if (browser.action?.setBadgeText) {
        await browser.action.setBadgeText({ text: badgeText });
        await browser.action.setBadgeBackgroundColor({ color: '#111111' });
      }
    } catch (err) {
      // Browser might not support action badge in all contexts
    }
  }

  /**
   * Subscribe to storage change events
   */
  static onStorageChanged(callback: (captures: LocalCaptureDraft[]) => void): () => void {
    const listener = (changes: Record<string, any>, areaName: string) => {
      if (areaName === 'local' && changes[STORAGE_KEY_CAPTURES]) {
        const newVal = changes[STORAGE_KEY_CAPTURES].newValue;
        callback(Array.isArray(newVal) ? newVal : []);
      }
    };

    browser.storage.onChanged.addListener(listener);
    return () => {
      browser.storage.onChanged.removeListener(listener);
    };
  }
}
