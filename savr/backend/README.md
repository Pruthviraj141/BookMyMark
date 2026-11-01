# MyBookMark — Backend Service (Phase 1)

**MyBookMark** is a personal, visual, AI-categorized bookmark library built for Android and web. This repository houses the Phase 1 backend service: a TypeScript Hono API backed by SQLite, Cheerio metadata extraction, and Groq LLM classification.

---

## 1. Project Structure

```
savr/backend/
├── API_CONTRACT.md               # Complete API specifications for Phase 2
├── README.md                     # Service documentation and setup instructions
├── .env                          # Local environment secrets (ignored by git)
├── .env.example                  # Environment template
├── package.json                  # Dependencies and run scripts
├── tsconfig.json                 # TypeScript compiler configuration
├── vitest.config.ts              # Vitest sequential test configuration
├── data/
│   └── savr.db                   # SQLite database (persisted)
├── src/
│   ├── index.ts                  # Server entry point (@hono/node-server)
│   ├── app.ts                    # Hono application setup and CORS
│   ├── config/
│   │   └── env.ts                # Environment validation (Zod)
│   ├── database/
│   │   ├── connection.ts         # better-sqlite3 connection manager
│   │   ├── schema.ts             # SQLite tables and indexes
│   │   └── migrations/           # Schema migration directory
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT verification middleware
│   │   └── error.middleware.ts   # Global error and 404 handler
│   ├── providers/
│   │   └── groq.provider.ts      # Groq AI classification provider
│   ├── repositories/
│   │   ├── user.repository.ts    # SQLite queries for users
│   │   └── bookmark.repository.ts# SQLite queries for bookmarks
│   ├── routes/
│   │   ├── auth.routes.ts        # /api/auth (register, login, me, logout)
│   │   ├── bookmark.routes.ts    # /api/bookmarks (CRUD, search, reprocess)
│   │   ├── category.routes.ts    # /api/categories, /api/tags
│   │   └── health.routes.ts      # /health check
│   ├── services/
│   │   ├── auth.service.ts       # bcrypt hashing and JWT generation
│   │   ├── bookmark.service.ts   # Bookmark creation pipeline & async queue
│   │   ├── metadata.service.ts   # Cheerio parser with SSRF protection
│   │   ├── ai.service.ts         # AI classification orchestrator
│   │   └── platform.service.ts   # Platform detection (IG, X, YT, Reddit, etc.)
│   ├── types/
│   │   └── index.ts              # Domain types and interfaces
│   ├── utils/
│   │   ├── response.utils.ts     # Standardized JSON response helpers
│   │   └── url.utils.ts          # URL normalization, extraction and SSRF validation
│   └── validators/
│       ├── auth.validator.ts     # Zod schemas for auth
│       └── bookmark.validator.ts # Zod schemas for bookmarks
└── tests/
    ├── auth.test.ts              # User registration, bcrypt hash, and login tests
    ├── bookmark.test.ts          # Bookmarks CRUD, search, filter, and ownership tests
    ├── groq.test.ts              # Groq schema validation and live Groq API tests
    ├── metadata.test.ts          # Controlled HTML fixture metadata and SSRF tests
    └── platform.test.ts          # Platform recognition and YouTube ID parsing tests
```

---

## 2. Prerequisites & Installation Status

Dependencies are installed in `savr/backend/` using Node.js v22.23.1 and npm 10.9.8.

- Node version: `v22+`
- Key packages installed: `hono`, `@hono/node-server`, `better-sqlite3`, `groq-sdk`, `cheerio`, `bcryptjs`, `zod`, `vitest`, `tsx`.

To install dependencies on a new machine:
```bash
npm install
```

---

## 3. Configuration & Fedora Local IP Setup

1. Copy `.env.example` to `.env` if not present:
   ```bash
   cp .env.example .env
   ```
2. Verify existing Groq API configuration:
   - `GROQ_API_KEY`: Groq API Key
   - `GROQ_MODEL`: `openai/gpt-oss-20b` (or your configured model)
   - `JWT_SECRET`: Random secret string used for signing authentication tokens
   - `PORT`: `3000`
   - `HOST`: `0.0.0.0`
   - `DATABASE_PATH`: `./data/savr.db`

### Finding your Fedora Local IP for Android Testing
When testing on a physical Android device connected to the same Wi-Fi:
```bash
ip route get 1 | awk '{print $7;exit}'
```
Set `VITE_API_BASE_URL` in the frontend or Android app to:
```
http://<YOUR_FEDORA_IP>:3000
```

---

## 4. Run & Build Commands

- **Start in development mode (hot reload)**:
  ```bash
  npm run dev
  ```
- **Type check and build distribution**:
  ```bash
  npm run build
  ```
- **Start compiled production server**:
  ```bash
  npm start
  ```
- **Run all automated tests**:
  ```bash
  npm test
  ```

---

## 5. Example curl Commands

### Health Check
```bash
curl -X GET http://localhost:3000/health
```

### 1. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"pruthvi","password":"secure_password_123"}'
```

### 2. Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pruthvi","password":"secure_password_123"}'
```

Save the returned `token` to an environment variable:
```bash
TOKEN="<JWT_TOKEN_FROM_LOGIN>"
```

### 3. Save a Bookmark (Sharesheet & UI simulation)
```bash
curl -X POST http://localhost:3000/api/bookmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "sharedText": "Never Gonna Give You Up"
  }'
```

### 4. Search Bookmarks
```bash
curl -X GET "http://localhost:3000/api/bookmarks/search?q=Never" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. List Bookmarks with Filters
```bash
curl -X GET "http://localhost:3000/api/bookmarks?platform=youtube&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Get Categories & Tags
```bash
curl -X GET http://localhost:3000/api/categories -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:3000/api/tags -H "Authorization: Bearer $TOKEN"
```

---

## 6. Verification & Test Results

Executed with `npm test` (`vitest run`):
```
 ✓ tests/platform.test.ts (7 tests)
 ✓ tests/metadata.test.ts (5 tests)
 ✓ tests/auth.test.ts (6 tests)
 ✓ tests/bookmark.test.ts (10 tests)
 ✓ tests/groq.test.ts (3 tests)

 Test Files  5 passed (5)
      Tests  31 passed (31)
```

Core cases verified:
1. **Server starts & health endpoint**: Verified on `HOST=0.0.0.0` and `PORT=3000`.
2. **Database initialization**: SQLite schema tables (`users`, `bookmarks`) and indexes initialized with WAL / DELETE fallback.
3. **Registration & login**: Input validation with Zod, password hashed with bcrypt, plaintext passwords never stored or leaked.
4. **Duplicate protection**: Duplicate URLs per user are detected and normalized, returning the existing record with `is_duplicate: true`.
5. **Platform detection**: Accurate domain matching for Instagram, X/Twitter, YouTube, Reddit, TikTok, and websites.
6. **Metadata extraction**: HTML fixture extraction tests verify `og:*`, `twitter:*`, title, description, and canonical URL parsing.
7. **SSRF protection**: Blocks access to localhost, private IPv4 ranges (10.*, 172.16-31.*, 192.168.*, 169.254.*) and IPv6 local addresses.
8. **Groq AI classification**: Live API test executed against Groq using `openai/gpt-oss-20b`, returning structured output with confidence `0.95`.
9. **Failure resilience**: AI and network failures update `ai_status: 'failed'` and retain `ai_error` without deleting the bookmark.
10. **User ownership**: Verified that users cannot access, modify, or search other users' bookmarks.

---

## 7. Known Platform-Specific Metadata Limitations

1. **Instagram & X/Twitter Scraping Restrictions**:
   - Instagram Reels/posts and X posts often require authenticated sessions or serve dynamic JavaScript walls to standard HTTP scrapers.
   - Per design requirements, MyBookMark does not use unauthorized bypasses, CAPTCHA solvers, or private scraping APIs.
   - When Instagram or X restricts metadata retrieval, the bookmark remains safely preserved with the raw URL and any shared text provided by Android's `ACTION_SEND`.
2. **In-Memory Background Queue**:
   - The lightweight asynchronous processing queue operates in-process. If the backend process is terminated during active extraction, pending items can be re-triggered via `POST /api/bookmarks/:id/reprocess`.
