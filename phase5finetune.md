# SAVR — FINAL ARCHITECTURE SIMPLIFICATION AND UI/UX OPTIMIZATION

Act as a senior React, Capacitor, Supabase, Cloudflare Workers and TypeScript engineer.

Your task is to simplify and optimize my EXISTING working SAVR Android application.

This is an existing deployed application. Do not create a new project.

The main objective is to remove unnecessary backend complexity, make normal bookmark operations faster, improve cover previews and make the application UI simpler and smoother.

Do not rewrite features that are already working.

==================================================
1. EXISTING PROJECT — INSPECT FIRST
==================================================

Inspect:

- React frontend.
- Capacitor Android project.
- Existing native Android ShareReceiverActivity.
- Existing SQLite database and sync implementation.
- Supabase Auth configuration.
- Supabase bookmarks table and RLS policies.
- Existing Cloudflare Worker.
- Existing Groq integration.
- Existing bookmark card and feed components.
- Existing environment variables.

Read the installed Supabase and PostgreSQL best-practice skills where relevant.

The existing project has:

- React + Vite + TypeScript.
- Tailwind CSS.
- Capacitor Android.
- Supabase Google OAuth.
- Supabase PostgreSQL.
- Local SQLite.
- Cloudflare Worker running Hono.
- Groq API.

Existing Worker:

https://savr-api.markyourday.workers.dev

Existing Groq model:

openai/gpt-oss-20b

Preserve existing user accounts and bookmarks.

Do not modify or delete existing records without explicit approval.

Never overwrite existing secrets or environment variables.

If a potentially destructive operation or important architectural ambiguity arises, STOP and ask me before proceeding.

Do not ask unnecessary questions about decisions already specified here.

==================================================
2. FINAL SIMPLIFIED ARCHITECTURE
==================================================

Use exactly these responsibilities:

FRONTEND:
React + Capacitor + Supabase JavaScript SDK.

LOCAL:
SQLite for immediate bookmark storage, local reads and offline synchronization.

CLOUD DATABASE:
Supabase PostgreSQL.

AUTHENTICATION:
Existing Supabase Google OAuth.

CLOUDFLARE WORKER:
Only two main responsibilities:

1. GET /api/link-preview
2. POST /api/bookmarks/:id/enrich

AI:
Existing Groq GPT-OSS 20B.

Do not introduce:

- New AI models.
- Visual AI.
- OCR.
- Video transcription.
- Vector databases.
- Supabase Edge Functions.
- Database webhooks.
- Redis.
- Docker.
- New storage services.
- Image storage.
- Additional microservices.

Keep everything straightforward.

==================================================
3. REMOVE UNNECESSARY WORKER CRUD
==================================================

Currently, ordinary bookmark operations pass through:

React → Cloudflare Worker → Supabase.

Change this.

The React application should communicate directly with Supabase for:

- Create bookmark.
- Fetch bookmarks.
- Retrieve one bookmark.
- Update bookmark.
- Delete bookmark.
- Search.
- Category filtering.
- Platform filtering.
- Tag filtering.

Use the existing @supabase/supabase-js client.

Use the authenticated user's existing Supabase session.

Create a shared Supabase client instance.

Use:

SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY

Expose them safely to Vite using appropriate VITE_ prefixed public variables.

Never expose:

SUPABASE_SECRET_KEY

Never expose:

GROQ_API_KEY

Use Supabase RLS for all normal user operations.

Do not put ordinary CRUD behind Cloudflare.

Remove old Worker CRUD routes from frontend usage after verifying that nothing still depends on them.

Keep existing database tables and RLS policies.

Do not create another bookmarks table.

Do not introduce another authentication system.

==================================================
4. DIRECT SUPABASE DATA OPERATIONS
==================================================

Implement a clean frontend data service.

Suggested structure:

frontend/src/
  services/
    supabase.ts
    bookmarks.service.ts
    preview.service.ts
    enrichment.service.ts
    local-db.service.ts
    sync.service.ts

Adapt it to the existing project structure.

Create a centralized bookmark repository that coordinates:

- Local SQLite.
- Supabase direct queries.
- Cloudflare AI enrichment.

Do not create complicated abstractions.

All cloud CRUD must use Supabase directly.

The user must only access their own bookmarks through existing RLS policies.

Search and filtering must also use Supabase directly where online.

For offline operation, search and filter locally cached records.

Avoid loading every bookmark repeatedly.

Use pagination where the existing interface requires it.

==================================================
5. LOCAL-FIRST SQLITE SYNCHRONIZATION
==================================================

Keep the existing Android SQLite implementation.

Do not create another independent database.

The mobile application must remain responsive even when the internet connection is slow.

Required behaviour:

When creating a bookmark:

1. Generate a stable UUID.
2. Save it to SQLite immediately.
3. Display it in the feed immediately.
4. Mark it pending synchronization.
5. Insert it into Supabase directly using the authenticated user.
6. Mark it synchronized after successful insertion.
7. Trigger Cloudflare enrichment.

If offline:

- Keep the bookmark locally.
- Keep its pending operation.
- Synchronize when internet returns.
- Trigger enrichment only after successful cloud synchronization.

For edits and deletes:

- Update local SQLite immediately.
- Synchronize directly with Supabase.
- Prevent duplicate operations.
- Do not lose pending changes during application restart.

Handle duplicate URLs for the same user.

Use stable bookmark IDs and existing database constraints.

Keep the synchronization implementation as simple as possible.

Do not introduce additional cloud queues.

Do not perform CRUD through Cloudflare merely to support local sync.

Ensure local data is separated by authenticated user ID.

Do not display another user's cached records after switching accounts.

==================================================
6. ANDROID SHARE RECEIVER
==================================================

This is already an important working feature.

PRESERVE the existing Android Sharesheet integration.

Do not rewrite it unnecessarily.

The share flow must remain:

Instagram/X → Share → Savr → Save automatically → Return to original application.

Do not open the normal Savr home screen for authenticated shares.

The incoming share must be saved immediately to local SQLite.

When online:

- Submit the bookmark directly to Supabase using the authenticated user's access token and publishable key.
- Respect existing RLS policies.
- Trigger Cloudflare enrichment after successful persistence.

When offline:

- Keep the shared link in the local pending queue.
- Synchronize automatically when the app next becomes active and connectivity returns.

Use the existing native authentication bridge.

Never store passwords or Groq API credentials on Android.

If the existing native share activity uses Worker CRUD endpoints, replace only that network operation with direct authenticated Supabase REST access.

Do not create a second native bookmark storage system.

Do not break the one-selection sharing experience.

==================================================
7. CLOUDFLARE WORKER — ONLY TWO RESPONSIBILITIES
==================================================

Keep the existing deployed Worker:

savr-api

Do not create another Worker.

Keep Hono and the existing configuration.

Remove unnecessary normal CRUD routes only after frontend and Android clients no longer use them.

The remaining main endpoints should be:

GET /health

GET /api/link-preview?url=

POST /api/bookmarks/:id/enrich

No Worker list-bookmarks endpoint.

No Worker search endpoint.

No Worker create-bookmark endpoint.

No Worker update-bookmark endpoint.

No Worker delete-bookmark endpoint.

The frontend must use Supabase directly for these operations.

==================================================
8. LINK PREVIEW ENDPOINT
==================================================

Implement or improve:

GET /api/link-preview?url=

This endpoint should only retrieve available link metadata.

Return:

{
  "success": true,
  "data": {
    "platform": "instagram",
    "title": "Example post",
    "description": "Available description",
    "imageUrl": "https://public-image-host/example.jpg"
  }
}

The image URL must be returned temporarily to the frontend.

Do not insert it into Supabase.

Do not insert it into SQLite.

Do not store any image URL or image binary in the database.

The image endpoint is a metadata lookup, not an image storage system.

## Preview extraction priority

1. Available public platform metadata.
2. Official oEmbed response where supported.
3. Open Graph image.
4. Twitter Card image.
5. Other accessible page metadata.

Instagram and X may restrict access to some post information.

Do not bypass authentication or CAPTCHAs.

Never fabricate a post thumbnail.

If metadata is unavailable, return null for the image URL.

Use simple HTTP and HTTPS URL validation and block obvious local/private-network destinations.

Do not introduce complicated infrastructure.

==================================================
9. YOUTUBE PREVIEWS — CLIENT SIDE
==================================================

Do not call the Worker for ordinary YouTube thumbnail extraction.

Implement client-side YouTube URL recognition.

Support:

- youtube.com/watch?v=VIDEO_ID
- youtu.be/VIDEO_ID
- youtube.com/shorts/VIDEO_ID
- youtube.com/embed/VIDEO_ID

Generate:

https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg

Validate the video ID.

Do not persist this thumbnail URL.

Render it directly.

No metadata API call should be required simply to obtain this YouTube preview.

==================================================
10. IMAGE DISPLAY — DO NOT STORE IMAGES
==================================================

This is extremely important.

I do not want image storage in Savr.

Do not:

- Store image blobs.
- Store base64 images.
- Upload bookmark covers to Supabase Storage.
- Create image tables.
- Add image records.
- Add new image URL columns.
- Populate the existing thumbnail_url field.
- Create a persistent image cache.

Do not use Supabase Storage for bookmark cover images.

Do not build a separate image proxy.

Remove or stop using the previous image proxy if no application feature depends on it.

Display the returned external image URL directly through a normal image element.

Use:

- Lazy loading.
- Async decoding.
- In-memory preview caching.
- Correct aspect-ratio handling.
- A lightweight broken-image fallback.

The preview cache must exist only in application memory.

When the application is reopened, preview URLs can be fetched again.

The cover image exists only to visually identify the original Reel or tweet.

It is not an AI input.

It is not database content.

It is not an attachment-storage feature.

==================================================
11. AI ENRICHMENT ENDPOINT
==================================================

Implement or simplify:

POST /api/bookmarks/:id/enrich

This is the only main AI processing endpoint.

The frontend first inserts the bookmark directly into Supabase.

After successful insertion, it calls this Worker endpoint with:

- Bookmark ID.
- Authenticated Supabase access token.
- Optional available shared text or metadata.

The Worker must:

1. Verify the Supabase user session.
2. Fetch the bookmark using the authenticated user's context.
3. Confirm the bookmark belongs to that user.
4. Return a clear accepted response.
5. Run lightweight background metadata extraction and classification.
6. Update the existing bookmark under the same authenticated user's RLS context.

Use Hono's Cloudflare execution context waitUntil where appropriate.

Do not create additional servers or queues.

If processing cannot complete, keep the bookmark and provide a clear AI status.

The Worker does not create the original bookmark.

The Worker does not perform ordinary CRUD.

==================================================
12. AI CLASSIFICATION — ONE MODEL ONLY
==================================================

Use the existing:

openai/gpt-oss-20b

Keep the existing GROQ_MODEL and GROQ_API_KEY configuration.

Do not add any other AI model.

Do not use images as AI input.

Do not introduce:

- Vision.
- OCR.
- Transcription.
- Additional AI providers.

The classifier must use available text only:

- Shared text.
- Caption.
- Hashtags.
- Page title.
- Description.
- Accessible webpage text.
- Platform metadata.

Generate:

{
  "category": "Knowledge",
  "topic": "Thermodynamics",
  "tags": [
    "Entropy",
    "Physics",
    "Science"
  ],
  "content_type": "educational",
  "summary": "A concise explanation of entropy.",
  "confidence": 0.91
}

Keep consistent categories:

- Knowledge
- Funny
- Entertainment
- Education
- Technology
- Programming
- Motivation
- Lifestyle
- Fitness
- News
- Inspiration
- Travel
- Other

Use specific topic tags.

For example:

Category: Knowledge
Tags: Entropy, Physics, Thermodynamics.

Category: Funny
Tags: Cats, Memes, Reactions.

Category: Programming
Tags: JavaScript, React, Web Development.

Do not assign generic categories blindly.

Do not invent topics when text is missing.

When there is insufficient evidence, mark ai_status as insufficient_content.

==================================================
13. MINIMIZE GROQ TOKEN USAGE
==================================================

Keep the existing model.

Use one concise classification request for new content.

Requirements:

- Extract and clean relevant text.
- Do not send entire HTML pages.
- Limit unnecessary context.
- Generate approximately 3–5 useful tags.
- Generate one short summary.
- Use structured JSON.
- Limit output tokens to approximately 120–180 where practical.
- Never call AI when opening bookmarks.
- Never call AI during feed refresh.
- Never call AI during image preview rendering.
- Avoid processing the same content repeatedly.
- Cache completed classification using a simple content fingerprint.
- Reprocess only on explicit request or when meaningful text changes.

AI categorization should be accurate based on the available evidence, not based on guesses.

==================================================
14. SIMPLE AND SMOOTH UI/UX IMPROVEMENTS
==================================================

The application already has its design direction.

Do not redesign everything.

Improve the existing experience while keeping its visual identity.

Use the supplied Savr reference as the main design inspiration.

The target is a clean, premium and smooth personal bookmark application.

## Home screen

Keep:

- Two-column masonry feed.
- Actual post cover previews.
- Platform indication.
- Original title.
- Short description.
- AI category.
- Topic tags.

Simplify the screen.

Remove unnecessary:
- Large dashboard statistics.
- Decorative sections.
- Excessive badges.
- Redundant buttons.
- Unnecessary cards.
- Overly complicated navigation.

The saved content must remain the main focus.

## Navigation

Keep navigation straightforward.

Prioritize:

- Home.
- Search.
- Settings.

Do not introduce additional navigation sections without a genuine use case.

## Bookmark cards

Make the cards visually balanced.

The cover should be prominent.

The platform should be recognizable.

The title should be readable.

The description should be short.

Tags should be compact and unobtrusive.

Do not display too many tags on the card.

Allow complete details on the bookmark detail screen.

## Smoothness

Implement:

- Lazy image loading.
- Lightweight skeleton states.
- Smooth scrolling.
- Debounced search.
- Immediate local updates.
- Minimal React re-renders.
- Small CSS transitions.
- Proper safe-area handling.
- Responsive touch targets.
- Good Android back navigation.
- No layout jumping while images load.

Avoid expensive animations.

Do not install unnecessary animation libraries.

The application should feel instant rather than visually over-animated.

## Loading and error states

If the feed is loading, show a simple skeleton.

If there are no bookmarks, show a useful empty state.

If an image fails, show a neutral platform-specific placeholder.

If AI processing is pending, display a subtle processing indicator.

Do not show technical error messages to normal users.

==================================================
15. DIRECT DATA FLOW
==================================================

The intended workflow is:

### New bookmark

Android Share → Local SQLite → Supabase direct INSERT → Cloudflare enrichment → Supabase classification UPDATE → Local SQLite refresh.

### Existing bookmark retrieval

React → Local SQLite immediately → Supabase direct SELECT and synchronize updates.

### Edit bookmark

React → Local SQLite immediately → Supabase direct UPDATE.

### Delete bookmark

React → Local SQLite immediately → Supabase direct DELETE.

### Search

React → Local SQLite when offline and Supabase direct query when online.

### Cover preview

React → YouTube direct thumbnail URL OR Cloudflare link-preview endpoint → external image URL → display directly.

### AI

Bookmark already exists in Supabase → React calls Cloudflare enrichment endpoint → Groq GPT-OSS 20B → Worker updates Supabase.

The Cloudflare Worker must never become the general-purpose database CRUD layer again.

==================================================
16. PRESERVE AUTHENTICATION AND SECURITY
==================================================

Keep existing Supabase Google OAuth.

Keep existing user sessions.

Keep existing RLS policies.

Use Supabase publishable key in the frontend.

Never expose Supabase secret key or Groq API key.

For Worker enrichment:

- Require a valid authenticated Supabase access token.
- Verify the user's identity.
- Use a user-scoped Supabase client with the user's JWT.
- Let RLS enforce bookmark ownership.
- Do not trust user_id from arbitrary request bodies.
- Do not use the Supabase secret key for ordinary CRUD.

Avoid unnecessary authentication changes.

Do not introduce additional security systems.

==================================================
17. CLOUDFLARE DEPLOYMENT
==================================================

The existing Worker is:

savr-api

URL:

https://savr-api.markyourday.workers.dev

Reuse it.

Do not create another Worker.

Inspect current Wrangler configuration and secrets.

Do not overwrite existing Groq or Supabase credentials.

The Worker should expose only:

GET /health

GET /api/link-preview

POST /api/bookmarks/:id/enrich

Deploy using the existing authenticated Wrangler setup.

Verify:

- Health endpoint.
- Link preview endpoint.
- Authenticated enrichment endpoint.
- Groq processing.
- Supabase bookmark update.

Never expose credentials in deployment configuration.

If an existing Worker resource or database change could be destructive, ask me before proceeding.

==================================================
18. CORE VERIFICATION
==================================================

Keep testing focused on the actual application.

Verify:

1. Supabase Google login still works.
2. Direct Supabase bookmark INSERT works.
3. Direct SELECT works.
4. Direct UPDATE works.
5. Direct DELETE works.
6. RLS still isolates user data.
7. Local SQLite first-save behaviour works.
8. Offline queue synchronizes.
9. Android native share flow still works.
10. YouTube cover resolution works.
11. Instagram preview endpoint returns available metadata.
12. X preview endpoint returns available metadata.
13. Cover images display without database storage.
14. Groq classification works using the existing model.
15. Feed refresh does not create extra Groq requests.
16. No image is sent to Groq.
17. Android APK builds successfully.

Do not create hundreds of tests.

Do not claim a test passed without running it.

==================================================
19. FINAL DELIVERY
==================================================

At completion, provide:

- Simplified architecture.
- Worker routes removed from normal CRUD.
- Direct Supabase CRUD verification.
- Local SQLite synchronization status.
- Existing Android share flow status.
- Link preview functionality.
- Confirmation that no images are stored.
- Confirmation that no visual AI or second model was added.
- Groq token optimization.
- UI/UX improvements.
- Cloudflare deployment status.
- APK build status.

Do not rebuild the application unnecessarily.

Do not create complicated infrastructure.

Do not delete user data.

Do not change the existing Google authentication.

Do not ask unnecessary questions.

If a genuine conflict or destructive migration is found, pause and ask me.

FINAL GOAL:

Make Savr a simple, fast, smooth personal Android bookmark application.

Supabase handles authentication and normal database operations directly.

SQLite provides instant local interaction and offline synchronization.

Cloudflare handles only link previews and AI enrichment.

Groq uses one text model for categorization.

Cover images are displayed dynamically and never stored.

Preserve everything that already works and simplify everything that does not need to exist.