import { defineBackground } from 'wxt/sandbox';
import { browser } from 'wxt/browser';
import { AuthService } from '../src/services/auth.service.js';
import { ProductionBookmarksService } from '../src/services/production-bookmarks.service.js';
import { PendingQueueService } from '../src/services/pending-queue.service.js';
import { validateUrl } from '../src/utils/url-validator.js';
import type { ExtensionMessage } from '../src/types/index.js';

export default defineBackground(() => {
  const MENU_SAVE_LINK = 'bookmymark-save-link';
  const MENU_SAVE_PAGE = 'bookmymark-save-page';
  const MENU_SAVE_VIDEO = 'bookmymark-save-video';

  /**
   * Safe Context Menus Registration
   */
  async function setupContextMenus() {
    try {
      await browser.contextMenus.removeAll();

      browser.contextMenus.create({
        id: MENU_SAVE_LINK,
        title: 'Save link to BookMyMark',
        contexts: ['link']
      });

      browser.contextMenus.create({
        id: MENU_SAVE_PAGE,
        title: 'Save this page to BookMyMark',
        contexts: ['page']
      });

      browser.contextMenus.create({
        id: MENU_SAVE_VIDEO,
        title: 'Save video page to BookMyMark',
        contexts: ['video']
      });
    } catch (err) {
      console.warn('[BookMyMark] Context menu creation note:', err);
    }
  }

  // Register on install/update
  browser.runtime.onInstalled.addListener(() => {
    setupContextMenus();
    updateBadge();
    // Attempt pending sync on install
    ProductionBookmarksService.processPendingQueue().catch(() => {});
  });

  // Re-verify on browser startup
  browser.runtime.onStartup?.addListener(() => {
    setupContextMenus();
    updateBadge();
    ProductionBookmarksService.processPendingQueue().catch(() => {});
  });

  /**
   * Context Menu Click Handler -> Production Bookmark Pipeline
   */
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    let targetUrl: string | undefined;
    let title: string | undefined;
    let sourceType: 'link' | 'page' | 'video' = 'page';
    const sourcePageUrl = info.pageUrl || tab?.url;

    switch (info.menuItemId) {
      case MENU_SAVE_LINK: {
        targetUrl = info.linkUrl;
        sourceType = 'link';
        break;
      }
      case MENU_SAVE_VIDEO: {
        targetUrl = info.pageUrl || tab?.url;
        title = tab?.title;
        sourceType = 'video';
        break;
      }
      case MENU_SAVE_PAGE:
      default: {
        targetUrl = info.pageUrl || tab?.url;
        title = tab?.title;
        sourceType = 'page';
        break;
      }
    }

    if (!targetUrl) return;

    const validation = validateUrl(targetUrl);
    if (!validation.isValid) {
      console.warn('[BookMyMark] Cannot capture invalid URL:', targetUrl, validation.error);
      return;
    }

    try {
      const res = await ProductionBookmarksService.saveBookmark({
        url: targetUrl,
        title: title || tab?.title,
        sourceType,
        sourcePageUrl,
        faviconUrl: tab?.favIconUrl
      });

      if (res.success) {
        if (res.isPendingOffline) {
          flashActionBadge('⏳', '#D97706'); // Orange waiting badge
        } else {
          flashActionBadge('✓', '#111111'); // Black/white checkmark
        }
      }
    } catch (err) {
      console.error('[BookMyMark] Save failed:', err);
    }
  });

  /**
   * Keyboard Shortcut Command Handler (Alt + Shift + B)
   */
  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'save-current-page') {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        if (!currentTab || !currentTab.url) return;

        const validation = validateUrl(currentTab.url);
        if (!validation.isValid) return;

        const res = await ProductionBookmarksService.saveBookmark({
          url: currentTab.url,
          title: currentTab.title,
          sourceType: 'page',
          faviconUrl: currentTab.favIconUrl
        });

        if (res.success) {
          if (res.isPendingOffline) {
            flashActionBadge('⏳', '#D97706');
          } else {
            flashActionBadge('✓', '#111111');
          }
        }
      } catch (err) {
        console.error('[BookMyMark] Keyboard save error:', err);
      }
    }
  });

  /**
   * Extension Runtime Message Handler for Popup Communication
   */
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const msg = message as ExtensionMessage;
    (async () => {
      try {
        switch (msg.type) {
          case 'AUTH_GET_STATUS': {
            const status = await AuthService.getAuthStatus();
            sendResponse(status);
            break;
          }
          case 'AUTH_SIGN_IN': {
            const result = await AuthService.signInWithGoogle();
            if (result.success) {
              await ProductionBookmarksService.processPendingQueue();
            }
            sendResponse(result);
            break;
          }
          case 'AUTH_SIGN_OUT': {
            const success = await AuthService.signOut();
            sendResponse({ success });
            break;
          }
          case 'BOOKMARK_SAVE': {
            const res = await ProductionBookmarksService.saveBookmark(msg.payload);
            sendResponse(res);
            break;
          }
          case 'BOOKMARK_LIST_RECENT': {
            const list = await ProductionBookmarksService.listRecentBookmarks(msg.payload?.limit || 10);
            sendResponse({ bookmarks: list });
            break;
          }
          case 'PENDING_GET_COUNT': {
            const count = await PendingQueueService.getCount();
            sendResponse({ count });
            break;
          }
          case 'PENDING_PROCESS_ALL': {
            const processed = await ProductionBookmarksService.processPendingQueue();
            sendResponse({ processed });
            break;
          }
          default:
            sendResponse({ error: 'Unknown message type' });
        }
      } catch (err: any) {
        sendResponse({ error: err?.message || 'Internal handler error' });
      }
    })();

    return true; // Keep message channel open for async response
  });

  /**
   * Action Badge Helper
   */
  async function updateBadge() {
    try {
      const pendingCount = await PendingQueueService.getCount();
      if (browser.action?.setBadgeText) {
        if (pendingCount > 0) {
          await browser.action.setBadgeText({ text: String(pendingCount) });
          await browser.action.setBadgeBackgroundColor({ color: '#D97706' });
        } else {
          await browser.action.setBadgeText({ text: '' });
        }
      }
    } catch {}
  }

  async function flashActionBadge(text: string, color: string = '#111111') {
    try {
      if (browser.action?.setBadgeText) {
        await browser.action.setBadgeText({ text });
        await browser.action.setBadgeBackgroundColor({ color });

        setTimeout(() => {
          updateBadge();
        }, 1800);
      }
    } catch {}
  }
});
