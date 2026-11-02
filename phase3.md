# BOOKMYMARK — DESKTOP LIBRARY UPGRADE
# COMPLETE BOOKMARK MANAGER INSIDE THE EXISTING BROWSER EXTENSION
## Chrome + Brave + Firefox | WXT + React + TypeScript

You are now upgrading the existing, fully working BookMyMark browser extension.

This is a major product experience upgrade, not a new application or backend project.

The extension already works correctly:

- Google authentication works.
- Supabase authentication works.
- Bookmark saving works.
- Right-click saving works.
- Chrome, Firefox and Brave builds exist.
- Android-to-extension synchronisation works.
- Extension-to-Android synchronisation works.
- Existing bookmarks are visible in the extension.
- Existing production backend and database are functioning correctly.

**Do not disturb this working system.**

Our goal is to make the extension a complete desktop version of BookMyMark, with the same features and visual identity as the Android application, intelligently adapted to a desktop browser.

We do not need a separate website.

We do not need Cloudflare Pages.

We do not need another backend.

We do not need another database.

We do not need another authentication system.

We simply need to make the existing extension much more useful, beautiful and complete.

Read the root `AGENTS.md` before starting. Follow all existing production safety rules.

---

# 1. THE MOST IMPORTANT ARCHITECTURAL DECISION

## Build a full-page library inside the browser extension

Keep the existing extension popup.

It already performs its current saving and quick-access functions correctly.

Do not replace its working behaviour.

Add one clear action:

**Open Library**

When clicked, this opens a new browser tab containing the complete BookMyMark desktop library.

This must be an actual browser extension page.

It must not be a public website.

### Recommended technical implementation

Research the current installed WXT documentation.

Use WXT's supported unlisted HTML entrypoint.

For example, an implementation may use:

`entrypoints/library/index.html`

The generated page can be opened using:

```ts
const url = browser.runtime.getURL('/library.html');

await browser.tabs.create({ url });
```

Verify the actual generated output path for the installed WXT version.

Use the existing browser abstraction and established project conventions.

Do not create a separate hosted frontend.

Do not introduce a Chrome side panel for this feature.

Do not introduce a Firefox sidebar.

Chrome's `sidePanel` and Firefox's `sidebarAction` have different APIs and would add unnecessary cross-browser complexity.

A regular extension-owned tab provides the complete desktop workspace consistently across Chrome, Brave and Firefox.

Documentation:

https://wxt.dev/guide/essentials/entrypoints

https://developer.chrome.com/docs/extensions/reference/api/tabs

https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities

---

# 2. ABSOLUTE PRODUCTION PROTECTION

The production Android application is working correctly.

**Do not modify the Android application under any circumstances.**

The following remain protected:

- `frontend/src/`
- `frontend/android/`
- `frontend/capacitor.config.ts`
- Existing mobile UI and UX.
- Existing mobile components.
- Existing application business logic.
- Existing SQLite implementation.
- Existing backend services.
- Existing Cloudflare Worker.
- Existing Supabase schema and migrations.
- Existing RLS policies.
- Existing production bookmark records.
- Existing AI classification pipeline.
- Existing extension authentication and bookmark-saving mechanisms.

The browser extension UI is the authorised scope of this task.

You may modify its:

- React presentation components.
- Popup presentation, only where needed to add the library entry point.
- New extension-owned dashboard page.
- Extension-local styles.
- Extension-local navigation.
- Extension-local UI utilities.
- Extension manifest only where strictly necessary to register the new page.

However, preserve its existing background, authentication, saving, messaging and Realtime logic.

Do not rewrite working functionality to make the new interface fit.

Do not modify the Cloudflare Worker.

Do not deploy any backend changes.

Do not change database structures.

Do not create migrations.

Do not update or delete existing bookmarks.

Do not change any production environment variables.

If the requested interface requires changing a protected production service, STOP and explain the exact problem.

### Before editing

Inspect Git status.

Record existing changes.

Preserve all user work.

Take screenshots or otherwise record the existing extension popup and current behaviour.

Run existing checks before making changes where possible.

The final diff must clearly demonstrate that production app and backend files remained untouched.

---

# 3. FIRST TASK: STUDY THE EXISTING ANDROID EXPERIENCE

The mobile application is our product reference.

Do not design a completely new BookMyMark experience using your imagination.

Inspect the existing Android application's source in READ-ONLY mode.

Study the following:

- Home screen.
- Bookmark cards.
- Platform filters.
- Categories screen.
- Search screen.
- Favorites screen.
- Bookmark detail.
- Summary presentation.
- Tags.
- Preview images.
- Theme behaviour.
- Navigation.
- Account interactions.
- Existing empty states.
- Loading behaviour.
- Available bookmark actions.

Create an internal feature inventory.

Determine exactly which features and operations work in the mobile app.

For each one, identify:

1. How it looks.
2. What data it displays.
3. How it interacts.
4. Which existing service provides its data.
5. Which existing user action or API handles it.

Use this inventory as the acceptance checklist for the desktop experience.

**Do not invent features that the actual mobile application does not have.**

Preserve its familiar interactions and visual identity.

The objective is feature parity, not feature inflation.

# 4. EXTENSION ARCHITECTURE — KEEP IT SIMPLE

Inspect the completed extension project.

Identify its actual:

- WXT version.
- React version.
- TypeScript configuration.
- Tailwind version.
- Popup implementation.
- Authentication service.
- Supabase client.
- Bookmark repository/services.
- Realtime subscription.
- Browser message handling.
- Current theme implementation.
- Existing UI components.

Reuse the actual implementation.

Do not create an independent Supabase client with a different configuration.

Do not introduce another authentication flow.

Do not duplicate database queries and bookmark business logic.

Do not create a second Realtime service.

The new dashboard should consume the existing proven extension service layer.

If an existing UI component can be reused safely without altering production app files, reuse it.

Otherwise reproduce its visual and behavioural design in extension-local components.

Never move or rename existing mobile components just to share them.

Suggested structure:

```text
browser-extension/
├── entrypoints/
│   ├── background.ts
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   └── library/
│       ├── index.html
│       └── main.tsx
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── bookmarks/
│   │   ├── categories/
│   │   ├── search/
│   │   └── detail/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── CategoriesScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   └── FavoritesScreen.tsx
│   ├── services/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── styles/
└── wxt.config.ts
```

This is a suggested organisation only.

Respect the current project structure wherever it is already clean.

Avoid unnecessary folders, abstraction layers and additional dependencies.

Do not create a complicated routing framework.

A lightweight router or small state-driven screen navigator is sufficient.

# 5. DESIGN DIRECTION — SAME BOOKMYMARK, BETTER DESKTOP EXPERIENCE

This is the highest-priority creative requirement.

The extension should look like the existing Android BookMyMark application, but optimised for a desktop screen.

Do not create an entirely different design system.

### Brand identity

- Product name: BookMyMark.
- Existing geometric logo.
- Existing wordmark.
- Existing monochrome colours.
- Existing typography.
- Existing icon style.

Do not display SAVR in the frontend.

### Colour system

Strict monochrome design.

Light theme:

- White.
- Warm off-white where already used.
- Neutral grey.
- Dark text.
- Subtle borders.

Dark theme:

- Near-black.
- Charcoal.
- Neutral greys.
- White text.
- Subtle separators.

Do not introduce:

- Purple.
- Green.
- Bright blue.
- Neon accents.
- Colourful gradients.
- Glass effects.
- AI sparkle effects.

### Typography

Text readability is extremely important.

Use:

- Proper font hierarchy.
- Comfortable font sizes.
- Correct line-height.
- Balanced paragraph width.
- Readable metadata.
- Consistent title weights.
- Good text contrast.

No tiny labels.

No compressed typography.

No arbitrary font-size changes between cards.

No overflowing titles.

### General visual quality

The interface should feel like a carefully designed premium product.

Use:

- Strong composition.
- Consistent alignment.
- Comfortable whitespace.
- Clean borders.
- Carefully sized cards.
- Subtle hover states.
- Fast interactions.
- Restrained transitions.

Avoid excessive rounded corners and heavy shadows.

Do not add animations just to make the interface look complicated.

Every component should have a clear purpose.

---

# 6. MAIN DESKTOP LAYOUT

The full library should open as a dedicated extension tab.

For a wide browser viewport, use a clean desktop workspace:

- A persistent left navigation sidebar.
- A clearly defined main content area.
- A compact header and toolbar.
- Responsive bookmark cards.
- An appropriate detail panel.

The layout must make good use of available desktop width.

Do not stretch mobile screens to fill a desktop window.

Do not make everything excessively wide.

### Sidebar

Show only the main destinations:

1. Home.
2. Categories.
3. Search.
4. Favorites.

Use the actual BookMyMark icons and visual conventions.

The selected screen must be obvious but understated.

Keep the logo and wordmark at the top.

Place theme and account controls where they feel natural.

Do not add unnecessary destinations.

No separate Settings section unless one already exists and is genuinely required.

### Header

Keep the header compact.

Show the current screen title and contextually useful controls.

For Home, place platform filters beneath or alongside the header in a consistent, uncluttered layout.

For Search, show the prominent search input.

For Categories, show the category heading and relevant controls.

For Favorites, show the appropriate collection title.

Do not repeat the same navigation in multiple locations unnecessarily.

# 7. HOME SCREEN — EXACTLY FOLLOW THE EXISTING PRODUCT DECISIONS

Home is the primary library screen.

Preserve the familiar Home experience from Android.

### Platform filters

Show:

- All.
- Only platforms that actually have saved bookmarks.

Examples:

- Instagram.
- YouTube.
- X.
- Reddit.

Derive platform options from the authenticated user's actual bookmark data.

Never hardcode platforms that do not have saved items.

When selecting a platform, show only its bookmarks.

### Important: remove category clutter from Home

Do not put a category-chip row below the platform filters.

No additional Technology, AI, Entertainment or Motivation chips on Home.

Categories have their own dedicated screen.

The Home screen should feel clean and focused.

### Bookmark feed

Preserve the existing bookmark card design.

Show actual saved bookmarks, including their available:

- Preview image.
- Title.
- Summary.
- Platform.
- Tags.
- Other fields supported by the mobile application.

Do not fabricate missing metadata.

Use the existing dynamic image-preview mechanism.

Keep image previews display-only.

Do not store images or new preview URLs.

### Desktop grid

Adapt the existing card layout to the wider browser viewport.

Use responsive column sizing.

Suggested behaviour:

- Narrow extension page: one or two columns.
- Standard desktop: two or three columns.
- Wide desktop: three or four columns, depending on card width and actual content.

Preserve the existing masonry/feed visual character where practical.

Use the existing layout implementation where it is reliable.

Do not add a heavy masonry dependency.

Use stable record IDs.

Avoid unstable card positioning and layout shifts.

Do not compress bookmark content to fit too many columns.

Prioritise readability.

---

# 8. CATEGORIES — A SEPARATE FIRST-CLASS SCREEN

Create a dedicated Categories screen.

This was an intentional product decision.

The category interface should feel spacious, visual and easy to explore.

Use large category tiles.

The default visual layout should preserve the agreed two-column category arrangement on normal desktop widths.

Adapt sensibly for narrower viewports.

Each tile should show:

- Category name.
- Number of saved bookmarks.
- A suitable visual preview from an existing bookmark, only when available.
- A clean hover/selection state.

### Dynamic categories

Categories must come from real bookmark data.

Do not hardcode a catalogue of empty categories.

Examples of actual possible categories include:

- Technology.
- AI & Science.
- Entertainment.
- Movies.
- Motivation.
- Knowledge.

But only show categories that actually exist in the user's saved data and the existing category model.

When the existing AI classification process generates a new category, it should automatically become available through the current data.

Do not introduce a category management database.

Do not add new category columns.

Do not add a second classification pipeline.

Clicking a category opens its relevant bookmarks.

Provide a clean empty state only when the user genuinely has no categories.

---

# 9. SEARCH — FAST, SIMPLE AND USEFUL

Create a dedicated Search screen matching the Android experience.

The search interface should be immediately understandable.

Requirements:

- Prominent search input.
- Search icon.
- Clear input button.
- Instant or suitably responsive results.
- Existing search behaviour and supported fields.
- Relevant loading state.
- Proper no-results state.
- Search results using the same bookmark cards.
- Keyboard support.

Search only the authenticated user's own saved bookmarks.

Reuse the actual existing search service and logic.

Do not introduce:

- A new search engine.
- A new external search API.
- A database migration.
- A new full-text index.
- A second backend search endpoint.

If the existing application searches title, URL, description, summary, tags or other fields, maintain that same supported behaviour.

If all current bookmarks are already available in memory, prefer the existing client-side search approach.

If the existing implementation uses server queries or pagination, reuse it.

Do not make unnecessary database requests for every keystroke.

Apply a small debounce only where it genuinely improves performance.

The result list must update correctly when Realtime inserts or changes bookmarks.

---

# 10. FAVORITES

Create a separate Favorites screen.

Use the actual existing favourite field and production bookmark logic.

Do not invent another favourites table.

Do not use local-only favourites.

When a user favourites a bookmark on desktop, the same change should be reflected in the Android app through the current production database and Realtime implementation.

Show the same bookmark cards and detail interactions.

If there are no favourites, show a simple empty state.

---

# 11. BOOKMARK DETAIL EXPERIENCE

When a user opens a bookmark, provide a desktop-optimised detail view.

Use the familiar existing BookMyMark detail design.

### Desktop

Prefer a right-side detail drawer or panel that:

- Opens smoothly.
- Leaves the library context visible where practical.
- Has a clear close action.
- Provides independent content scrolling.
- Keeps the content width readable.
- Does not cover important information unnecessarily.

### Narrow widths

Adapt to a full-width overlay or bottom-sheet-like treatment where appropriate.

Display available information from the real record:

- Preview image.
- Title.
- URL.
- Summary.
- Description.
- Tags.
- Platform.
- Category.
- Created date, if displayed in the mobile app.

Support the actual actions already available in the Android application, such as:

- Open source.
- Favourite/unfavourite.
- Existing supported editing.
- Existing supported deletion.

Do not invent unsupported operations.

Do not change the production data model.

Do not introduce new detail fields or new storage.

Use the actual mobile application's action semantics.

Any destructive action must require clear user confirmation.

After an action, update the displayed state accurately.

---

# 12. KEEP THE EXISTING POPUP WORKING

The current extension popup already works.

Preserve:

- Current quick-save interaction.
- Current page capture.
- Right-click capture.
- Authentication.
- Existing status handling.
- Existing recent bookmarks behaviour.
- Existing save feedback.

Add a small, obvious entry:

**Open Library**

When clicked, open the full extension dashboard in a new tab.

The new dashboard must not replace the existing popup.

Do not change the extension action from a popup to a side panel.

Do not make users perform additional login.

The new page must automatically restore the existing authenticated account session.

The dashboard and popup must use the same working authentication mechanism.

Do not require users to connect their account a second time.

### Opening behaviour

Use the WXT-generated extension page URL.

A simple tab-opening implementation is sufficient.

Do not build an elaborate tab-management system.

If opening the library repeatedly creates duplicate tabs, it is acceptable initially to open a new library tab. Do not add complex cross-browser tab tracking without a genuine usability reason.

---

# 13. AUTHENTICATION AND DATABASE — PRESERVE THE WORKING IMPLEMENTATION

This is a UI expansion, not a new integration project.

The existing Phase 2 implementation is already working.

Reuse its:

- Supabase client.
- Auth session.
- OAuth implementation.
- Token refresh.
- Bookmark fetching.
- Bookmark creation.
- Duplicate handling.
- RLS-compatible access.
- Realtime subscription.
- Error handling.
- Metadata enrichment.
- AI classification flow.

Do not create a different Google sign-in system.

Do not recreate the OAuth callback unnecessarily.

Do not introduce another authentication provider.

Do not alter the working Google OAuth flow.

Do not create a second Supabase client configuration unless a separate extension-page runtime context technically requires one. If it does, use the exact existing configuration and storage/session contract.

No new database.

No new Worker.

No new production routes.

No database migrations.

No RLS changes.

No new AI calls for display.

The extension dashboard must read and render the same production bookmark records as the current popup and Android application.

---

# 14. REALTIME SYNCHRONISATION

This feature is already working.

Preserve it.

The full-page dashboard must remain synchronised with Android and the extension.

Expected behaviour:

- Android saves a bookmark → dashboard displays it.
- Existing popup saves a bookmark → dashboard displays it.
- Dashboard changes a supported bookmark field → Android reflects the change.
- Android changes a supported field → dashboard reflects the update.
- Android changes favourite status → dashboard reflects the update.
- A supported deletion → dashboard removes the correct item.

Reuse the existing Realtime service and actual table/event handling.

Important:

- Do not add polling.
- Do not add 3-second or 5-second timers.
- Do not create a second sync service.
- Do not change the Android subscriber.
- Do not duplicate Realtime subscriptions within the same dashboard.
- Clean up subscriptions when the library page is closed or the relevant lifecycle ends.
- Handle reconnection using the existing implementation.
- Prevent duplicate records from repeated Realtime events.
- Use stable record IDs.

If the current extension service handles Realtime through a background context, preserve that architecture and use its established messaging interface.

If the new page needs its own subscription, reuse the existing subscribe/unsubscribe logic with proper lifecycle cleanup.

Do not maintain a permanent background connection unnecessarily.

---

# 15. REMOVE UNNECESSARY FRONTEND TEXT AND AI-LIKE COPY

This is an important design requirement.

I do not want the application to sound like a generated SaaS dashboard.

Remove unnecessary frontend copy such as:

- "Cloud sync."
- "Your content is always in the cloud."
- "AI-powered knowledge workspace."
- "Your personal intelligence hub."
- "Unlock your productivity."
- "Smart digital ecosystem."
- "Your journey starts here."
- "Experience seamless productivity."
- Any invented promotional text, slogans or repetitive descriptions.

Do not add decorative badges saying:

- AI Powered.
- Cloud Connected.
- Smart Library.
- Intelligent Sync.
- Powered by AI.

Do not show technical backend information to ordinary users.

The user should simply experience a bookmark manager.

### Use natural, direct text

Examples:

- Home.
- Search.
- Categories.
- Favorites.
- All.
- Save.
- Open.
- Edit.
- Remove.
- Saved.
- Saving…
- Already saved.
- Couldn't save.
- Try again.
- No bookmarks yet.
- No results.
- No favorites yet.
- No categories yet.

Do not fill the interface with explanatory paragraphs.

Use headings only where useful.

Do not repeat the same message in different components.

### Important AI distinction

Actual summaries and tags generated for bookmarks are product data and should remain visible when available.

Do not replace actual bookmark summaries with invented marketing text.

Do not generate new descriptions.

Do not make another AI request merely to improve the interface.

The UI should feel human-designed, simple and natural.

---

# 16. IMAGES AND CARD PERFORMANCE

Preserve the existing BookMyMark image architecture.

Images are display-only.

Do not:

- Store image files.
- Persist cover-image URLs.
- Upload covers.
- Add database image columns.
- Add Supabase Storage uploads.
- Create another image service.
- Introduce another image-processing pipeline.

Use existing public preview metadata.

Preserve the existing platform-specific preview behaviour.

For YouTube, use the existing thumbnail construction.

For Instagram and X, reuse the working preview behaviour.

When no image exists, show the same restrained fallback treatment used by the application.

### Performance requirements

- Lazy-load preview images.
- Avoid loading images outside the visible portion of the feed.
- Reuse in-memory preview cache.
- Deduplicate repeated preview requests.
- Prevent image layout shifts.
- Preserve card dimensions during loading.
- Provide graceful fallback when an image fails.
- Do not make a network request for an image on every React render.

Do not add complicated proxy infrastructure.

---

# 17. DESKTOP RESPONSIVENESS AND SCROLLING

This must feel excellent on an actual desktop monitor and still work when the extension page is resized.

Test the following viewport sizes:

- 320 × 700.
- 375 × 812.
- 768 × 1024.
- 1024 × 768.
- 1280 × 800.
- 1440 × 900.
- 1920 × 1080.

### Responsive behaviour

For wide screens:

- Persistent sidebar.
- Multi-column bookmark grid.
- Well-spaced toolbar.
- Readable cards.
- Detail panel when appropriate.

For medium screens:

- Compact sidebar.
- Adjusted grid columns.
- Reduced unnecessary spacing.

For narrow screens:

- Collapsed or compact navigation.
- One or two card columns according to available width.
- Full-width detail view.
- No horizontal overflow.
- Comfortable touch targets.

Do not simply shrink the desktop layout.

### Scrolling

This requires special attention.

- Natural vertical scrolling.
- No nested scroll traps.
- No scroll hijacking.
- No layout jumps.
- No accidental horizontal scrolling.
- Stable bookmark positions.
- Smooth navigation.
- Correct detail-panel scrolling.
- No unnecessary expensive animations.

Use one clear primary scroll container per screen wherever possible.

Do not add a virtualisation library unless actual dataset size and measured performance justify it.

---

# 18. ACCESSIBILITY AND INTERACTION QUALITY

Make the extension usable through:

- Mouse.
- Keyboard.
- Standard browser zoom.
- Screen readers where practical.

Requirements:

- Proper button semantics.
- Meaningful accessible labels.
- Visible focus indicators.
- Keyboard-accessible navigation.
- Escape to close detail panels.
- Correct input focus.
- No colour-only status communication.
- Sufficient text contrast.
- Respect `prefers-reduced-motion`.

Make all interactive elements behave correctly.

Do not create decorative buttons that do nothing.

Do not use clickable generic `div` elements when proper buttons are appropriate.

---

# 19. PERFORMANCE — DO NOT OVERENGINEER

The existing extension is already working.

We need to improve the experience without making the architecture heavier.

Keep:

- Existing data service.
- Existing authentication.
- Existing API contracts.
- Existing Supabase client.
- Existing Realtime implementation.
- Existing browser builds.
- Existing right-click functionality.

Avoid:

- New state-management libraries.
- New backend services.
- Extra API requests.
- New database tables.
- Extra AI models.
- Background polling.
- Heavy animation libraries.
- Unnecessary component abstraction.
- Repeated full-library fetches.
- Multiple Realtime subscriptions.
- Redundant browser permissions.
- Unnecessary host permissions.

Use local state and existing React patterns.

Load screen-specific UI only where appropriate.

Measure actual build output.

Optimise only when a measurable issue is found.

Do not claim arbitrary performance improvements.

---

# 20. CROSS-BROWSER COMPATIBILITY

The full library must work in:

1. Google Chrome.
2. Brave Browser.
3. Mozilla Firefox.

Use the same WXT source code.

Maintain the existing browser-specific build configuration.

Do not modify the stable extension IDs or Firefox Gecko ID.

Do not change OAuth redirect identifiers.

Do not introduce the Chrome-only sidePanel API.

Use the existing browser API abstraction.

Test:

- Popup.
- Open Library action.
- Full library page.
- Authentication.
- Session restoration.
- Bookmark fetching.
- Search.
- Categories.
- Favorites.
- Detail panel.
- Realtime updates.
- Right-click saving.
- Theme persistence.

Build both Chrome and Firefox.

Brave must be tested using the existing Chromium build.

No browser-specific code should be added unless an actual compatibility requirement is established.

---

# 21. TEST THE ACTUAL PRODUCTION EXPERIENCE

Do not rely only on a successful build.

### Step A — Baseline verification

Before changes, verify the existing:

- Google sign-in.
- Current popup.
- Right-click menu.
- Saving.
- Supabase bookmark fetching.
- Realtime updates.
- Android synchronisation.

Do not create test records.

Record which tests passed.

### Step B — New full library

Open the new extension dashboard.

Verify:

- Correct user is authenticated.
- Existing bookmarks load.
- Existing bookmark titles and previews are correct.
- Platform filters are dynamic.
- Home contains no category-chip row.
- Categories screen appears separately.
- Search works.
- Favorites works.
- Bookmark detail works.
- Actions work.
- Theme toggle works.
- Scrolling is smooth.

### Step C — Real synchronisation

Keep Android and the extension connected to the same account.

Test:

1. Save from Android.
2. Observe the new bookmark in the extension dashboard.
3. Change a supported bookmark property from Android.
4. Verify the change in the dashboard.
5. Change a supported property from the dashboard.
6. Verify the change on Android.

Use an intentional existing or newly user-approved bookmark for live tests.

Do not modify arbitrary existing production records.

Do not delete any user's bookmark during QA.

Do not seed fake records.

Do not clear data.

### Step D — Responsive validation

Inspect screenshots at all specified widths.

Check:

- Text alignment.
- Card dimensions.
- Typography.
- Layout consistency.
- Empty states.
- Modal positioning.
- Horizontal overflow.
- Detail panel behaviour.
- Navigation.

### Step E — Performance and stability

Check:

- React console errors.
- Unhandled promise rejections.
- Subscription duplicates.
- Repeated API calls.
- Memory leaks from event listeners.
- Image layout shifts.
- Unnecessary renders.
- Browser service-worker errors.

Ensure that popup operations remain independent of the new dashboard.

---

# 22. FINAL PROTECTION AND REGRESSION CHECK

After implementation, compare Git status with the original status.

Verify:

- No Android files changed.
- No backend files changed.
- No Cloudflare Worker files changed.
- No Supabase migrations changed.
- No database schema changes.
- No production data was bulk-modified.
- No authentication implementation was replaced.
- No existing extension save flow was broken.
- No context-menu functionality was removed.
- Chrome and Firefox builds pass.
- Brave Chromium compatibility remains intact.

Check that the existing extension popup still works exactly as before.

Do not silently revert any existing user changes.

If anything in the protected area changes accidentally, STOP and report it. Do not run destructive Git reset or cleanup commands.

---

# 23. COMPLETION REQUIREMENTS

This task is complete only when:

1. The existing popup remains functional.
2. An Open Library action launches the complete extension-owned dashboard.
3. The dashboard displays the user's actual production bookmarks.
4. Home works correctly.
5. Dynamic platform filters work.
6. Home has no category-chip clutter.
7. Categories works independently.
8. Categories are data-driven.
9. Search works.
10. Favorites works.
11. Bookmark details work.
12. Existing supported actions work.
13. Light and dark themes work.
14. Desktop and narrow-window layouts work.
15. Android and extension synchronisation remain operational.
16. Google authentication remains operational.
17. Chrome builds successfully.
18. Firefox builds successfully.
19. Brave compatibility is verified.
20. Production Android and backend remain untouched.

Do not report successful live tests without actually performing them.

Separate automated checks from manual browser tests.

---

# 24. FINAL HANDOVER — STOP HERE

When finished:

Provide:

1. A summary of the actual work.
2. The new extension project structure.
3. Screenshots of the full library at desktop and narrow widths.
4. Screenshots of Home, Categories, Search and Favorites.
5. Build results for Chrome and Firefox.
6. Brave testing result.
7. Realtime regression test results.
8. Android synchronisation verification.
9. Popup and right-click regression results.
10. Any remaining issues.

Do not create a separate website.

Do not deploy anything to Cloudflare Pages.

Do not modify or redeploy the Worker.

Do not publish a new extension-store version automatically.

Do not begin another development phase.

Once the full desktop experience is complete and verified, stop and wait for my review.

---

# FINAL CREATIVE DIRECTION

Think like a product designer building the desktop version of a successful mobile application.

Do not turn BookMyMark into a complicated SaaS dashboard.

Do not add unnecessary features.

Do not decorate the UI with artificial AI-generated messaging.

Do not show backend concepts to users.

Do not make the interface louder or more complicated than the existing mobile application.

Keep it clean, fast, readable and familiar.

The desktop experience should make users feel that they are using the same BookMyMark they already know, just with more room to explore their library.

**One extension. One account. One library.**

Make every screen feel intentional. Make every interaction work. Preserve everything that already works.