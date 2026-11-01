# SAVR — Smart Visual Bookmark Library

<div align="center">

<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bookmark-check.svg" width="80" height="80" alt="SAVR Logo" />

### Intelligent, High-Performance Multi-Platform Visual Library & Knowledge Vault

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-savr--api-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android_Native-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Groq AI](https://img.shields.io/badge/Groq-gpt--oss--20b-F05032)](https://groq.com/)

<p align="center">
  <b>SAVR</b> is a personal, visual, AI-categorized bookmarking application built for Android and Web. Save Instagram Reels, X (Twitter) threads, YouTube videos, and web articles seamlessly via the native Android Share Menu, with WhatsApp-style cover previews, instant local responsiveness, and automatic text-only Groq AI categorization.
</p>

[Architecture](#-architecture) •
[Key Features](#-key-features) •
[Quickstart](#-quickstart) •
[Android APK](#-android-apk) •
[API & Endpoints](#-api--endpoints) •
[Future Improvements](#-future-roadmap)

</div>

---

## 🏗 Architecture

SAVR utilizes a modern **Local-First, Edge-Assisted** serverless architecture:

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
Save links from any app (Instagram, X, YouTube, Reddit, Chrome) by tapping **Share → SAVR**.
- **Instant Intake:** Shares are saved directly to PostgreSQL or queued locally if offline.
- **One-Tap Experience:** Authenticated shares save and return to the original app immediately without intrusive screen switching.

### 2. 🖼️ WhatsApp-Style Cover Previews (Zero Database Image Storage)
- **Client-Side YouTube Recognition:** Instant thumbnail generation (`https://i.ytimg.com/vi/${id}/hqdefault.jpg`) without any backend request.
- **Cloudflare Edge Cache (`caches.default`):** Non-YouTube link previews are cached at Cloudflare edge locations for 24 hours (`X-Cache: HIT`).
- **Viewport-Based Lazy Loading:** Off-screen cards do not trigger network calls until they are within 200px of the viewport (`IntersectionObserver`).
- **Zero Image Bloat:** No images or base64 blobs are stored in Supabase or SQLite (`thumbnail_url: null`).

### 3. 🤖 Lightweight Text-Only Groq AI Classification
- **Model:** `openai/gpt-oss-20b` via Groq.
- **Token-Efficient:** Capped at **160 max tokens** per request.
- **Content Deduplication:** Computes SHA-256 text fingerprints to avoid re-classifying identical content.
- **Insufficient Content Protection:** If extracted text is under 15 characters, marks status as `insufficient_content` without hallucinating tags or summaries.
- **Zero Vision Overhead:** AI operates strictly on text (titles, captions, OpenGraph descriptions); no images are sent to the LLM.

### 4. ⚡ Supabase Realtime & PostgreSQL Full-Text Search
- **Instant AI Feedback:** Replaced polling intervals with Supabase Realtime WebSocket subscriptions (`postgres_changes` on `UPDATE`). When Groq finishes classification, the card updates on screen in real time.
- **Full-Text Search (FTS):** Generated `search_vector tsvector` column with a GIN index on `title (Weight A)`, `description & summary (Weight B)`, and `tags & extracted text (Weight C)`.

### 5. 📴 Local-First Offline Capability
- Local storage cache provides **<1ms instant display** on app open.
- Offline sync queue tracks pending operations and flushes automatically when connectivity returns.

---

## 📲 Android APK

The pre-built debug APK is available in the repository root:
* **File:** [`MyBookMark-debug.apk`](./MyBookMark-debug.apk) (4.3 MB)
* **Target:** Android 10+ (API 29–36)

### How to Install on Your Android Phone:
1. Transfer `MyBookMark-debug.apk` to your phone via USB or download it.
2. Tap the file in your phone's File Manager.
3. Allow "Install unknown apps" if prompted.
4. Open SAVR and tap **Sign in with Google**.

---

## 🛠️ Project Structure

```
.
├── backend/                       # Cloudflare Worker API
│   ├── src/
│   │   ├── worker.ts              # Minimal edge routes (/health, /api/link-preview, /api/bookmarks/:id/enrich)
│   │   ├── services/
│   │   │   ├── extractor.service.ts       # OpenGraph / oEmbed / Twitter Card parser
│   │   │   ├── groq-classifier.service.ts # Text-only Groq LLM classifier
│   │   │   └── platform.service.ts        # Platform detection logic
│   │   └── utils/                 # URL normalization and SSRF validation
│   └── wrangler.jsonc             # Cloudflare Worker configuration
│
├── frontend/                      # React 19 + Capacitor Android Application
│   ├── src/
│   │   ├── components/            # BookmarkCard, MasonryFeed, BottomNavigation, Modals
│   │   ├── context/               # AuthContext (Supabase Google OAuth)
│   │   ├── screens/               # HomeScreen, SearchScreen, SettingsScreen, LoginScreen
│   │   ├── services/
│   │   │   ├── bookmarks.service.ts # Direct Supabase database operations
│   │   │   ├── preview.service.ts   # Client-side YouTube & Edge link previews
│   │   │   ├── local-db.service.ts  # Local-first cache and offline sync queue
│   │   │   └── nativeBridge.ts     # Capacitor Android native bridge
│   │   └── config/                # Supabase client & API configuration
│   └── android/                   # Native Android Studio project
│       └── app/src/main/java/com/mybookmark/app/
│           ├── MainActivity.kt
│           ├── NativeBridgePlugin.kt    # SharedPreferences session bridge
│           └── ShareReceiverActivity.kt # Native Android sharesheet intake
│
├── supabase/
│   └── migrations/                # PostgreSQL schema, RLS, Realtime & FTS GIN index
│
└── MyBookMark-debug.apk           # Compiled Android APK ready for install
```

---

## 🚀 Development Quickstart

### Prerequisites
- **Node.js**: `v20.x` or later
- **Android SDK** *(optional, for compiling APK)*
- **Wrangler CLI**: `npm i -g wrangler`

### 1. Install Dependencies
```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### 2. Run Local Development Server
```bash
# Start frontend with Vite
cd frontend
npm run dev
```

### 3. Build & Deployments

#### Rebuild Frontend & Android APK:
```bash
cd frontend
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

#### Deploy Cloudflare Worker:
```bash
cd backend
npx wrangler deploy
```

---

## 🌐 API & Endpoints

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Public | Service health and Cloudflare status. |
| `/api/link-preview?url=...` | `GET` | Public | Scrapes metadata; cached at Cloudflare edge for 24h (`X-Cache: HIT`). |
| `/api/bookmarks/:id/enrich` | `POST` | Bearer Token | Authenticated background AI classification with Groq `openai/gpt-oss-20b`. |

*Note: All regular CRUD operations (insert, select, update, delete, search) communicate directly between the frontend and Supabase PostgreSQL using Row-Level Security.*

---

## 🔮 Future Roadmap & Potential Enhancements

1. **Android Haptic Feedback:** Add subtle haptic vibration on successful share intake.
2. **Custom Collection Folders:** In addition to AI categories and tags, allow manual user-created collections/folders.
3. **Export & Backup:** One-click JSON / HTML bookmark export for external archival.
4. **Desktop Browser Extension:** Chrome / Firefox extension that talks directly to the same Supabase database.
