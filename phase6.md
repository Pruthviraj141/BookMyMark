# SAVR — PERFORMANCE OPTIMIZATION MASTER PROMPT
## Supabase Realtime + Cloudflare Edge Cache + Lazy Previews + Code Splitting + PostgreSQL Full-Text Search

Act as a senior React performance engineer, Supabase/PostgreSQL engineer, Cloudflare Workers developer and Capacitor Android engineer.

Your task is to optimize my EXISTING working SAVR Android application.

This is an optimization task, NOT a rebuild.

The five objectives are:

1. Replace 3.5-second polling with Supabase Realtime.
2. Cache public link-preview metadata using Cloudflare's edge cache.
3. Load link previews only when bookmark cards approach the viewport.
4. Reduce initial JavaScript bundle size through code splitting.
5. Implement PostgreSQL full-text search with a GIN index.

Keep the implementation lightweight and maintainable.

Do not introduce unnecessary dependencies or infrastructure.

==================================================
PHASE 1 — INSPECT EXISTING IMPLEMENTATION
==================================================

Inspect the existing project before modifying anything.

Identify:

- HomeScreen polling implementation.
- Bookmark state management.
- Supabase client configuration.
- Existing Realtime configuration.
- Existing Cloudflare Worker.
- Current /api/link-preview endpoint.
- BookmarkCard component.
- Preview metadata fetching.
- Vite configuration.
- Existing search implementation.
- Supabase bookmarks table schema.
- Current SQLite caching and synchronization.

Read the installed Supabase and PostgreSQL best-practice skills before modifying database or Realtime configuration.

Preserve:

- Supabase Google authentication.
- Supabase RLS policies.
- Direct Supabase CRUD.
- Existing Android Sharesheet integration.
- Local SQLite.
- Existing Worker deployment.
- Groq GPT-OSS 20B classification.
- Existing bookmark records.

Do not recreate the project.

Do not change existing environment secrets.

Do not introduce a second database.

If an important existing-project conflict or destructive migration is found, pause and ask me before proceeding.

==================================================
OPTIMIZATION 1 — SUPABASE REALTIME
==================================================

CURRENT PROBLEM:

HomeScreen currently polls Supabase approximately every 3.5 seconds to detect changes in ai_status.

This generates unnecessary database requests and delays UI updates.

REQUIRED CHANGE:

Replace this polling mechanism with Supabase Realtime.

Use the existing Supabase client.

Subscribe to updates on:

schema: public
table: bookmarks
event: UPDATE

Filter by:

user_id=eq.{authenticatedUserId}

Example implementation direction:

const channel = supabase
  .channel(`bookmarks-${user.id}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'bookmarks',
      filter: `user_id=eq.${user.id}`
    },
    (payload) => {
      // Merge the updated bookmark into application state.
    }
  )
  .subscribe();

Adapt the implementation to the actual existing types and architecture.

IMPORTANT REQUIREMENTS:

1. Remove the existing 3.5-second polling interval.
2. Do not introduce another polling interval.
3. Subscribe once per authenticated user.
4. Unsubscribe when the user signs out.
5. Clean up subscriptions when relevant components unmount.
6. Handle authentication changes.
7. Handle network disconnection.
8. Reconnect and refresh pending bookmarks when connectivity returns.
9. Avoid duplicate subscriptions.
10. Update only the affected bookmark instead of reloading the entire feed.

## Initial load and race-condition handling

Do not create a gap where the application can miss an update between initial fetch and subscription.

Use this sequence:

1. Establish the Realtime subscription.
2. Wait until the channel is subscribed.
3. Fetch the current bookmark snapshot.
4. Merge incoming Realtime events into the local state.
5. Deduplicate by bookmark ID and updated_at.

If a database update happens while the snapshot is loading, do not let stale snapshot data overwrite newer Realtime data.

## Local SQLite synchronization

When a Realtime UPDATE arrives:

- Update the relevant React state.
- Update the corresponding SQLite record.
- Preserve manually edited fields.
- Avoid creating duplicate records.
- Do not mark unrelated local operations as synchronized.

When Groq finishes classification, the card should update immediately without manual refresh.

## Supabase publication

Inspect whether public.bookmarks is already included in the supabase_realtime publication.

If not, add only that table.

Do not drop or recreate the publication.

Check the existing RLS policies and ensure authenticated users only receive their own changes.

For this personal application, use simple Postgres Changes rather than introducing Broadcast triggers and additional complexity.

Do not claim real-time functionality works until an actual database UPDATE is received by the application.

==================================================
OPTIMIZATION 2 — CLOUDFLARE EDGE CACHE FOR LINK PREVIEWS
==================================================

CURRENT PROBLEM:

The Worker repeatedly fetches external Instagram, X and website metadata even when the same URL has already been requested.

REQUIRED CHANGE:

Improve the existing endpoint:

GET /api/link-preview?url=

Use the Cloudflare Workers Cache API.

Prefer:

caches.default

Cache only successful public link-preview metadata.

Use an appropriate cache key derived from the normalized original public URL.

Do not accidentally cache different bookmarks as the same URL.

Do not use authentication tokens or user-specific information in the cache key.

Do not cache private user data.

## Cache strategy

Use a reasonable caching policy:

- Shared edge cache target: 24 hours.
- Browser-side metadata cache: approximately one hour.
- stale-while-revalidate where supported.

Example response headers:

Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200

Implement cache lookup before external metadata extraction.

Workflow:

1. Receive the preview URL.
2. Normalize and validate it.
3. Construct a stable cache key.
4. Check Cloudflare cache.
5. Return cached JSON if available.
6. Otherwise fetch permitted metadata.
7. Construct the preview response.
8. Cache a clone of the successful response.
9. Return the response.

Use ctx.waitUntil() for cache population where appropriate.

Do not cache:
- Failed extraction responses for long durations.
- Authentication-dependent metadata.
- Private content.
- Responses containing user-specific information.

Do not introduce Redis or an external cache service.

Do not store cover images or add image storage.

The cache should store only preview metadata and external image URLs.

Be aware that Cloudflare's Cache API can be location-specific and cache entries are not permanent. Do not promise a guaranteed 5 ms response or assume every edge location shares the same cached object.

Where practical, expose a simple diagnostic header indicating HIT, MISS or BYPASS.

Preserve the existing preview endpoint contract so the frontend does not need a complete rewrite.

Do not interfere with the separate Groq enrichment endpoint.

==================================================
OPTIMIZATION 3 — VIEWPORT-BASED LAZY LINK PREVIEWS
==================================================

CURRENT PROBLEM:

The HomeScreen currently requests previews for all bookmark cards immediately, even when they are far below the visible viewport.

This creates unnecessary requests and can make application startup slower.

REQUIRED CHANGE:

Implement IntersectionObserver-based preview loading.

The frontend should fetch a link preview only when its card approaches the viewport.

Example implementation direction:

const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      setIsVisible(true);
      observer.disconnect();
    }
  },
  {
    rootMargin: '200px'
  }
);

Use a reusable hook or small component-level implementation.

Requirements:

1. Default preview state should be unloaded.
2. Fetch metadata only when the card approaches the viewport.
3. Use approximately 200px rootMargin.
4. Disconnect the observer after the first successful intersection.
5. Clean up observers on unmount.
6. Prevent duplicate requests.
7. Deduplicate simultaneous requests for identical URLs.
8. Use an in-memory metadata cache.
9. Show a small image placeholder while loading.
10. Handle failed previews gracefully.

## Platform-specific optimization

YouTube:

Do not call the Worker just to obtain a thumbnail.

Extract the YouTube video ID locally and construct its thumbnail URL directly.

Instagram, X and websites:

Use the existing Worker link-preview endpoint when the card approaches the viewport.

Do not fetch every thumbnail when the feed initially loads.

## Feed performance

Do not change bookmark persistence or synchronization.

Do not break the masonry layout.

Do not trigger AI classification from IntersectionObserver.

Opening a card or loading its image must never call Groq.

The preview system must remain completely separate from AI enrichment.

==================================================
OPTIMIZATION 4 — REDUCE INITIAL JAVASCRIPT BUNDLE
==================================================

CURRENT PROBLEM:

The Vite build currently produces an initial JavaScript bundle of approximately 507 kB.

The HomeScreen should not need to download or initialize every screen and modal immediately.

REQUIRED CHANGE:

Use React.lazy and Suspense for non-critical screens.

Suggested:

const SearchScreen = React.lazy(
  () => import('./screens/SearchScreen')
);

const SettingsScreen = React.lazy(
  () => import('./screens/SettingsScreen')
);

const BookmarkDetailModal = React.lazy(
  () => import('./components/BookmarkDetailModal')
);

Adapt paths to the existing project.

Keep the critical application shell and initial HomeScreen eagerly available.

Lazy-load:

- Search screen.
- Settings screen.
- Bookmark details.
- Non-essential modals.
- Heavy secondary components.

Implement a minimal Suspense fallback that matches the existing dark UI.

## Dependency optimization

Inspect Lucide icon usage.

Use individual named imports rather than importing unnecessarily large collections.

Remove genuinely unused imports.

Do not replace the application's existing icon system.

Review the Vite build configuration.

Use sensible code splitting.

Avoid arbitrary manualChunks configuration unless the actual build output demonstrates a need.

Do not add an unnecessary bundle-analysis dependency.

## Verification

Run:

npm run build

Inspect the generated bundle sizes.

Compare the initial entry bundle before and after optimization where existing build output or Git history permits.

Report:

- Initial JavaScript bundle.
- Largest generated chunks.
- Lazy-loaded route chunks.
- Actual reduction.

Do not promise a specific reduction such as 120 kB or a 50% faster cold launch unless measured.

Do not sacrifice runtime performance for smaller bundle numbers.

==================================================
OPTIMIZATION 5 — POSTGRESQL FULL-TEXT SEARCH
==================================================

CURRENT PROBLEM:

Existing search uses queries such as:

title.ilike.%query%

This becomes increasingly inefficient as bookmark count grows.

REQUIRED CHANGE:

Use PostgreSQL built-in full-text search.

First inspect the actual bookmarks table schema and data types.

Identify whether:

- tags is JSONB or TEXT[].
- extracted_text exists.
- summary exists.
- description exists.
- shared_text exists.

Adapt the search implementation to the real schema.

Do not assume column types.

## Search vector

Create an additive migration for a generated tsvector column.

Suggested column:

search_vector tsvector

Index the following content:

- title
- description
- summary
- shared_text
- extracted_text, if available
- tags

Give title the highest ranking weight.

Give descriptions and summaries the next weight.

Give tags and shared text appropriate lower weights.

Use an explicit English text-search configuration and COALESCE nullable fields.

Example SQL direction:

ALTER TABLE public.bookmarks
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(
    to_tsvector(
      'english',
      coalesce(title, '')
    ),
    'A'
  )
  ||
  setweight(
    to_tsvector(
      'english',
      coalesce(description, '') || ' ' ||
      coalesce(summary, '')
    ),
    'B'
  )
  ||
  setweight(
    to_tsvector(
      'english',
      coalesce(shared_text, '') || ' ' ||
      coalesce(extracted_text, '')
    ),
    'C'
  )
) STORED;

Adapt the SQL for the actual tags column type and include tags in the search vector.

Create:

CREATE INDEX IF NOT EXISTS idx_bookmarks_search_vector
ON public.bookmarks
USING GIN(search_vector);

Create a safe, efficient database search function or use the existing Supabase full-text search support.

Prefer websearch_to_tsquery for ordinary user search input.

Rank results using ts_rank so title matches appear before less relevant description matches.

Ensure the search function respects the authenticated user's RLS and does not expose another user's bookmarks.

Do not use SECURITY DEFINER unnecessarily.

If using a SQL RPC function, ensure its execution privileges and search_path are configured correctly.

## Frontend search

Replace existing repeated ILIKE searches with the new full-text search implementation.

Use the existing Supabase client.

Keep offline search working through the local SQLite cache.

Implement a sensible debounce, around 250–350ms.

Do not call search on every individual keystroke without debounce.

Preserve category and platform filters.

## Important search clarification

Full-text search supports stemming and normalized matching, but it does not automatically provide general typo correction.

Do not claim typo tolerance.

Do not enable pg_trgm or additional extensions unless a clear need exists and I approve it.

Keep this implementation simple.

==================================================
GLOBAL REQUIREMENTS
==================================================

1. Preserve Supabase Google authentication.
2. Preserve direct Supabase CRUD.
3. Preserve local SQLite and offline synchronization.
4. Preserve the Android Sharesheet integration.
5. Preserve existing bookmark records.
6. Preserve existing Groq GPT-OSS 20B.
7. Do not add visual AI or additional AI models.
8. Do not store cover images.
9. Do not add new image database columns.
10. Do not introduce another database or server.
11. Do not introduce new paid infrastructure.
12. Do not create unnecessary migrations.
13. Do not overwrite environment files.
14. Do not change unrelated application screens.
15. Do not redesign the application.

The goal is optimization, not architectural expansion.

==================================================
IMPLEMENTATION ORDER
==================================================

Follow this order:

PHASE A:
Inspect existing application and establish baseline performance.

PHASE B:
Implement Supabase Realtime and remove 3.5-second polling.

PHASE C:
Implement Cloudflare link-preview edge caching.

PHASE D:
Implement IntersectionObserver preview loading and request deduplication.

PHASE E:
Implement React lazy loading and code splitting.

PHASE F:
Create additive PostgreSQL full-text search migration and update frontend search.

PHASE G:
Build, verify and deploy.

Do not stop between phases for approval unless a destructive database or production configuration decision is required.

==================================================
FOCUSED VERIFICATION
==================================================

Verify the following:

REALTIME:
- Subscribe to one authenticated user's bookmark updates.
- AI completion updates the correct card.
- No 3.5-second polling remains.
- No duplicate Realtime subscriptions.
- Realtime subscription is removed on logout.

PREVIEW CACHE:
- First preview request produces a cache MISS.
- Repeated identical public preview requests can produce a cache HIT.
- Cache does not mix unrelated URLs.
- Failed extraction is handled correctly.
- No image files or database image records are created.

LAZY LOADING:
- Off-screen cards do not request previews immediately.
- Cards approaching the viewport request previews.
- Scrolling does not cause duplicate requests.
- YouTube previews are resolved locally.

CODE SPLITTING:
- Build succeeds.
- Search and Settings load only when needed.
- HomeScreen remains available at startup.
- No broken lazy imports.

FULL-TEXT SEARCH:
- Existing bookmarks remain searchable.
- Tags and descriptions can be searched.
- Search ranking works.
- RLS remains effective.
- Offline search still works.

ANDROID:
- APK builds successfully.
- Login still works.
- Sharesheet still works.
- Bookmark creation remains correct.
- No UI regressions.

Do not create a massive test suite.

Run focused tests against real application paths.

==================================================
CLOUDFLARE DEPLOYMENT
==================================================

Reuse the existing Worker:

savr-api

https://savr-api.markyourday.workers.dev

Deploy only after local build and checks succeed.

Preserve all existing secrets.

Do not create another Worker.

Verify the updated preview endpoint and health endpoint after deployment.

Apply the Supabase migration only after inspecting and confirming the target project and SQL changes.

Never delete existing bookmarks.

==================================================
FINAL DELIVERY REPORT
==================================================

At completion, provide:

1. Removal of old polling implementation.
2. Supabase Realtime subscription details.
3. Cache hit/miss verification.
4. Preview lazy-loading implementation.
5. Initial bundle size before and after.
6. Search migration SQL and GIN index status.
7. Search ranking verification.
8. Offline SQLite behaviour.
9. Android build status.
10. Cloudflare deployment status.

Clearly distinguish:
- Implemented.
- Tested.
- Deployed.
- Not verified.

Do not invent performance improvements or benchmark results.

Do not claim a cache hit without observing one.

Do not claim the application is faster without comparing measurements.

FINAL OBJECTIVE:

Make SAVR feel instant.

AI updates should appear through Realtime instead of constant polling.

Previews should load only when needed.

Repeated metadata requests should benefit from edge caching.

The initial application bundle should load less code.

Search should use PostgreSQL full-text indexing.

Keep the entire application simple, fast, reliable and suitable for a personal Android project.