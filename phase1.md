# BOOKMYMARK — PHASE 1
# BROWSER EXTENSION FOUNDATION
## Chrome + Firefox + Brave | WXT + React + TypeScript

You are implementing Phase 1 of the BookMyMark desktop expansion.

The Phase 0 architecture audit and production safety guardrails have already been completed.

Your task is to create a polished, functional, cross-browser BookMyMark extension with a working popup, right-click saving, keyboard shortcut, local capture preview and browser-specific builds.

This must be a real implementation, not a mockup or a demonstration-only UI.

However, this phase must remain completely isolated from the existing production Android application, production backend and production database.

Read the root `AGENTS.md` before doing anything. Follow every instruction in it.

---

# 1. ABSOLUTE PRODUCTION PROTECTION

The existing Android application is in production and is working correctly.

**DO NOT MODIFY IT.**

Protected areas include:

- `frontend/src/`
- `frontend/android/`
- `frontend/capacitor.config.ts`
- `frontend/public/`
- Existing frontend configuration.
- Existing backend application code.
- Existing database code and migrations.
- Existing Supabase configuration.
- Existing production environment variables.
- Existing application data.

You may inspect the existing frontend in read-only mode to understand the visual design and branding.

You MUST NOT:

- Modify any mobile screen or component.
- Change existing navigation or UI/UX.
- Change existing bookmark behaviour.
- Modify SQLite or its synchronisation.
- Change the Hono backend.
- Change the Cloudflare Worker.
- Change Groq classification or metadata extraction.
- Add or execute database migrations.
- Modify, delete, reset or migrate existing bookmarks.
- Change production credentials.
- Deploy anything.

Do not touch the existing application's package configuration or build scripts.

If an implementation requires any protected change, STOP and report why. Do not make that change.

Before and after implementation, compare Git status and verify that no new modifications have occurred in protected areas. Preserve any pre-existing user changes.

# 2. PHASE 1 SCOPE

Create the extension inside:

`browser-extension/`

Do not build the website in this phase.

Do not implement:

- Supabase authentication.
- Google OAuth.
- Production bookmark creation.
- AI classification.
- Cloud metadata extraction.
- Cloud synchronisation.
- Website-specific Share-dialog injections.
- YouTube, X or Reddit content scripts.

Those belong to subsequent phases.

Phase 1 must deliver:

1. Cross-browser extension foundation.
2. Professional React popup.
3. Right-click context menus.
4. Current-page saving action.
5. Keyboard shortcut.
6. Temporary local capture queue.
7. Browser-specific builds.
8. Proper testing and documentation.

# 3. FRAMEWORK AND PROJECT ARCHITECTURE

Use:

- WXT as the browser extension framework.
- React and TypeScript.
- Vite through WXT.
- Tailwind CSS, matching the existing frontend's Tailwind major version where practical.
- The official WXT React module: `@wxt-dev/module-react`.
- WXT's cross-browser API abstraction.

Research current official WXT documentation before implementation.

Official documentation:
https://wxt.dev/

Use the `browser` API abstraction from `wxt/browser` instead of directly mixing `chrome.*` and `browser.*` throughout the application.

Keep the architecture simple and maintainable.

Suggested structure:

```text
browser-extension/
├── entrypoints/
│   ├── background.ts
│   └── popup/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       └── popup.css
├── public/
│   └── icons/
├── src/
│   ├── components/
│   ├── services/
│   │   ├── capture.service.ts
│   │   ├── capture-storage.service.ts
│   │   └── browser-api.service.ts
│   ├── types/
│   ├── utils/
│   │   ├── url-validator.ts
│   │   └── platform-detector.ts
│   └── styles/
│       └── tokens.css
├── tests/
├── wxt.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

This is a suggested structure. Improve it where appropriate, but avoid unnecessary abstraction.

Important:

- Use an independent `package.json` and lockfile inside `browser-extension/`.
- Do not add dependencies to the root application.
- Do not overwrite an existing `browser-extension/` directory if it already contains work.
- Use the package manager already established for this isolated project.
- Do not use outdated packages or unnecessarily large UI libraries.
- Use compatible, currently maintained dependency versions.

# 4. THREE BROWSER TARGETS

The extension must support:

1. Google Chrome.
2. Mozilla Firefox.
3. Brave.

Use a single maintainable source codebase.

### Chrome

Build the current Chromium-compatible Manifest V3 extension.

### Brave

Use the Chrome/Chromium build.

Do not maintain a separate implementation for Brave unless an actual compatibility issue is discovered.

### Firefox

Generate a separate Firefox-compatible build.

Important technical requirement:

WXT's current documentation has browser-specific manifest defaults. Its documented default is Manifest V3 for Chromium browsers and Manifest V2 for Firefox.

Do not blindly force identical manifest configuration on every browser.

Inspect the installed WXT version and current Firefox extension API compatibility.

Firefox does not support `background.service_worker` in the same way as Chrome. If attempting an MV3 Firefox build, verify its background event-page compatibility, including the necessary `background.scripts` fallback. If this cannot be generated and verified reliably, use WXT's supported Firefox target and clearly document the resulting manifest version.

Do not compromise browser functionality simply to make the manifest files identical.

Build scripts should provide:

```bash
npm run dev:chrome
npm run dev:firefox

npm run build:chrome
npm run build:firefox

npm run build:all
```

Brave must use the generated Chrome build.

Generate unpacked extension directories and, where supported, distributable ZIP files.

Determine the actual WXT output paths from the generated build. Document them accurately.

# 5. RIGHT-CLICK FUNCTIONALITY — THE CORE FEATURE

This is the most important part of Phase 1.

The BookMyMark context-menu actions must work reliably across the three browsers.

Use the official browser context-menu APIs through WXT.

Required manifest permission:

- `contextMenus` (using the supported Firefox alias where appropriate).

Create the following actions.

## A. Right-click on a link

When the user right-clicks any hyperlink:

Display:

**Save link to BookMyMark**

The saved target must be the exact link the user clicked.

Use the context-menu event's actual `linkUrl`.

Examples:

- YouTube video link.
- X post link.
- Reddit post link.
- Instagram post link.
- An ordinary website hyperlink.
- Any other HTTP or HTTPS link.

Do not mistakenly save the page the user is currently visiting when they intended to save the clicked link.

## B. Right-click on a normal webpage

Display:

**Save this page to BookMyMark**

Save the current page URL.

Use the context-menu event's page URL or the associated tab URL as an appropriate fallback.

Do not save the extension's own popup URL.

## C. Right-click on an HTML video

Where the browser exposes the native video context:

Display:

**Save video page to BookMyMark**

For this phase, save the containing webpage URL, not an arbitrary media stream URL.

This is important because video sources can be temporary, signed, or blob URLs.

Do not claim that this automatically integrates into YouTube's own custom player context menu. Website-specific integrations are a future phase.

## D. Correct context handling

Use the correct context-menu event information:

- `linkUrl` for hyperlinks.
- `pageUrl` or tab URL for webpage captures.
- Tab title where available.
- Current domain for display.

Never mix the captured target URL with the source page URL.

If the target URL is invalid or unavailable, display a clear error instead of silently saving something else.

## E. Context-menu quality

Keep the browser menu clean.

Avoid creating multiple unnecessary BookMyMark entries for one action.

Use stable context-menu IDs.

Register menus safely during installation/update lifecycle. Handle duplicate registration and browser API errors correctly.

Ensure the event listeners are registered synchronously in the background entrypoint so they survive background suspension and restart.

Do not rely on in-memory variables for persisted data.

# 6. EXTENSION POPUP — PREMIUM BOOKMYMARK DESIGN

The popup must feel like a natural desktop companion to the existing Android application.

Inspect the current application design in read-only mode.

Study:

- Existing BookMyMark logo.
- Brand typography.
- Monochrome colour palette.
- Light and dark themes.
- Spacing.
- Button styles.
- Borders.
- Icon style.
- Visual hierarchy.

Reproduce the visual language using independent extension components and styles.

You may copy required static branding assets into `browser-extension/public/`. Never modify their original production files.

### Design requirements

- Premium minimalist design.
- Black-and-white visual identity.
- Professional typography.
- Clear contrast.
- Clean spacing.
- No purple or green accents.
- No excessive rounded cards.
- No unnecessary shadows or gradients.
- No AI-generated visual aesthetic.
- No tiny or unreadable labels.
- Responsive behaviour within the browser popup dimensions.

### Popup layout

Create the following layout.

**Header**

- BookMyMark logo.
- BookMyMark wordmark.
- Small clean status indicator.

**Current page section**

Show:

- Current page favicon where available.
- Page title.
- Domain.
- Shortened URL.
- Main button: `Save this page`.

**Recent captures**

Show the latest locally captured links with:

- Title or fallback URL.
- Platform label, when detectable.
- Capture type.
- Time captured.
- Clear or remove action.

**Status notice**

Show this message prominently but unobtrusively:

"Preview mode: captures are stored only in this browser. Account sync will be enabled in Phase 2."

Do not display a fake signed-in account.

Do not show fake AI tags or summaries.

Do not pretend that anything has reached Supabase.

# 7. KEYBOARD SHORTCUT

Implement a browser-native keyboard shortcut using the official `commands` API.

Suggested shortcut:

`Alt + Shift + B`

Command description:

`Save current page to BookMyMark`

When triggered:

1. Identify the active tab.
2. Validate its URL.
3. Capture the current page.
4. Add the capture to local extension storage.
5. Update the local capture count.

The shortcut must be configurable through the browser's extension shortcut management.

Do not implement custom key listeners across every webpage.

If the browser rejects or conflicts with the default shortcut, document how to configure it manually.

# 8. PHASE 1 LOCAL CAPTURE STORAGE

We need to test the complete capture interaction before connecting production accounts.

Use browser extension local storage:

`browser.storage.local`

This storage is separate from the Android SQLite database and Supabase.

Create an independent Phase 1 type, for example:

```ts
type LocalCaptureDraft = {
  id: string;
  url: string;
  title: string;
  sourceType: "page" | "link" | "video";
  sourcePageUrl?: string;
  platform?: string;
  capturedAt: number;
};
```

Adapt the shape if required.

This must NOT be represented as the production Supabase bookmark model.

### Storage behaviour

- Store locally only.
- Maintain the latest 20 captures.
- Prevent duplicate captures of the exact same URL.
- Keep timestamps.
- Allow deletion of individual captures.
- Allow clearing all Phase 1 captures.
- Update the popup immediately after storage changes.
- Handle corrupted or unavailable local storage gracefully.

Never access or modify Android SQLite.

Never access or modify Supabase.

Never call the backend.

Do not create a second cloud database.

### User-facing feedback

When a context-menu or keyboard action succeeds, update the extension's action badge with the local capture count where the browser supports it.

When opening the popup, show the latest captured item.

Do not request notification permission just to show a success message.

Always make clear that Phase 1 captures are local previews and are not synced to the account yet.

# 9. URL VALIDATION AND PLATFORM DETECTION

Implement small, testable utilities.

### URL validation

Accept only valid HTTP and HTTPS URLs.

Reject unsupported schemes such as:

- `javascript:`
- `data:`
- `blob:`
- `chrome:`
- `brave:`
- `about:`
- `moz-extension:`
- `chrome-extension:`
- `file:`
- `view-source:`

Handle invalid input without crashing.

Do not perform network requests for metadata in this phase.

Do not remove meaningful query parameters or fragments from URLs.

Preserve the exact target URL.

### Platform detection

Detect common platforms using the hostname:

- YouTube and youtu.be.
- X and twitter.com.
- Reddit.
- Instagram.
- Other websites as `Website`.

Platform detection is only for a visual label.

Do not rewrite URLs or pretend that website-specific extraction has been implemented.

For a link clicked on X or Reddit, save the exact link.

For right-clicking a background or non-link area of an X or Reddit page, save the current page. The exact post-level integration belongs to a later phase.

# 10. MINIMAL PERMISSIONS AND SECURITY

The extension must request only the permissions genuinely required for Phase 1.

Start with:

- `contextMenus`
- `activeTab`
- `storage`

Declare `commands` in the manifest as required by the API.

Do not request broad access to every website.

Avoid:

- `<all_urls>`
- `tabs` permission unless a verified API requirement makes it necessary.
- `scripting` unless genuinely necessary.
- `notifications`
- `cookies`
- `history`
- `webRequest`
- `downloads`
- `identity`
- Any unnecessary host permission.

No content scripts are required for the universal Phase 1 context-menu and popup foundation.

Do not scrape page contents.

Do not monitor browsing history.

Do not collect data in the background.

Do not transmit captured URLs externally.

No Supabase keys, Groq keys, service-role keys, API secrets or backend credentials belong in this extension.

# 11. CODE QUALITY AND ERROR HANDLING

Implement clear separation between:

- Browser event handling.
- Context-menu target extraction.
- URL validation.
- Platform detection.
- Local capture persistence.
- Popup display.

Avoid putting all logic in `background.ts` or `App.tsx`.

Handle:

- Missing active tab.
- Restricted browser pages.
- Invalid URL.
- Missing page title.
- Missing favicon.
- Duplicate capture.
- Storage errors.
- Extension service-worker restarts.
- Context-menu registration failures.
- Browser API differences.

No unhandled promise rejections.

No hardcoded credentials.

No fake success messages.

Add comments only where the behaviour genuinely needs explanation.

Use strict TypeScript types.

# 12. TESTING — REQUIRED BEFORE HANDOVER

Do not consider this phase complete just because WXT builds successfully.

### A. Unit testing

Test:

1. HTTP and HTTPS URL acceptance.
2. Invalid URL rejection.
3. Unsupported scheme rejection.
4. Exact link target extraction.
5. Current page target extraction.
6. Video page target extraction.
7. Platform detection.
8. Duplicate handling.
9. Capture storage limit.
10. Removing one capture.
11. Clearing local captures.
12. Missing title and favicon.
13. Storage failure handling.

### B. Build testing

Build both browser targets.

Check:

- Chrome Manifest V3 output.
- Brave compatibility using Chrome output.
- Firefox-specific output.
- Manifest validity.
- Correct popup registration.
- Correct background registration.
- Context-menu permissions.
- Storage permissions.
- Shortcut configuration.
- Icon assets.
- No missing files.
- No unexpected host permissions.

### C. Manual browser testing

Prepare exact installation instructions.

**Chrome**

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Select Load unpacked.
4. Select the generated Chrome build directory.
5. Pin BookMyMark.

**Brave**

1. Open `brave://extensions`.
2. Enable Developer mode.
3. Select Load unpacked.
4. Select the generated Chrome build directory.
5. Pin BookMyMark.

**Firefox**

1. Open `about:debugging#/runtime/this-firefox`.
2. Select Load Temporary Add-on.
3. Select the generated Firefox manifest.
4. Verify the extension loads.

### D. Functional testing checklist

Test the following scenarios independently in all three browsers:

| Scenario | Expected result |
|---|---|
| Right-click normal page | Save this page option appears |
| Right-click hyperlink | Save link option appears |
| Click Save link | Exact link is captured |
| Right-click YouTube link | Exact video link is captured |
| Right-click X post link | Exact post link is captured |
| Right-click Reddit post link | Exact post link is captured |
| Click extension icon | Popup appears |
| Click Save this page | Current URL is captured |
| Use keyboard shortcut | Current page is captured |
| Capture duplicate URL | Duplicate handled correctly |
| Open popup after capture | Recent item appears |
| Delete local capture | Item disappears |
| Clear all | Local preview queue is cleared |
| Open unsupported browser page | Clear, safe error is shown |

Also test a direct HTML video element where possible.

Remember: some websites intercept right-click menus with their own custom interfaces. Do not claim that Phase 1 inserts BookMyMark into their own Share or custom post menus. That is Phase 3.

### E. Performance

Keep the extension lightweight.

- Do not inject scripts on every webpage.
- Do not run background polling.
- Do not scan the DOM.
- Do not make network requests.
- Do not bundle unnecessary UI libraries.
- Avoid excessive popup rendering or storage operations.

# 13. DOCUMENTATION

Create:

`browser-extension/README.md`

Include:

- Architecture overview.
- Supported browsers.
- Manifest version used per browser.
- Installation instructions.
- Development commands.
- Build commands.
- Output directories.
- Keyboard shortcut instructions.
- Permission explanation.
- Current Phase 1 limitations.
- How local preview storage works.
- How to test the extension manually.

Explicitly state that account authentication and cloud sync have not yet been connected.

# 14. FINAL VERIFICATION OF PRODUCTION SAFETY

Before finishing:

1. Compare the initial and final Git status.
2. Verify that no new changes exist inside protected production directories.
3. Verify that the root application's package files have not been modified.
4. Verify that no backend or Supabase files have been changed.
5. Verify that no production data was accessed or modified.
6. Verify that no production deployment occurred.

If any protected file was accidentally modified, stop and report it. Do not silently reset or overwrite it.

# 15. PHASE 1 COMPLETION CONDITIONS

Phase 1 is complete only when:

- The extension project is created.
- The React popup is working.
- Right-click page capture works.
- Right-click link capture works.
- Native video context capture is supported where exposed.
- Keyboard shortcut works.
- Local preview storage works.
- Duplicate and invalid URLs are handled.
- Chrome build succeeds.
- Firefox build succeeds.
- Brave uses the Chrome build.
- Unit tests pass.
- Generated manifests have been inspected.
- Installation instructions are complete.
- Production application protection is verified.

Do not claim that all three browsers have passed live testing if you only performed builds.

Clearly separate:
- Automated tests completed.
- Browser builds completed.
- Manual tests actually performed.
- Manual tests still requiring my device.

# 16. STOP AFTER PHASE 1

Do not begin Phase 2 automatically.

Do not implement authentication.

Do not connect Supabase.

Do not upload anything to production.

Do not change backend bookmark routes.

Do not introduce YouTube, X or Reddit custom Share-button integrations yet.

Once Phase 1 is finished:

1. Give me a concise summary.
2. Show the exact project structure created.
3. Show the build results for Chrome and Firefox.
4. Explain how to load the Chrome build in Brave.
5. Provide the manual testing checklist.
6. List any limitations or unverified behaviour.
7. Confirm the protected production application files remained untouched.
8. Stop and wait for my approval.

**The final objective:** A polished, lightweight BookMyMark browser extension that feels like a natural companion to the existing Android application, with reliable right-click saving, a beautiful popup, and a clean foundation for account synchronisation in Phase 2.

Build it properly. Validate it honestly. Protect production. One phase at a time.