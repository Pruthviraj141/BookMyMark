import { browser } from 'wxt/browser';
import type { ActiveTabInfo } from '../types/index.js';
import { validateUrl, getDomainFromUrl } from '../utils/url-validator.js';

export class BrowserApiService {
  /**
   * Retrieves the active tab in the current window safely
   */
  static async getActiveTab(): Promise<ActiveTabInfo> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];

      if (!currentTab || !currentTab.url) {
        return {
          url: '',
          title: 'No active tab',
          domain: '',
          isValid: false,
          invalidReason: 'Unable to access active tab URL.'
        };
      }

      const rawUrl = currentTab.url;
      const validation = validateUrl(rawUrl);

      if (!validation.isValid) {
        return {
          url: rawUrl,
          title: currentTab.title || 'Protected Page',
          faviconUrl: currentTab.favIconUrl,
          domain: getDomainFromUrl(rawUrl),
          isValid: false,
          invalidReason: validation.error || 'This browser page cannot be bookmarked.'
        };
      }

      return {
        url: validation.normalizedUrl,
        title: currentTab.title || validation.domain || 'Web Page',
        faviconUrl: currentTab.favIconUrl,
        domain: validation.domain || getDomainFromUrl(validation.normalizedUrl),
        isValid: true
      };
    } catch (err: any) {
      return {
        url: '',
        title: 'Error reading tab',
        domain: '',
        isValid: false,
        invalidReason: err?.message || 'Permission or browser error reading active tab.'
      };
    }
  }

  /**
   * Open a URL in a new tab
   */
  static async openTab(url: string): Promise<void> {
    try {
      await browser.tabs.create({ url });
    } catch (err) {
      console.warn('[BookMyMark] Failed to open tab:', err);
    }
  }

  /**
   * Copy text to user clipboard
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
