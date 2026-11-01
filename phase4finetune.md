# SAVR — TARGETED PERFORMANCE, COVER PREVIEW & AI CLASSIFICATION IMPROVEMENTS

Act as a senior TypeScript engineer, React/Capacitor developer, Supabase developer and Cloudflare Workers engineer.

Your task is to fine-tune my EXISTING working SAVR application.

This is NOT a new application build.

The app is already deployed using:

- React + Vite + TypeScript.
- Capacitor Android.
- Hono on Cloudflare Workers.
- Supabase Auth.
- Supabase PostgreSQL.
- Local SQLite.
- Groq API.
- Existing Android Sharesheet integration.

The current Cloudflare Worker:

https://savr-api.markyourday.workers.dev

The existing Groq model:

openai/gpt-oss-20b

The application is already functional.

Your focus is ONLY:
1. Fix post and Reel cover-image previews.
2. Improve text-based AI categorization.
3. Reduce unnecessary Groq token usage.
4. Improve application performance.
5. Preserve existing Supabase, Cloudflare and Android integrations.

## ABSOLUTE RULE: KEEP THIS PROJECT SIMPLE

This is a personal application, not an enterprise product.

Do not introduce:
- New AI providers.
- Vision models.
- Image AI.
- OCR.
- Video transcription.
- Image embeddings.
- Vector databases.
- New cloud databases.
- New microservices.
- Redis.
- Docker.
- Complex caching infrastructure.
- Complicated security frameworks.
- Unnecessary database migrations.

Reuse existing dependencies and infrastructure.

Do not rewrite working components unnecessarily.

# PHASE 1 — INSPECT EXISTING IMPLEMENTATION

First inspect:

- Existing bookmark creation workflow.
- Existing Groq classification service.
- Existing metadata extraction service.
- Existing image proxy.
- Existing BookmarkCard component.
- Existing bookmark feed.
- Existing Supabase bookmark schema.
- Existing SQLite implementation.
- Existing Cloudflare Worker configuration.
- Existing Supabase authentication.

Identify exactly why some cover images fail to render and why some bookmarks receive poor categories.

Read the installed relevant Supabase skills only where database or authentication changes are necessary.

Do not modify working authentication.

Keep existing Supabase Google OAuth as implemented.

Do not create new user tables or signup systems.

Do not overwrite environment files or credentials.

Ask me only if a genuinely important decision is unclear or a destructive change is required. Otherwise, proceed autonomously.

# PHASE 2 — COVER IMAGE PREVIEWS

THIS IS A DISPLAY-ONLY FEATURE.

I want saved Instagram Reels, Instagram posts, X tweets and YouTube videos to show their actual cover images, similar to how WhatsApp displays link previews.

The purpose is simple:

When I look at the bookmark feed, I should immediately recognize which Reel or tweet I saved by looking at its cover image.

## CRITICAL IMAGE STORAGE RULE

DO NOT STORE IMAGES.

Do not:
- Upload cover images to Supabase Storage.
- Download and permanently store cover files.
- Store image blobs.
- Store base64 images.
- Create image tables.
- Add image records.
- Add new image columns to Supabase.
- Add image storage to SQLite.

Do not populate the existing legacy thumbnail_url field.

Leave it unused and null for backward compatibility.

Do not delete the existing storage bucket or existing user data.

The image must be displayed directly from its publicly accessible external image URL.

## How image previews should work

Implement a small metadata preview endpoint in the existing Cloudflare Worker:

GET /api/link-preview?url=...

The endpoint should:

1. Receive an original bookmark URL.
2. Identify its platform.
3. Extract an available actual content preview image URL.
4. Extract available title and description if needed.
5. Return the metadata without saving the image URL to Supabase or SQLite.

Expected response:

{
  "success": true,
  "data": {
    "platform": "instagram",
    "title": "Example Reel",
    "description": "Available caption or description",
    "imageUrl": "https://public-image-host/example.jpg"
  }
}

Return null for imageUrl when no genuine preview is available.

Do not fabricate a cover URL.

## Preview extraction priority

Try these sources in order:

1. Shared content or image provided by Android.
2. Available official platform preview or oEmbed metadata.
3. Open Graph image.
4. Twitter Card image.
5. YouTube thumbnail using a validated video ID.
6. Other accessible public page metadata.

For Instagram and X, recognize that some posts do not expose public previews.

Do not bypass login requirements, CAPTCHAs or protected content.

Do not download videos.

Do not use random stock photographs.

Do not create an AI-generated cover.

## Frontend rendering

Modify the existing BookmarkCard component.

When a card becomes visible:

1. Request its link preview if one is not already available in memory.
2. Receive the image URL.
3. Render the image using a normal image element.
4. Preserve its natural aspect ratio.
5. Display it prominently above the title and description.

Use lazy loading.

Use a simple in-memory preview cache for the current app session to avoid repeatedly requesting the same preview.

Do not persist image URLs to the cloud database or local database.

When the app is reopened, previews may be resolved again.

Prioritize speed and simplicity.

## WhatsApp-style visual presentation

Cards should display:

- Actual cover image where accessible.
- Small Instagram/X/YouTube platform indicator.
- Original title.
- Short description.
- AI category.
- Topic tags.

The image should be the visual focus.

A user must be able to distinguish two different Reels by simply looking at their covers.

Keep the current Savr design and masonry layout.

Do not redesign the entire application.

## Missing image fallback

If the actual image is unavailable:

- Display a clean platform-specific fallback.
- Display the original post title.
- Display the available description.
- Keep the bookmark usable.

Do not show random pictures.

Do not treat a profile picture or generic platform logo as the actual post cover.

# PHASE 3 — KEEP IMAGE PROXY SIMPLE

Inspect the existing:

GET /api/proxy-image

Keep it lightweight.

I do not want an enterprise-level image proxy.

Do not introduce:
- Authentication infrastructure for public previews.
- Complex security middleware.
- Cloudflare image storage.
- Cloudflare R2.
- Persistent image caching.
- Multiple proxy services.
- Referrer spoofing to bypass restricted sources.

Keep only basic URL and image-response validation needed for normal operation:

- HTTP/HTTPS URLs.
- Reject localhost and private network destinations.
- Accept genuine image responses.
- Use a reasonable request timeout and response-size limit.
- Avoid following unsafe redirects.

The proxy should stream publicly accessible image data without creating a permanent stored copy.

If an external host blocks public access, show the normal fallback.

Do not attempt to defeat that restriction.

The proxy must not become an unrestricted URL-fetch endpoint.

# PHASE 4 — IMPROVE AI CATEGORIZATION

This is the second major priority.

Current model:

openai/gpt-oss-20b

Keep this exact existing model.

Do not add a visual model.

Do not pass any image to Groq.

Do not introduce OCR or image recognition.

The AI must use TEXT ONLY.

## Current classification problem

Some Instagram Reels receive incorrect or generic categories because the available content extraction is insufficient.

Improve the text extraction and classification workflow.

Before calling Groq, gather all available legitimate textual information:

- Text received through Android sharing.
- Instagram caption, when accessible.
- X post text, when accessible.
- Hashtags.
- Open Graph title.
- Open Graph description.
- Twitter Card description.
- YouTube title and description.
- Available webpage text.

Clean and normalize this text.

Remove repeated boilerplate and irrelevant metadata.

Do not classify using the URL alone.

## Better classification

Generate a compact JSON response:

{
  "category": "Knowledge",
  "topic": "Thermodynamics",
  "tags": [
    "Entropy",
    "Physics",
    "Science"
  ],
  "content_type": "educational",
  "summary": "A short explanation of entropy.",
  "confidence": 0.93
}

Supported categories:

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

Use broad categories and specific tags.

Examples:

Category: Knowledge
Tags: Entropy, Physics, Thermodynamics.

Category: Funny
Tags: Cats, Memes, Reactions.

Category: Technology
Tags: AI, Machine Learning, LLMs.

Category: Programming
Tags: JavaScript, React, Web Development.

Do not generate generic tags that add no value.

Do not assign Funny, Entertainment or Knowledge blindly.

Use the actual textual evidence.

## Insufficient content

If the platform does not provide enough text to identify the content:

- Do not invent a topic.
- Do not generate an inaccurate summary.
- Mark it as insufficient content.
- Preserve the bookmark.
- Allow manual tag editing.

A missing caption must not be treated as proof that the post contains no useful subject.

## Preserve manually edited information

If the user manually changes a category, title or tag, background reprocessing must not overwrite those changes.

# PHASE 5 — MINIMIZE GROQ TOKEN USAGE

I want high-quality text classification with minimum unnecessary token consumption.

Use the existing Groq model only.

Implement:

1. One classification call per new bookmark when sufficient text exists.
2. A concise classification instruction.
3. Limited input text.
4. Structured JSON output.
5. Approximately 3–5 meaningful tags.
6. A one-sentence summary.
7. A compact output token limit, approximately 120–180 tokens where the structured response permits.
8. Cache classification results using a fingerprint of normalized text.
9. Do not classify again when the content has not changed.
10. Never call Groq when the user merely opens the feed.
11. Never call Groq when a bookmark card becomes visible.
12. Never call Groq when loading a thumbnail.
13. Retry only when appropriate or manually requested.

Do not sacrifice classification quality merely to reduce token usage.

No images must ever be sent to the AI.

No additional AI model is required.

# PHASE 6 — PRESERVE DATABASE AND SYNCHRONIZATION

Keep the existing architecture:

Android local SQLite → Cloudflare Worker → Supabase PostgreSQL.

Do not create another database.

Do not create another bookmark table.

Do not add any new image-related database columns.

Keep all existing bookmark records.

Keep existing:
- Supabase Auth.
- RLS.
- Google OAuth.
- Local SQLite.
- Offline synchronization.
- Native Android share receiver.

Do not migrate or delete existing user data.

Keep the current user-specific bookmark isolation.

The image preview endpoint must not modify bookmark rows just to display images.

The classification process should only update existing text-based classification fields when necessary.

# PHASE 7 — PERFORMANCE

Keep this application fast.

Prioritize:

- Lazy image loading.
- In-memory preview metadata caching.
- No repeated preview requests during the same session.
- One AI call for new content.
- No AI calls on feed refresh.
- No image downloads for database storage.
- No unnecessary background jobs.
- No unnecessary API calls.
- Efficient bookmark pagination.
- Minimal React re-renders.

Do not add complicated infrastructure.

# PHASE 8 — CLOUDFLARE DEPLOYMENT

The backend is already deployed.

Existing Worker:

savr-api

Existing URL:

https://savr-api.markyourday.workers.dev

Do not create another Worker.

Inspect the current Cloudflare configuration.

Implement the required changes in the existing Worker.

Preserve the existing secrets and environment variables.

Do not overwrite GROQ_API_KEY, GROQ_MODEL or Supabase configuration.

Build and verify locally where supported.

Deploy the updated existing Worker with Wrangler.

Verify:

- GET /health
- GET /api/link-preview for a publicly accessible test page.
- Existing bookmark creation.
- Existing bookmark retrieval.
- Existing AI processing.

Do not claim deployment succeeded unless the deployed endpoints actually work.

# PHASE 9 — FOCUSED VERIFICATION

Do not create an unnecessarily large test suite.

Focus on these important cases:

1. Instagram Reel preview.
2. Instagram post preview.
3. X post preview.
4. YouTube thumbnail preview.
5. A normal website preview.
6. Missing image fallback.
7. Successful text classification.
8. Insufficient-content handling.
9. No repeated AI request on feed refresh.
10. No image data or image URL written to bookmark database fields.
11. Existing Supabase authentication works.
12. Existing Android sharing still works.

Inspect real results.

If an Instagram or X post does not publicly expose a cover image, document that limitation rather than fabricating a result.

Run the Android build after frontend changes.

Fix genuine compilation errors.

# PHASE 10 — FINAL DELIVERY

At completion, provide:

- Root cause of the original image issue.
- Cover-preview implementation details.
- Confirmation that no cover images are stored.
- Confirmation that no new image database columns were added.
- Confirmation that no visual AI model was added.
- Groq token usage improvements.
- AI classification examples.
- Cloudflare deployment URL.
- Deployment verification.
- Android APK build status.
- Remaining platform limitations.

Do not rewrite working systems.

Do not create unnecessary architecture.

Do not add unnecessary subscriptions or paid services.

Do not change existing authentication.

Do not destroy existing bookmark data.

Do not ask questions about requirements already specified here.

Only pause and ask me if a genuinely important existing-project conflict or potentially destructive operation requires a decision.

**FINAL OBJECTIVE: Keep SAVR lightweight and fast. Show genuine Instagram, X and YouTube cover previews directly in the bookmark feed, without storing images or involving AI in image processing. Improve text-only Groq categorization while preserving the existing working application.**