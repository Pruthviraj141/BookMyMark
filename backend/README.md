# SAVR — Cloudflare Worker Backend Service (`savr-api`)

This directory houses the serverless edge backend for SAVR, deployed on **Cloudflare Workers** using Hono and TypeScript.

Live Deployment URL:
```
https://savr-api.markyourday.workers.dev
```

---

## 1. Responsibilities

In SAVR's simplified architecture, the Cloudflare Worker does **NOT** act as a general database CRUD middleman. Normal bookmark queries and mutations go directly from the frontend to Supabase using Row-Level Security (RLS).

The Worker is dedicated strictly to two edge responsibilities:

1. **`GET /api/link-preview?url=...`**
   - Retrieves OpenGraph, Twitter Card, and oEmbed metadata for external URLs.
   - Cached at Cloudflare's CDN Edge for 24 hours (`caches.default`) with `X-Cache: HIT` / `X-Cache: MISS`.
   - Returns temporary display-only image URLs. Does not store image blobs or populate database tables.
   - Built-in SSRF protection (rejects localhost, RFC 1918 private IPs, and loopback addresses).

2. **`POST /api/bookmarks/:id/enrich`**
   - Authenticated endpoint protected by Supabase JWT verification.
   - Confirms bookmark ownership under the caller's RLS context.
   - Runs asynchronous background execution (`c.executionCtx.waitUntil`) to:
     - Scrape textual metadata (titles, captions, page excerpts).
     - Call **Groq API** with model `openai/gpt-oss-20b`.
     - Cap output tokens to ~160 tokens with structured JSON output.
     - Update bookmark category, tags, and summary directly in Supabase.

3. **`GET /health`**
   - Public health check confirming edge status and worker deployment.

---

## 2. Directory Structure

```
backend/
├── src/
│   ├── worker.ts                  # Hono edge entry point and route handlers
│   ├── services/
│   │   ├── extractor.service.ts       # HTML & oEmbed metadata scraper
│   │   ├── groq-classifier.service.ts # Text-only Groq LLM integration
│   │   └── platform.service.ts        # URL platform detector (Instagram, X, YouTube, etc.)
│   └── utils/
│       └── url.utils.ts               # URL normalization, parsing, and SSRF checks
├── wrangler.jsonc                 # Cloudflare Worker configuration & environment bindings
└── package.json                   # Dependencies
```

---

## 3. Deployment

To deploy updates to Cloudflare Workers:
```bash
cd backend
npx wrangler deploy
```

Worker secrets (`GROQ_API_KEY`, `SUPABASE_SECRET_KEY`) are managed securely via Wrangler encrypted secrets:
```bash
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put SUPABASE_SECRET_KEY
```
