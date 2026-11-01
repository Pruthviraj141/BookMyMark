# SAVR — EXISTING APPLICATION UPGRADE MASTER PROMPT
## Supabase Auth + Local SQLite + Cloudflare Workers + Intelligent Cover Images + Low-Token AI

You are acting as a senior mobile application architect, React/Capacitor engineer, Supabase specialist, Cloudflare Workers developer and AI engineering specialist.

Your task is to upgrade my EXISTING WORKING SAVR APPLICATION.

This is not a fresh application build.

The current application already has:
- React + Vite + TypeScript.
- Tailwind CSS.
- Capacitor Android.
- An existing Hono backend.
- Existing Android share integration.
- Existing bookmark feed and cards.
- Groq integration.
- A local SQLite database.

The app currently works, but there are important issues:

1. Instagram Reel and X post thumbnail images frequently fail to load.
2. Many Reels are not categorized correctly because the backend cannot extract sufficient content.
3. Cover images do not consistently represent the actual saved content.
4. The current authentication implementation must be replaced with Supabase Auth.
5. Bookmark storage must synchronize with real Supabase PostgreSQL.
6. The backend must be deployed to Cloudflare Workers.
7. The application must remain very fast and use minimal AI tokens.

Your job is to fix these issues and deploy the application.

Do not unnecessarily redesign the application or rewrite working features.

# 1. ABSOLUTE AGENT WORKFLOW RULE

Before making any changes:

Inspect the entire existing project.

Inspect:
- frontend source.
- Android native code.
- Capacitor configuration.
- Backend implementation.
- Existing SQLite schema and data.
- Current share receiver.
- Existing metadata extraction.
- Existing Groq integration.
- Existing image rendering.
- Root and backend environment files.
- Existing Cloudflare configuration.
- Existing Supabase configuration.

## Mandatory skill usage

Read the installed Supabase agent skills before making database or authentication decisions.

Locate and read the actual installed instructions for:

- Supabase server integration.
- Supabase general development.
- Supabase PostgreSQL best practices.

Check locations including:

.agents/skills/supabase/
.agents/skills/supabase/server/
.agents/skills/supabase-postgres-best-practices/

Read their SKILL.md files and any relevant supporting instructions.

Use the installed skills as implementation guidance, not merely as references.

## Ask-me-first rule

This is extremely important.

If ANY important implementation detail is unclear, pause the workflow and ask me before proceeding.

Do not silently make risky assumptions.

Specifically ask before:

- Changing or deleting existing Supabase tables.
- Replacing existing authentication settings.
- Migrating existing bookmarks if user ownership is ambiguous.
- Changing existing Android share receiver behaviour.
- Changing an existing Cloudflare Worker or production domain.
- Exposing or changing secret configuration.
- Creating a public storage bucket.
- Performing destructive database operations.
- Selecting a new AI model or adding a paid API.

If you have even a small but material uncertainty, explain it and wait for my answer.

Ask related questions together rather than repeatedly interrupting me.

Do not ask me to repeat information already present in the project.

For routine implementation choices, use sensible engineering defaults.

Do not stop implementation for trivial uncertainties.

Never print environment variable values, passwords, API keys, access tokens or refresh tokens in terminal output or documentation.

## Preserve the existing application

- Do not recreate the project.
- Do not delete working Android integrations.
- Do not remove current bookmark data.
- Do not overwrite existing API keys.
- Do not create unnecessary new dependencies.
- Do not replace actual data with mock data.
- Do not claim deployment succeeded unless the deployed application is verified.

Create a short upgrade plan after inspection and then proceed through the implementation stages.

# 2. FINAL ARCHITECTURE

Implement the following architecture.

## Android application

React + Vite + TypeScript + Tailwind + Capacitor.

Responsibilities:
- UI.
- Supabase authentication.
- Local SQLite storage.
- Local image cache.
- Search.
- Filtering.
- Bookmark details.
- Offline support.
- Android Sharesheet reception.

## On-device database

Use SQLite on the Android phone.

It is the immediate local storage and cache layer.

Save bookmarks locally first so the application responds quickly.

## Cloud backend

Use Hono on Cloudflare Workers.

Responsibilities:
- Authenticated REST APIs.
- Bookmark synchronization.
- Metadata extraction.
- AI processing.
- Cover-image retrieval.
- Search orchestration.
- Supabase integration.

## Cloud database

Supabase PostgreSQL.

It is the persistent, cross-device source of truth.

## Authentication

Supabase Auth.

Remove the old custom SQLite username/password authentication and its custom users table.

Do not create a second authentication system.

Use the Supabase Auth configuration already enabled in my project.

Interpret removal of the old signup system as replacing that custom implementation with Supabase Auth. Keep a simple sign-in interface. Do not create an independent registration backend or expose a public sign-up option unless my existing Supabase configuration and product flow require it. Ask me if that decision is unclear.

# 3. EXISTING ENVIRONMENT VARIABLES

I have already added these variables:

SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_JWKS_URL=

I have also configured:

GROQ_API_KEY=
GROQ_MODEL=

Inspect the existing .env files and reuse these values.

Do not overwrite them.

Do not request credentials that already exist.

Do not expose any secret in the React application.

## Frontend configuration

The frontend may use:

VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_API_BASE_URL

The publishable key is suitable for a public mobile application.

NEVER put these into VITE variables:

SUPABASE_SECRET_KEY
GROQ_API_KEY

## Worker configuration

Use Cloudflare Workers environment variables for non-secret configuration.

Use Cloudflare encrypted secrets for:
- GROQ_API_KEY.
- SUPABASE_SECRET_KEY, only if needed for explicitly administrative operations.

The Supabase URL, publishable key and JWKS URL can be configured as ordinary Worker variables.

Never commit credentials or deploy secrets as plaintext Wrangler vars.

# 4. SUPABASE AUTHENTICATION MIGRATION

Replace the existing custom login system with Supabase Auth.

Use the appropriate Supabase JavaScript SDK in React.

Requirements:

- Sign in with the enabled Supabase authentication method.
- Restore the existing session when Savr launches.
- Refresh sessions appropriately.
- Sign out correctly.
- Handle expired sessions.
- Handle authentication errors.
- Associate all bookmarks with the authenticated Supabase user ID.

Remove the old custom password database and backend login/register endpoints only after verifying that the new Supabase Auth flow works.

Do not lose existing bookmark records when removing the previous users table.

## Secure native authentication

The Android share receiver also needs an authenticated session to save content without opening the application.

Implement secure native token sharing between React and Android.

Use Android Keystore-backed secure storage or a suitable maintained Capacitor secure-storage integration.

Do not store refresh tokens or access tokens in plaintext SharedPreferences.

Implement a secure bridge to maintain the necessary Supabase session information.

Handle expired access tokens safely.

When the native share receiver cannot authenticate, preserve the incoming bookmark and retry after the user restores their session.

The Groq key must never be stored in the mobile application.

# 5. SUPABASE DATABASE IMPLEMENTATION

Create the actual remote database schema.

Do not simply create local TypeScript interfaces.

Inspect the current Supabase project before creating tables.

Use SQL migrations.

Use Supabase CLI or an authenticated Supabase management/database integration available in the environment.

The existing Supabase database must remain intact.

Never drop or truncate existing tables without my explicit approval.

## Main bookmarks table

Create or safely migrate a table called:

bookmarks

Required fields:

- id: UUID.
- user_id: UUID referencing auth.users(id).
- original_url.
- normalized_url.
- platform.
- title.
- description.
- shared_text.
- extracted_text.
- summary.
- category.
- tags: JSONB or TEXT[].
- content_type.
- thumbnail_url.
- cover_storage_path.
- cover_source.
- cover_status.
- ai_status.
- ai_confidence.
- ai_evidence.
- created_at.
- updated_at.
- synced_at.
- is_favorite.
- notes.
- metadata_hash.

Add only the fields needed for the current product.

Do not build complicated relational structures.

Use a single bookmarks table for the initial implementation.

Add suitable indexes for:
- user_id.
- created_at.
- platform.
- category.
- tags.
- normalized_url.

Create a unique constraint to prevent duplicate URLs for the same user.

Use efficient indexes appropriate to the actual query patterns.

## Row Level Security

Enable RLS on user-owned bookmark data.

Policies must enforce:

SELECT:
Users only see their own bookmarks.

INSERT:
Users can only create records with their own auth.uid().

UPDATE:
Users can only modify their own records.

DELETE:
Users can only delete their own records.

Use policies explicitly scoped to authenticated users.

Follow the installed PostgreSQL best-practices skill.

Test user isolation with two separate authenticated test accounts.

## Existing data migration

Inspect the existing local SQLite database.

If bookmarks already exist:

1. Preserve the original database.
2. Create a safe backup.
3. Export existing bookmarks.
4. Associate records with the correct Supabase Auth user.
5. Import them into Supabase.
6. Verify record counts and representative records.
7. Retain the local backup until migration is confirmed.

Never migrate old local passwords into Supabase.

If multiple old accounts exist and their bookmarks cannot be mapped unambiguously, ask me before migrating.

## Database migration execution

Create reproducible SQL migration files.

Before remote migration:
- Identify the exact Supabase project.
- Verify the target database.
- Inspect existing schema.
- Preview migration changes where supported.

The Supabase secret API key is NOT a PostgreSQL database password.

Do not use it as a database connection password.

If remote schema changes cannot be executed using the available authenticated CLI or Supabase integration, pause and ask me for the required database-access step. Never claim the schema was created when it was not.

# 6. PRIVATE SUPABASE STORAGE FOR COVERS

Inspect whether an appropriate Storage bucket already exists.

If needed, create a private bucket:

bookmark-covers

Use user-specific storage paths:

{user_id}/{bookmark_id}/cover.jpg

Requirements:

- Private storage by default.
- Correct authenticated access policies.
- Prevent one user accessing another user's images.
- Generate signed URLs where appropriate.
- Do not expose secret storage credentials.
- Do not upload arbitrary large media files.

Only persist third-party images where the relevant provider terms and permitted access allow caching.

Use private Storage for user-supplied images and eligible cover assets.

For images that should not be copied, use permitted external image sources with a safe Worker proxy/cache strategy.

# 7. LOCAL SQLITE AND CLOUD SYNCHRONIZATION

I specifically want SQLite locally because the Android application should feel extremely fast.

Implement an offline-first architecture.

Use a Capacitor-compatible SQLite implementation that matches the existing Capacitor major version.

Inspect available installed packages first.

If the existing local database is not usable on Android, select an actively maintained compatible SQLite plugin.

The same logical local data must be accessible to both:

- React application.
- Native Android share receiver.

Do not create two unrelated SQLite databases.

If the existing SQLite plugin cannot safely share its database with the native share activity, implement a small shared native SQLiteOpenHelper and expose the required methods through a Capacitor plugin.

## Local bookmarks schema

Include:

- id.
- user_id.
- original_url.
- title.
- description.
- summary.
- thumbnail_url.
- local_cover_path.
- category.
- tags_json.
- platform.
- ai_status.
- sync_status.
- created_at.
- updated_at.
- deleted_at.

Use a persistent sync outbox or equivalent mechanism.

## Save workflow

When a bookmark is shared or added manually:

1. Generate a stable UUID.
2. Save it to local SQLite immediately.
3. Show the bookmark in the feed immediately.
4. Mark it pending synchronization.
5. Send it to the Cloudflare Worker.
6. Worker writes it into Supabase.
7. Worker performs metadata and AI enrichment.
8. The client receives updated data.
9. Update the local SQLite record.
10. Mark it synchronized.

Do not make local saving wait for network or Groq.

## Offline synchronization

Implement automatic synchronization:

- On application startup.
- When the application resumes.
- Immediately after a bookmark is saved.
- When network connectivity returns.
- When the user explicitly refreshes.

Use idempotent requests.

Preserve stable IDs.

Prevent duplicates.

Support update and delete synchronization using timestamps or deletion tombstones.

Resolve conflicts sensibly:

- User-edited titles and tags must not be overwritten by AI.
- Server AI results should update AI-owned fields.
- Newer explicit user edits should take precedence.
- Do not overwrite unrelated local data during remote synchronization.

Partition local bookmarks by Supabase user ID.

Never display one user's cached bookmarks after another account signs in.

Keep image files in the application file cache rather than storing large image blobs in SQLite.

The SQLite database should store local image paths and remote storage references.

# 8. CLOUDflare WORKERS — MOVE THE BACKEND COMPLETELY

This is a major requirement.

I have already authenticated Cloudflare through the CLI/project environment.

First verify:

npx wrangler whoami

Do not request another login unless authentication actually fails.

## Worker architecture

Convert the current Hono backend to a Cloudflare Workers-compatible implementation.

Use:
- Hono.
- TypeScript.
- Cloudflare Workers runtime.
- Supabase integration.
- Groq API.
- Web Fetch APIs.

Create or update:

wrangler.jsonc

and a proper Workers entry point.

Keep the existing API contract wherever practical.

IMPORTANT:

Do not import better-sqlite3 or any Node-only persistent SQLite code into the deployed Worker.

Local SQLite belongs inside the Android application.

Supabase PostgreSQL is the persistent cloud database.

The Worker must be stateless between requests.

Use ctx.waitUntil() for lightweight asynchronous metadata and AI processing after bookmark persistence.

Do not use Node setTimeout, in-memory timers or server filesystem assumptions as a persistent job system.

Do not add Cloudflare Queues unless the existing workload genuinely requires durable background execution.

## Supabase integration in the Worker

Read and apply the installed Supabase server skill.

Use the supported Supabase server integration for Cloudflare Workers and Hono.

For every authenticated request:

1. Read the Bearer token.
2. Validate the Supabase Auth JWT.
3. Verify its signature and claims using the supported JWKS integration.
4. Obtain the authenticated user ID.
5. Create/use a user-scoped Supabase client.
6. Execute database operations under the authenticated user's RLS policies.

Never trust a user_id provided in the request body.

Derive ownership from the verified authentication context.

Do not use the Supabase secret key as a shortcut for ordinary user-level CRUD operations.

If an administrative operation genuinely requires it, isolate that operation and enforce explicit server-side ownership checks.

The secret key must never be returned to the app.

## API endpoint migration

Preserve the existing bookmark API contracts as much as possible.

Implement or migrate:

GET /health

POST /api/bookmarks

GET /api/bookmarks

GET /api/bookmarks/:id

PATCH /api/bookmarks/:id

DELETE /api/bookmarks/:id

GET /api/bookmarks/search

GET /api/categories

GET /api/tags

POST /api/bookmarks/:id/reprocess

Ensure all bookmark operations are authenticated.

## Cloudflare environment variables

Configure:

SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_JWKS_URL
GROQ_MODEL
GROQ_VISION_MODEL
CORS_ORIGINS

Use encrypted Cloudflare Worker secrets for:

GROQ_API_KEY
SUPABASE_SECRET_KEY, only when necessary.

Never upload the existing .env file as a committed artifact.

Never place private credentials in wrangler vars.

Use Wrangler's secure secret management commands.

## CORS

Allow the appropriate origins for:

- Capacitor Android.
- Local Vite development.
- Browser development where needed.

Support Authorization and Content-Type headers.

Do not use an insecure unrestricted credentialed CORS configuration.

## Deployment

Inspect existing Worker configuration.

If an existing project Worker is configured, reuse it.

Otherwise, propose the name savr-api.

Before creating a conflicting or unfamiliar resource, ask me.

Use the authenticated Cloudflare account.

Deploy using:

npx wrangler deploy

Verify the deployed endpoint.

Do not stop after uploading code.

Verify the actual deployed:

GET /health

Then verify at least one authenticated API operation.

The final backend must work without relying on my Fedora laptop being online.

# 9. COVER IMAGE SYSTEM — HIGHEST PRIORITY UI FIX

The existing application has a serious visual issue: bookmark cards frequently fail to load their images.

Fix the actual root cause.

Do not merely add fallback images and mark the task complete.

First inspect:

- Current image extraction code.
- Stored thumbnail URLs.
- Image response headers.
- Redirect handling.
- Expired image URLs.
- Hotlink restrictions.
- Android WebView behaviour.
- Mixed-content problems.
- Image loading errors.
- Incorrect URL normalization.
- CORS where images are fetched programmatically.
- Current React image components.
- Worker response content types if using an image proxy.

Record the failure causes before changing the implementation.

## Cover image extraction priority

Build a dedicated extraction pipeline.

Priority:

1. Shared image/cover provided by Android Intent.
2. Official platform oEmbed response when available.
3. Official platform API when credentials and permissions exist.
4. Open Graph image metadata.
5. Twitter Card image.
6. YouTube thumbnail based on a verified video ID.
7. Other permitted public preview metadata.

For Instagram and X:

- Handle public metadata where legitimately accessible.
- Do not assume every link exposes content.
- Do not bypass login.
- Do not circumvent CAPTCHAs.
- Do not scrape protected content.
- Do not fabricate a thumbnail and present it as the real post image.

Support Android sharing of:

- text/plain.
- image/*.
- ACTION_SEND_MULTIPLE where practical.
- EXTRA_STREAM.
- ClipData.

When the user shares a screenshot or image along with a link, preserve it as an available cover candidate.

## Best cover selection

If several candidates are available, select the best actual content image.

Reject:
- Tiny profile avatars.
- Logo-only images where a better content image exists.
- Blank images.
- Broken image links.
- Unsupported content types.
- Images with suspicious or invalid redirects.

Prefer sufficiently large content previews.

Preserve the original image aspect ratio.

If the original cover is portrait, display it in portrait proportions.

If it is landscape, preserve the landscape ratio.

The home feed must visually resemble a polished social bookmark application.

## WhatsApp-style content preview

I want someone to understand what the saved Reel or post is about just by seeing its cover.

Each bookmark card should have:

- Large meaningful content cover.
- Small platform identity.
- Clear title.
- One-line description.
- Primary category.
- Short topic tags.

Keep the actual information available inside the bookmark detail screen.

The detail screen should show:

- Full cover image.
- Original title.
- Source platform.
- Available caption.
- AI-generated summary.
- Topic tags.
- Content type.
- Original link.
- Personal notes.
- Cover image source and extraction status where useful.

Add a subtle category indicator over the cover if it improves readability.

Do not clutter the image.

## Missing cover handling

If the source does not provide an accessible image:

- Keep the bookmark.
- Show a polished source-specific fallback.
- Display any available title and topic information.
- Provide an option to attach or replace the cover manually.
- Allow users to share a screenshot image into Savr.

Do not use random stock photographs.

Never pretend a generated placeholder is the original Reel cover.

## Cover caching

Use local file caching for image performance.

Save downloaded eligible cover images into the Android application's private cache.

Store their local paths in SQLite.

Reuse cached covers rather than downloading the same image on every feed refresh.

For permitted remote image resources, implement appropriate caching through the Worker or Supabase Storage.

Do not expose private bookmark covers publicly.

# 10. IMPROVE REEL TOPIC RECOGNITION

Currently, some Instagram Reels are saved without the correct topic because the backend only receives their URL.

Fix this with a progressive content understanding pipeline.

Do not assume the URL itself contains the topic.

## Stage 1: Extract available textual evidence

Collect:

- Share-provided text.
- Caption.
- Hashtags.
- Post title.
- Open Graph description.
- Page metadata.
- Accessible description.
- Available transcript text where legitimately provided.

Normalize this information.

Remove repeated boilerplate and unnecessary tracking content.

## Stage 2: Efficient text classification

Use the configured GROQ_MODEL.

Send a concise classification prompt.

The output must contain:

{
  "category": "Knowledge",
  "topic": "Thermodynamics",
  "tags": [
    "Entropy",
    "Physics",
    "Science"
  ],
  "content_type": "educational",
  "summary": "A brief explanation of the saved content.",
  "confidence": 0.91,
  "evidence_source": "caption_and_metadata",
  "insufficient_content": false
}

Categories should include:

Knowledge
Funny
Entertainment
Education
Technology
Programming
Motivation
Lifestyle
Fitness
News
Inspiration
Travel
Other

Support specific topics separately from broad categories.

Examples:

Category: Knowledge
Tags: Entropy, Physics, Thermodynamics.

Category: Funny
Tags: Cats, Reaction, Meme.

Category: Technology
Tags: Artificial Intelligence, LLMs, Machine Learning.

Do not overload the primary category with dozens of different values.

## Stage 3: Conditional vision classification

This is particularly important for Reels.

If text classification has insufficient evidence or confidence is below an appropriate threshold, and a real cover image is available:

Use one vision-capable Groq model as a fallback.

Do not run vision on every bookmark.

Do not replace the existing configured text model.

Inspect whether the existing GROQ_MODEL supports image input.

If it supports vision, reuse it.

Otherwise, check whether an additional GROQ_VISION_MODEL is configured or whether an explicitly approved vision-capable Groq model is available.

If a new model or configuration is required and not already available, ask me before adding it.

Vision requirements:

- Use only one meaningful cover image.
- Use a suitably compressed image.
- Ask for a concise description and topic classification.
- Prefer visual understanding and OCR when relevant.
- Combine image evidence with available captions.
- Never infer facts not supported by the image.

Only run this fallback when textual evidence is insufficient.

If there is no accessible cover and no meaningful text, return an insufficient-content status rather than inventing a topic.

Do not download protected video content for analysis.

Do not process entire Reels.

## Stage 4: Confidence and accuracy

Implement confidence-aware classification.

When there is insufficient evidence:

- Keep the bookmark saved.
- Mark it as awaiting enrichment or insufficient content.
- Do not invent a specific category.

Allow users to correct tags manually.

Preserve manual overrides.

Use a consistent tag-normalization strategy.

Avoid repeating AI requests.

Cache completed classification results using a content fingerprint.

Only reprocess when the user explicitly requests it or when meaningful new metadata becomes available.

# 11. LOW TOKEN USAGE — IMPORTANT

I want good categorization without wasting Groq tokens.

Optimize the entire AI pipeline.

Requirements:

1. One concise text-classification call per new bookmark when sufficient text exists.
2. Vision only as a fallback.
3. No repeated AI calls when opening bookmarks.
4. No AI calls when refreshing the feed.
5. Avoid sending irrelevant HTML.
6. Extract only relevant metadata and text.
7. Limit input length.
8. Limit completion output.
9. Use structured JSON output.
10. Cache results.
11. Use manual reprocessing rather than endless background retries.
12. Handle rate limits without repeatedly calling the provider.

Aim for a short response containing:

- One category.
- Three to six useful tags.
- One short summary.
- Confidence and evidence source.

Keep summaries approximately one sentence and avoid lengthy explanations.

Use an appropriate token budget, approximately 150–220 output tokens for the simple classifier, adjusted for the model and valid structured output.

Do not sacrifice classification quality merely to reduce token counts.

Vision is more expensive than text: use it only when it adds information. For example, Groq documents a vision model with image input and a 2,048-token image budget, making conditional fallback preferable to sending every cover for analysis.

# 12. SEARCH AND DATA EXPERIENCE

Keep the existing search functionality.

Improve it to work with:

- Titles.
- Summaries.
- Descriptions.
- Tags.
- Categories.
- Available extracted text.

Support platform and category filtering.

Perform search locally for fast access where appropriate, and synchronize changes from the Worker.

Do not rebuild the entire interface.

Retain the existing Savr design language.

# 13. BACKGROUND PROCESSING ON WORKERS

Use Cloudflare Workers' supported execution context for post-response metadata and AI processing.

Implement:

- Bookmark persisted first.
- Initial response returned immediately.
- Background metadata enrichment.
- Background AI classification.
- Supabase update.
- Processing-status polling or refresh.

Avoid heavy synchronous API requests.

Avoid Node-specific background workers and in-memory process queues.

If a job needs durable execution beyond the practical limits of a simple Workers request, explain that and ask before introducing Cloudflare Queues.

# 14. CLOUDflare DEPLOYMENT

Perform the complete deployment.

First inspect:

npx wrangler whoami

Check:

- Existing Wrangler configuration.
- Existing Worker names.
- Existing deployment.
- Cloudflare account.
- Current compatibility date.

Reuse existing configuration if appropriate.

Otherwise, create a suitable Worker configuration with a sensible Worker name, such as savr-api.

Use Cloudflare secret management for private credentials.

Keep:

GROQ_API_KEY
SUPABASE_SECRET_KEY

as encrypted secrets.

Do not expose them in:
- Source code.
- Git.
- Wrangler plaintext variables.
- Frontend environment variables.
- Build artifacts.

Configure the Worker environment.

Deploy.

Capture the actual deployed Worker URL.

Verify:
- Health endpoint.
- CORS.
- Supabase Auth verification.
- Bookmark creation.
- Bookmark retrieval.
- Background enrichment.
- AI categorization.

If deployment requires additional account permissions or an action I must approve, pause and ask me.

Do not claim deployment is finished until verification succeeds.

# 15. FRONTEND AND ANDROID MIGRATION

After deploying the Worker:

Update the existing application API configuration to use the deployed Worker URL.

The Android APK must not depend on the Fedora computer running a local backend.

Keep Supabase URL and publishable key in the public frontend configuration.

Never bundle the Supabase secret or Groq key.

Keep existing Android Sharesheet functionality.

Preserve the working native share receiver.

The share flow must continue to:

1. Receive the content.
2. Save locally to SQLite immediately.
3. Synchronize to the Worker.
4. Persist to Supabase.
5. Return to the original application.
6. Display a small confirmation.

When offline, save locally and synchronize later.

Do not change the one-selection sharing experience unless required to fix an existing defect.

# 16. PERFORMANCE AND CODE QUALITY

This application should remain lightweight.

Prioritize:

- Fast initial app loading.
- Fast local SQLite reads.
- Low network requests.
- Image caching.
- No repeated image downloads.
- No repeated Groq calls.
- Efficient Supabase queries.
- Proper pagination.
- Lazy-loaded images.
- Minimal unnecessary React re-renders.
- Clean TypeScript types.
- Shared validation schemas where practical.
- Consistent error handling.

Do not add unnecessary libraries.

Do not create complex infrastructure for a simple bookmark manager.

Keep the implementation readable and modular.

# 17. VERIFICATION

Do not create an enormous test suite.

Run focused verification of the actual problems.

## Supabase

- Auth sign-in works.
- Existing authenticated users work.
- A user can read their own bookmarks.
- A user cannot access another user's bookmarks.
- Bookmark insert/update/delete works.
- RLS policies actually work.
- Database migrations are applied.
- Storage access is private where required.

## SQLite sync

- Local bookmark save is immediate.
- Local records are displayed without waiting for the network.
- Pending changes synchronize.
- Duplicates are prevented.
- Failed sync retries.
- Local images remain available when cached.
- User data is isolated between sessions.

## Cover images

Test:
- Instagram Reel.
- Instagram post.
- X post.
- YouTube video.
- Ordinary website.

Verify actual thumbnail selection and Android rendering.

Do not mark image support as successful simply because a fallback appears.

## AI

Test:
- A text-heavy educational post.
- A funny post.
- A technical post.
- A Reel with available visual metadata.
- A Reel with insufficient metadata.

Verify relevant tags and ensure insufficient content is not hallucinated.

Measure the number of Groq calls per bookmark and ensure feed refresh does not cause additional calls.

## Cloudflare

- Worker deploy succeeds.
- Health endpoint responds.
- Authentication verification works.
- Supabase operations work from the deployed Worker.
- AI processing updates Supabase.
- Image routes work where supported.

## Android

- Existing Android app builds.
- Existing Sharesheet integration still works.
- Bookmark saves on-device first.
- Offline queue persists.
- Deployed Worker is used instead of localhost.
- Images render correctly.

# 18. FINAL DELIVERY

At completion, provide:

1. Existing architecture and changes made.
2. Custom authentication code removed.
3. Supabase Auth integration status.
4. Database migration files created.
5. Supabase tables and RLS policies applied.
6. Local SQLite architecture.
7. Synchronization implementation.
8. Cover image extraction improvements.
9. AI categorization improvements.
10. Groq token-saving strategy.
11. Cloudflare Worker deployment URL.
12. Cloudflare deployment verification.
13. Environment configuration changes.
14. Android APK output location.
15. Core verification results.
16. Any remaining limitations.

Do not reveal any credential values in your report.

Do not leave an incomplete deployment while claiming success.

Do not delete the local SQLite backup.

Do not remove the existing application functionality unnecessarily.

**FINAL OBJECTIVE: Upgrade the EXISTING SAVR Android app into a fast offline-first mobile bookmark library with Supabase authentication and cloud storage, a deployed Cloudflare Workers backend, reliable cover previews, and low-token intelligent content categorization.**