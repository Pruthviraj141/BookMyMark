# SAVR — PHASE 1: BACKEND ENGINEERING MASTER PROMPT

You are a senior TypeScript backend engineer and AI application architect.

Your task is to implement the complete backend foundation for SAVR, an Android-first intelligent bookmark application.

This is Phase 1 of a two-phase project.

Your responsibility is exclusively the backend. Do not start building React screens, Capacitor UI, Android activities or native Kotlin share integration in this phase.

The final result must be a working, locally runnable API that Phase 2 can integrate without changing its contracts.

## 1. PRODUCT CONTEXT

SAVR allows users to save content from:

- Instagram posts and Reels.
- X/Twitter posts.
- YouTube videos.
- Reddit.
- TikTok.
- Normal websites.

Users share links with SAVR. The backend stores the bookmark, extracts available metadata and uses Groq AI to generate categories, tags and summaries.

The backend initially runs on my Fedora computer. Later, we intend to deploy Hono on Cloudflare Workers.

For now, use local SQLite and do not deploy anything.

## 2. EXISTING PROJECT — INSPECT FIRST

The existing directory structure is:

savr/
  frontend/
  backend/

I have already initialized the project and installed dependencies.

Inspect the existing files before making changes.

Do not:
- Recreate the project.
- Delete package files.
- Overwrite existing environment variables.
- Reinstall everything unnecessarily.
- Print API keys in logs.
- Replace the configured Groq model.

Work only inside the backend directory.

If an essential dependency is missing, install only that dependency.

Existing Groq configuration:

GROQ_API_KEY
GROQ_MODEL

Read these from the existing backend environment.

If JWT_SECRET is missing, add a separate development configuration for it without touching existing Groq credentials.

## 3. TECHNOLOGY STACK

Use:

- Node.js
- TypeScript
- Hono
- @hono/node-server
- better-sqlite3
- Groq SDK
- Cheerio
- Zod
- bcryptjs
- Vitest

Use a lightweight JWT library only if required and not already available.

Do not introduce:
- Next.js.
- Express.
- Supabase.
- Firebase.
- Prisma.
- Redis.
- Docker.
- LangChain.
- Microservices.
- Vector databases.

Keep the implementation straightforward.

## 4. PROJECT STRUCTURE

Create a clean backend structure:

backend/
  src/
    index.ts
    app.ts

    config/
      env.ts

    routes/
      auth.routes.ts
      bookmark.routes.ts
      category.routes.ts
      health.routes.ts

    middleware/
      auth.middleware.ts
      error.middleware.ts

    services/
      auth.service.ts
      bookmark.service.ts
      metadata.service.ts
      ai.service.ts
      platform.service.ts

    repositories/
      user.repository.ts
      bookmark.repository.ts

    database/
      connection.ts
      migrations/
      schema.ts

    providers/
      groq.provider.ts

    validators/
      auth.validator.ts
      bookmark.validator.ts

    types/
      index.ts

    utils/
      url.utils.ts
      response.utils.ts

  data/
  tests/

Use sensible separation of responsibilities. Avoid unnecessary abstractions.

## 5. SQLITE DATABASE

Use better-sqlite3.

Create two primary tables.

### users

- id
- username
- password_hash
- created_at

### bookmarks

- id
- user_id
- url
- normalized_url
- platform
- title
- description
- thumbnail_url
- author_name
- shared_text
- extracted_text
- summary
- category
- tags_json
- content_type
- ai_status
- ai_confidence
- ai_error
- notes
- created_at
- updated_at

Requirements:

- Use parameterized queries.
- Create appropriate indexes.
- Add user ownership constraints.
- Prevent duplicate bookmarks per user using a unique constraint.
- Use JSON storage for tags.
- Preserve manually edited content when AI reprocessing occurs.

Create automatic database initialization or a migration command.

Do not overengineer database management.

## 6. USER AUTHENTICATION

Implement simple username/password authentication.

Endpoints:

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

POST /api/auth/logout

Requirements:

- Validate requests using Zod.
- Hash passwords using bcryptjs.
- Never store plaintext passwords.
- Never return password hashes.
- Use signed bearer tokens.
- Keep token signing secrets on the backend.
- Enforce authentication for bookmark endpoints.
- Add a simple logout response.

Use a straightforward session strategy suitable for the prototype.

Make sure the API returns the authenticated user ID to the frontend through the authentication endpoint.

## 7. PLATFORM DETECTION

Implement URL-based platform detection.

Recognize:

- instagram.com
- x.com
- twitter.com
- youtube.com
- youtu.be
- reddit.com
- tiktok.com

Return a normalized platform identifier:

instagram
x
youtube
reddit
tiktok
website
unknown

Preserve meaningful post identifiers and URL parameters.

Avoid incorrectly identifying unrelated domains that merely contain a platform's name.

## 8. METADATA EXTRACTION

Build a dedicated metadata service using Cheerio.

Extract available:

- og:title
- og:description
- og:image
- twitter:title
- twitter:description
- twitter:image
- HTML title
- Meta description
- Canonical URL when appropriate

Use:
- Request timeouts.
- Limited response sizes.
- Reasonable user-agent headers.
- Redirect limits.

For YouTube, support extracting a thumbnail when the video ID can be reliably identified.

Instagram and X may block or restrict extraction.

Do not:
- Bypass authentication.
- Circumvent CAPTCHAs.
- Download entire videos.
- Fabricate unavailable information.

Implement basic SSRF protection:

- Allow only HTTP and HTTPS.
- Reject localhost and private IP ranges.
- Validate DNS resolutions.
- Revalidate redirect destinations.
- Limit redirects and response size.

When extraction fails, preserve the original URL and supplied shared text.

Do not allow metadata extraction failures to destroy bookmarks.

## 9. GROQ AI CLASSIFICATION

Implement the Groq provider using the existing GROQ_API_KEY and GROQ_MODEL.

Do not hardcode a new model.

AI classification should use available evidence:

1. Shared text.
2. Extracted description.
3. Page title.
4. Available caption.
5. Legally accessible extracted text.

Do not classify from a URL alone.

Return structured output:

{
  "category": "Knowledge",
  "tags": ["Entropy", "Physics", "Science"],
  "content_type": "educational",
  "summary": "An explanation of entropy in physics.",
  "confidence": 0.92,
  "insufficient_content": false
}

Categories:

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

Rules:

- Generate approximately 3–6 relevant tags when sufficient evidence exists.
- Use concise, meaningful tags.
- Avoid generic or repetitive tags.
- Do not invent content.
- Validate AI output using Zod.
- Handle malformed JSON, timeout and rate-limit errors.
- Keep the AI API key exclusively on the backend.

When there is insufficient content, return an appropriate insufficient-content status.

## 10. BOOKMARK PROCESSING PIPELINE

This is the main business workflow.

When a bookmark is submitted:

1. Validate the URL.
2. Identify its platform.
3. Normalize its URL.
4. Check whether it already exists for this user.
5. Insert a SQLite record immediately.
6. Return the bookmark response immediately.
7. Run metadata extraction.
8. Run AI classification using available content.
9. Update the bookmark with available metadata and AI results.
10. Make its current processing state retrievable.

Use a lightweight in-process background queue.

Do not add Redis or external queue infrastructure.

Do not make the API wait for Groq to complete.

Support these processing states:

pending
processing
completed
failed
insufficient_content

If a bookmark fails to process, it must remain saved.

Handle duplicate bookmarks gracefully without creating multiple records.

## 11. API CONTRACT — IMPORTANT FOR PHASE 2

These APIs are the contract that Phase 2 must use.

Do not change these endpoint names or request structures without a compelling reason. Document any necessary change explicitly.

### Health

GET /health

### Authentication

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

POST /api/auth/logout

### Create bookmark

POST /api/bookmarks

Request:

{
  "url": "https://x.com/example/status/123",
  "sharedText": "Optional shared content",
  "title": null
}

Require a valid authenticated bearer token.

Return immediately after the bookmark is persisted.

### List bookmarks

GET /api/bookmarks

Support:

- page
- limit
- platform
- category
- tag
- content_type
- ai_status

### Individual bookmark

GET /api/bookmarks/:id

PATCH /api/bookmarks/:id

DELETE /api/bookmarks/:id

### Search

GET /api/bookmarks/search?q=entropy

Search across available:

- Title.
- Description.
- Summary.
- Tags.
- Shared text.
- Extracted text.

### Additional endpoints

GET /api/categories

GET /api/tags

POST /api/bookmarks/:id/reprocess

Implement consistent response structures.

Example successful response:

{
  "success": true,
  "data": {},
  "message": "Bookmark saved successfully"
}

Duplicate submissions should return the existing record and a clear duplicate indicator.

Every query must enforce user ownership.

## 12. CLOUD-READY ARCHITECTURE WITHOUT DEPLOYMENT

The current implementation must use SQLite and Node.js.

However, keep these boundaries clean:

- HTTP routes should not contain SQL.
- Business services should not depend directly on SQLite implementation details.
- Repository methods should isolate database operations.
- Groq access should be isolated in a provider.
- Environment configuration should remain centralized.

We will eventually deploy Hono on Cloudflare Workers and move persistence to Cloudflare D1.

Do not implement D1 now.

Do not introduce unnecessary abstractions just for future migration.

Use portable Web APIs where practical, but retain better-sqlite3 for the local prototype.

## 13. LOCAL DEVELOPMENT

Run the backend on:

HOST=0.0.0.0
PORT=3000

Provide npm commands for:

npm run dev
npm run build
npm start
npm test

Configure CORS for:

- http://localhost:5173
- capacitor://localhost
- http://localhost

Allow appropriate headers, especially Authorization and Content-Type.

Create a .env.example without real secrets.

Never overwrite the user's existing .env.

## 14. CORE VERIFICATION

Do not write an unnecessarily large testing suite.

Run focused checks for:

1. Server starts successfully.
2. Database initializes.
3. Registration and login work.
4. Password hashing works.
5. Authenticated bookmark creation works.
6. Duplicate URLs are handled.
7. Platform identification works.
8. Metadata extraction works using a controlled HTML fixture.
9. Groq responses are validated.
10. AI failures do not delete bookmarks.
11. Bookmark retrieval works.
12. Search and filtering work.
13. User ownership is enforced.

Mock Groq in automated tests.

Also perform one real Groq test if credentials are configured and the network is available.

Do not claim a real test succeeded if you did not execute it.

## 15. PHASE 1 DEFINITION OF DONE

Phase 1 is complete only when:

- Hono server runs.
- SQLite database persists records.
- Username/password authentication works.
- Bookmark API works.
- Platform detection works.
- Available metadata is extracted.
- Groq categorization works when sufficient content is available.
- Background processing updates bookmark records.
- Search and filtering work.
- Duplicate bookmarks are prevented.
- The API is reachable from the local network.
- Basic tests pass.

## 16. PHASE 1 HANDOFF DOCUMENT

At completion, create:

backend/README.md

and:

backend/API_CONTRACT.md

The API contract must include:

- All endpoints.
- Required headers.
- Authentication format.
- Request schemas.
- Response schemas.
- Bookmark processing states.
- Duplicate response behaviour.
- Exact API base URL configuration approach.
- Relevant error codes.

Provide:
- Project structure.
- Installation status.
- Backend startup command.
- Example curl commands.
- Actual test results.
- Any remaining limitations.

STOP after completing Phase 1.

Do not build React screens or modify the Android project in this phase.

Do not start Phase 2 automatically.

The next phase will consume the working backend and API_CONTRACT.md.

**Your objective is a reliable, clean backend that the Savr Android application can consume without another backend rewrite.**