# BookMyMark — Smart Visual Bookmark Library

<div align="center">

<img src="frontend/public/branding/bookmymark-symbol.svg" width="80" height="80" alt="BookMyMark Logo" />

### Intelligent, High-Performance Multi-Platform Visual Library & Knowledge Vault

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android_Native-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-Hono_API-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Groq AI](https://img.shields.io/badge/Groq-gpt--oss--20b-F05032)](https://groq.com/)

<p align="center">
  <b>BookMyMark</b> is a personal, visual, AI-categorized bookmarking application built for Android and Web. Save Instagram Reels, X (Twitter) threads, YouTube videos, and web articles seamlessly via the native Android Share Menu, with WhatsApp-style cover previews, instant local responsiveness, and automatic text-only Groq AI categorization.
</p>

[Architecture](#-architecture) •
[Key Features](#-key-features) •
[Quickstart Guide](#-quickstart-guide) •
[Project Structure](#-project-structure) •
[Building Android APK](#-building-the-android-apk) •
[API & Endpoints](#-api--endpoints) •
[Database Setup](#-database-setup)

</div>

---

## 🏗 Architecture

BookMyMark uses a modern **Local-First, Edge-Assisted** serverless architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 Android Device / Web Client                 │
│                                                             │
│  • React 19 + Vite + Tailwind CSS                           │
│  • Capacitor Android Native Bridge                          │
│  • Instant Local Cache (<1ms UI response)                   │
│  • Client-side YouTube preview (0 backend calls)            │
│  • Viewport-based lazy loading (IntersectionObserver)       │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
    Direct CRUD│(Row-Level Security)           │AI Enrichment &
    via SDK    │                               │Link Preview
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│         Supabase             │ │  Cloudflare Worker          │
│                              │ │  (savr-api)                 │
│ • Google OAuth (JWT tokens)  │ │                             │
│ • PostgreSQL Database        │ │ • GET /health               │
│ • Full-Text Search (GIN)     │ │ • GET /api/link-preview     │
│ • Realtime WebSocket events  │ │   (Edge Cached, 24h)        │
│ • Row-Level Security (RLS)   │ │ • POST /api/bookmarks/      │
│                              │ │        :id/enrich           │
│                              │ │ • Text-Only Groq Classifier │
│                              │ │   (openai/gpt-oss-20b)      │
└──────────────────────────────┘ └─────────────────────────────┘
```

---

## 🌟 Key Features

### 1. 📱 Native Android Share Menu Integration
Save links from any mobile app (Instagram, X, YouTube, Reddit, Chrome) by tapping **Share → BookMyMark**.
- **Instant Intake:** Shares save directly to PostgreSQL or queue locally when offline.
- **One-Tap Experience:** Authenticated shares save and trigger an instant toast without disrupting your workflow.

### 2. 🖼️ WhatsApp-Style Cover Previews (Zero Database Image Storage)
- **Client-Side YouTube Recognition:** Instant thumbnail generation (`https://i.ytimg.com/vi/${id}/hqdefault.jpg`) with 0 network calls.
- **Cloudflare Edge Cache (`caches.default`):** Web link previews are cached at Cloudflare edge locations for 24 hours (`X-Cache: HIT`).
- **Viewport-Based Lazy Loading:** Off-screen cards do not trigger network calls until approaching the viewport (`IntersectionObserver`).
- **Zero Image Bloat:** No binary image blobs are stored in Supabase or SQLite (`thumbnail_url: null`).

### 3. 🤖 Lightweight Text-Only Groq AI Classification
- **Model:** `openai/gpt-oss-20b` via Groq Cloud.
- **Token-Efficient:** Capped at **160 max tokens** per request for rapid classification.
- **Content Deduplication:** Computes SHA-256 text fingerprints to avoid re-classifying identical content.
- **Insufficient Content Protection:** If extracted text is under 15 characters, marks status as `insufficient_content` without hallucinating tags or summaries.
- **Zero Vision Overhead:** AI operates strictly on text (titles, captions, OpenGraph descriptions); no images are sent to the LLM.

### 4. ⚡ Supabase Realtime & PostgreSQL Full-Text Search
- **Instant AI Feedback:** Supabase Realtime WebSocket subscriptions (`postgres_changes` on `UPDATE`). When Groq finishes classification, the card updates on screen in real time.
- **Full-Text Search (FTS):** Generated `search_vector tsvector` column with a GIN index on `title (Weight A)`, `description & summary (Weight B)`, and `tags & extracted text (Weight C)`.

### 5. 📴 Local-First Offline Capability
- Local storage cache provides **<1ms instant display** on app open.
- Offline sync queue tracks pending operations and flushes automatically when connectivity returns.

---

## 🛠️ Project Structure

```
.
├── backend/                       # Cloudflare Worker Edge API
│   ├── src/
│   │   ├── worker.ts              # Hono edge entrypoint (/health, /api/link-preview, /api/bookmarks/:id/enrich)
│   │   ├── index.ts               # Standalone Node.js server entrypoint
│   │   ├── services/
│   │   │   ├── extractor.service.ts       # OpenGraph / oEmbed / Twitter Card parser
│   │   │   ├── groq-classifier.service.ts # Text-only Groq LLM classifier
│   │   │   ├── metadata.service.ts        # Metadata normalization
│   │   │   └── platform.service.ts        # Platform detection logic
│   │   └── utils/                         # URL normalization and SSRF validation
│   ├── tests/                     # Vitest test suite
│   └── wrangler.jsonc             # Cloudflare Worker configuration & bindings
│
├── frontend/                      # React 19 + Capacitor Android Client
│   ├── src/
│   │   ├── components/            # BookmarkCard, MasonryFeed, BottomNavigation, Modals
│   │   ├── context/               # AuthContext (Supabase Google OAuth)
│   │   ├── screens/               # HomeScreen, CategoriesScreen, SearchScreen, SettingsScreen
│   │   ├── services/
│   │   │   ├── bookmarks.service.ts # Direct Supabase database operations
│   │   │   ├── preview.service.ts   # Client-side YouTube & Edge link previews
│   │   │   ├── local-db.service.ts  # Local-first cache and offline sync queue
│   │   │   └── nativeBridge.ts     # Capacitor Android native bridge
│   │   └── config/                # Supabase client & API configuration
│   └── android/                   # Native Android Studio project
│       └── app/src/main/
│           ├── AndroidManifest.xml          # Share sheet intent filter
│           └── java/com/mybookmark/app/
│               ├── MainActivity.java
│               ├── NativeBridgePlugin.kt    # SharedPreferences session bridge
│               └── ShareReceiverActivity.kt # Native Android sharesheet intake
│
├── scripts/                       # Branding and icon generation utilities
├── supabase/
│   └── migrations/                # PostgreSQL schema, RLS, Realtime & FTS GIN index
├── CONTRIBUTING.md                # Contribution guidelines
├── LICENSE                        # MIT License
└── SECURITY.md                    # Security vulnerability reporting policy
```

---

## 🚀 Quickstart Guide

Anyone can clone this repository and run the full stack locally:

### 1. Prerequisites
- **Node.js**: `v20.x` or later
- **npm** or **pnpm**
- **Supabase Account**: Free project from [supabase.com](https://supabase.com)
- **Groq API Key**: Free key from [console.groq.com](https://console.groq.com)
- **Android Studio & SDK** *(optional, only needed for compiling Android APK)*

### 2. Clone the Repository
```bash
git clone https://github.com/Pruthviraj141/BookMyMark.git
cd BookMyMark
```

### 3. Database Setup (Supabase)
1. In your Supabase Dashboard, navigate to the **SQL Editor**.
2. Run the migrations in order from `supabase/migrations/`:
   - First: [`20261101000000_create_bookmarks_and_storage.sql`](supabase/migrations/20261101000000_create_bookmarks_and_storage.sql)
   - Second: [`20261101120000_enable_realtime_and_fulltext_search.sql`](supabase/migrations/20261101120000_enable_realtime_and_fulltext_search.sql)
3. Under **Authentication → Providers**, enable **Google** (or Email auth).
4. Under **Database → Replication**, ensure Realtime is enabled for the `bookmarks` table.

### 4. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` and configure:
```env
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

Run tests to verify the backend pipeline:
```bash
npm test
```

Start the local API server:
```bash
npm run dev
# Server running at http://localhost:3000
```

*(Optional)* Or deploy directly to Cloudflare Workers:
```bash
npx wrangler deploy
```

### 5. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
```
Edit `.env` and set:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3000   # Or your deployed worker URL
```

Start the Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📱 Building the Android APK

BookMyMark uses Capacitor to package the React application as a native Android app with Share Menu capabilities:

```bash
cd frontend

# 1. Build the production web bundle
npm run build

# 2. Sync web assets with native Android project
npx cap sync android

# 3. Compile the debug APK
cd android
./gradlew assembleDebug
```

The compiled APK will be located at:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

To install directly onto a connected Android phone with USB debugging enabled:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 🌐 API & Endpoints

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Public | Service health and runtime status. |
| `/api/link-preview?url=...` | `GET` | Public | Extracts metadata; edge-cached for 24h (`X-Cache: HIT`). |
| `/api/bookmarks/:id/enrich` | `POST` | Bearer Token | Authenticated background AI classification with Groq `openai/gpt-oss-20b`. |

*Note: All regular CRUD operations (insert, select, update, delete, search) communicate directly between the frontend client and Supabase PostgreSQL using Row-Level Security (RLS).*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
