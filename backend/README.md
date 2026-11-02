# BookMyMark — Backend Edge API Service

This directory houses the high-performance serverless edge backend for **BookMyMark**, built with [Hono](https://hono.dev/), TypeScript, and deployed on [Cloudflare Workers](https://workers.cloudflare.com/).

---

## 1. Architecture & Responsibilities

In BookMyMark's modern **Local-First, Edge-Assisted** architecture:
- Core database queries and mutations communicate directly between the frontend client and Supabase PostgreSQL using Row-Level Security (RLS).
- The Backend Edge Worker handles metadata scraping, edge caching, and AI classification:

1. **`GET /api/link-preview?url=...`**
   - Extracts OpenGraph, Twitter Card, and oEmbed metadata for external URLs (Instagram, X, YouTube, articles, etc.).
   - Edge-cached via Cloudflare's CDN cache (`caches.default`) for 24 hours (`X-Cache: HIT` / `X-Cache: MISS`).
   - Returns temporary display-only thumbnail previews without storing bloated binary blobs in PostgreSQL.
   - Built-in SSRF protection (rejects localhost, RFC 1918 private subnets, and loopback addresses).

2. **`POST /api/bookmarks/:id/enrich`**
   - Authenticated endpoint protected by Supabase JWT verification.
   - Verifies bookmark ownership before running AI enrichment.
   - Uses non-blocking background execution (`c.executionCtx.waitUntil`):
     - Scrapes textual metadata (title, description, page excerpts).
     - Calls **Groq Cloud API** with model `openai/gpt-oss-20b`.
     - Output capped at 160 tokens for maximum speed and token efficiency.
     - Automatically classifies category, tags, and summary into Supabase.

3. **`GET /health`**
   - Health check endpoint returning runtime status.

---

## 2. Directory Structure

```
backend/
├── src/
│   ├── worker.ts                  # Cloudflare Worker & Hono edge entrypoint
│   ├── index.ts                   # Standalone Node.js server entrypoint (local dev/tests)
│   ├── app.ts                     # Hono application router
│   ├── config/                    # Environment variables validation (Zod)
│   ├── services/
│   │   ├── extractor.service.ts       # HTML & oEmbed metadata scraper
│   │   ├── groq-classifier.service.ts # Text-only Groq LLM integration
│   │   ├── metadata.service.ts        # Metadata normalization service
│   │   └── platform.service.ts        # URL platform detector (Instagram, X, YouTube, etc.)
│   ├── utils/
│   │   └── url.utils.ts               # URL normalization, parsing, and SSRF checks
│   └── validators/                # Request payload validation
├── tests/                         # Vitest test suite (Auth, Bookmarks, Metadata, Groq)
├── wrangler.jsonc                 # Cloudflare Worker configuration & environment bindings
└── package.json                   # Dependencies & scripts
```

---

## 3. Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your `GROQ_API_KEY` (free from [Groq Console](https://console.groq.com)) and your Supabase credentials.

### 3. Run Standalone Node Dev Server
```bash
npm run dev
```

### 4. Run Edge Worker locally with Wrangler
```bash
npx wrangler dev
```

### 5. Run Test Suite
```bash
npm test
```

---

## 4. Cloudflare Worker Deployment

To deploy to Cloudflare Workers:
```bash
npx wrangler deploy
```

Set production secrets securely via Wrangler:
```bash
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put SUPABASE_SECRET_KEY
```
