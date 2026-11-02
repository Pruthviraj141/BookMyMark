# BookMyMark — Browser Extension (Phase 1)
> Smart bookmark companion for Google Chrome, Brave, and Mozilla Firefox. Built with WXT, React 19, TypeScript, and Tailwind CSS.

---

## 1. Overview & Architecture

BookMyMark Browser Extension provides frictionless one-click bookmarking across desktop web browsers. It is architected as an isolated, cross-browser extension adhering strictly to production safety guardrails.

### Highlights
- **Context Menus**: Right-click to save links, the current page, or containing video pages.
- **Keyboard Shortcut**: `Alt + Shift + B` instantly captures the active tab.
- **Minimalist React Popup**: Displays active page metadata, domain badge, quick save button, and recent captures feed matching the BookMyMark monochrome visual language.
- **Local Capture Store**: Safely records the latest 20 drafts in `browser.storage.local` with automatic duplicate deduplication and badge count feedback.
- **Phase 1 Isolation**: Operates 100% locally in preview mode. No cloud credentials, no Supabase keys, no backend dependencies, and zero network calls.

---

## 2. Supported Browsers & Manifest Versions

| Browser | Manifest Version | Engine / Compatibility | Output Directory |
| :--- | :--- | :--- | :--- |
| **Google Chrome** | **Manifest V3** | Chromium MV3 Service Worker | `.output/chrome-mv3/` |
| **Brave Browser** | **Manifest V3** | Uses the Chromium MV3 build | `.output/chrome-mv3/` |
| **Mozilla Firefox** | **Manifest V2** | Background Event Scripts & Gecko ID | `.output/firefox-mv2/` |

> [!NOTE]
> Firefox utilizes a dedicated Manifest V2 target via WXT to ensure full event-page lifecycle stability across all desktop Firefox distributions without service worker suspension bugs.

---

## 3. Installation Guide

### Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** on (top-right corner).
3. Click **Load unpacked** (top-left).
4. Select the build directory:
   ```
   bookmymark/browser-extension/.output/chrome-mv3/
   ```
5. Click the puzzle icon in Chrome's toolbar and **Pin** BookMyMark.

### Brave Browser
1. Open Brave and navigate to `brave://extensions/`.
2. Enable **Developer mode** toggle.
3. Click **Load unpacked**.
4. Select the build directory:
   ```
   bookmymark/browser-extension/.output/chrome-mv3/
   ```
5. Pin BookMyMark to the toolbar.

### Mozilla Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Navigate to:
   ```
   bookmymark/browser-extension/.output/firefox-mv2/manifest.json
   ```
4. Select `manifest.json`. The BookMyMark extension will appear in your toolbar.

---

## 4. Development & Build Commands

All commands must be executed within `browser-extension/`:

```bash
# Install dependencies
npm install

# Run TypeScript checks
npm run compile

# Run Vitest unit tests (21 tests)
npm test

# Development mode with live reload
npm run dev:chrome     # Chrome / Brave
npm run dev:firefox    # Firefox

# Production builds (Unpacked directories)
npm run build:chrome   # Generates .output/chrome-mv3/
npm run build:firefox  # Generates .output/firefox-mv2/
npm run build:all      # Builds both targets

# Production packages (.zip archives)
npm run zip:chrome     # Generates .output/bookmymark-extension-1.0.0-chrome.zip
npm run zip:firefox    # Generates .output/bookmymark-extension-1.0.0-firefox.zip
npm run zip:all        # Generates all distributable archives
```

---

## 5. Keyboard Shortcut Configuration

- **Default Shortcut**: `Alt + Shift + B` (Windows/Linux/Mac)
- **Action**: Immediately captures the current active tab to local storage and updates the toolbar badge.
- **Customizing Shortcuts**:
  - **Chrome / Brave**: Open `chrome://extensions/shortcuts` and rebind BookMyMark.
  - **Firefox**: Open `about:addons` ➔ Click the gear icon ➔ **Manage Extension Shortcuts**.

---

## 6. Permissions Rationale

The extension strictly requests the minimal permissions required for Phase 1:
- `contextMenus`: Needed to register the "Save link to BookMyMark" and "Save this page to BookMyMark" right-click options.
- `activeTab`: Needed to read the current tab's URL and title only when the user explicitly clicks the extension icon or uses the keyboard shortcut. No background browsing history is monitored.
- `storage`: Needed to persist the user session and local pending offline queue in `browser.storage.local`.
- `identity`: Needed for Google OAuth flow via `browser.identity.launchWebAuthFlow()`.

---

## 7. Phase 2 Production Cloud Architecture

- **Supabase Authentication**: Connects using the same Supabase project (`https://ycaenlslaoiqnyopmytx.supabase.co`) and public publishable key as Android.
- **Single Source of Truth**: User records, bookmarks, and RLS policies are shared directly between desktop and mobile.
- **Zero-Secret Client**: No `SUPABASE_SECRET_KEY` or backend secrets are packaged. All operations execute strictly under the authenticated user's RLS session (`auth.uid() = user_id`).
- **Production Save Pipeline**:
  1. URL is normalized (strips tracking parameters `utm_*`, `fbclid`, etc., and trailing slash).
  2. Direct INSERT to Supabase `public.bookmarks` table.
  3. Unique constraint `bookmarks_user_normalized_url_unique` prevents duplicate bookmarks.
  4. Cloudflare Worker AI Enrichment endpoint is triggered (`POST /api/bookmarks/:id/enrich`).
  5. Supabase Realtime immediately broadcasts the event to the Android mobile app, which prepends the bookmark and updates its local SQLite cache.

### Supabase Redirect URL Configuration
In the Supabase Dashboard under **Authentication ➔ URL Configuration ➔ Redirect URLs**, add the extension redirect URI for each browser:
- **Chrome / Brave**: `https://<chrome-extension-id>.chromiumapp.org/`
- **Firefox**: `https://extension%40bookmymark.app.extensions.allizom.org/`

---

## 8. Manual Testing Verification Matrix

| Scenario | Steps to Test | Expected Behavior |
| :--- | :--- | :--- |
| **Google Sign-In** | Open popup ➔ click "Sign in with Google" | Completes OAuth modal via `launchWebAuthFlow` and displays user profile pill. |
| **Cloud Save (Page)** | Open any website ➔ Click "Save this page" | Inserts to Supabase PostgreSQL; button indicates "Saved to BookMyMark ✓". |
| **Cloud Save (Link)** | Right-click any link on a page ➔ "Save link to BookMyMark" | Saves the exact target URL directly to Supabase production. Badge flashes `✓`. |
| **Android Realtime Sync** | Save from desktop while Android app is open | Bookmark appears on Android within milliseconds without manual refresh. |
| **Duplicate Prevention** | Save the same page or link twice | Detects unique constraint (`23505`) and displays "Already saved in BookMyMark". |
| **Offline / Signed-Out** | Save a bookmark while logged out | Queued in local pending storage. Badge shows `⏳`. Syncs automatically upon sign-in. |
| **Library List** | Open popup while logged in | Displays the authenticated user's latest bookmarks fetched directly from Supabase. |
| **Sign Out** | Click sign-out icon in popup header | Clears local session token and returns to signed-out preview state. |
