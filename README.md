# BookMyMark — Smart Visual Bookmark Library

<div align="center">

<img src="frontend/public/branding/bookmymark-banner.svg" alt="BookMyMark — Smart Visual Bookmark Library" width="100%" style="max-width: 880px;" />

<br/>

<p align="center">
  <b>High-Performance, Local-First, AI-Categorized Visual Knowledge Vault for Android and Web.</b><br/>
  Save Instagram Reels, X (Twitter) threads, YouTube videos, and web articles seamlessly via the native Android Share Menu, with WhatsApp-style cover previews, instant local responsiveness, and automatic text-only Groq AI categorization.
</p>

<!-- 1-Click Android Download Callout -->
[![Direct APK Download](https://img.shields.io/badge/⚡_Download_Android_APK-v1.0.0_Direct_Download-00C853?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Pruthviraj141/BookMyMark/releases/latest/download/BookMyMark-debug.apk)
[![GitHub Release](https://img.shields.io/badge/GitHub_Release-v1.0.0-181717?style=for-the-badge&logo=github)](https://github.com/Pruthviraj141/BookMyMark/releases/tag/v1.0.0)

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android_Native-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-Hono_API-F38020?logo=cloudflare)](https://workers.cloudflare.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Groq AI](https://img.shields.io/badge/Groq-gpt--oss--20b-F05032)](https://groq.com/)

<br/>

[📲 Android Download](#-android-apk-direct-download) •
[🏗 System Architecture](#-end-to-end-system-architecture) •
[🌟 Key Features](#-key-features) •
[🚀 Quickstart](#-quickstart-guide) •
[🛠 Structure](#-project-structure) •
[🌐 API Reference](#-api--endpoints)

</div>

---

## 📲 Android APK Direct Download

Install BookMyMark directly onto your Android device:

| Binary | Version | Target OS | Direct Download Link |
| :--- | :--- | :--- | :--- |
| **`BookMyMark-debug.apk`** | `v1.0.0` | Android 10+ (API 29–36) | [**⬇️ Download Latest APK (v1.0.0)**](https://github.com/Pruthviraj141/BookMyMark/releases/latest/download/BookMyMark-debug.apk) |

### ⚡ 3-Step Installation:
1. Tap the [**Download APK link**](https://github.com/Pruthviraj141/BookMyMark/releases/latest/download/BookMyMark-debug.apk) on your Android device.
2. Open the downloaded file in your browser or File Manager (allow *"Install unknown apps"* if prompted).
3. Open **BookMyMark**, sign in with Google, and start saving bookmarks directly from your Android Share Sheet!

---

## 🏗 End-to-End System Architecture

BookMyMark is built with a **Local-First, Edge-Assisted** serverless topology. The frontend communicates directly with Supabase for data and authentication, while an edge worker offloads link metadata scraping, edge caching, and AI classification.

```mermaid
flowchart TD
    %% ─── STYLING & CLASSES ───
    classDef intake fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#ffffff,font-weight:bold
    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    classDef edge fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc
    classDef supabase fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc
    classDef ai fill:#431407,stroke:#fb923c,stroke-width:2px,color:#f8fafc

    %% ─── 1. INTAKE ───
    subgraph S1 ["1. Mobile Intake & User Touchpoints"]
        Share["📱 Any Android App\n(Instagram, X, YouTube, Chrome)"]
        NativeSheet["⚡ Native Android ShareReceiver\n(android.intent.action.SEND)"]
        WebUI["💻 Responsive Web Client\n(Desktop & Tablet Browser)"]
        Share -->|"1. One-Tap Share"| NativeSheet
    end

    %% ─── 2. CLIENT CORE ───
    subgraph S2 ["2. Client Application Layer (React 19 + Capacitor Native)"]
        AppCore["BookMyMark Application Core"]
        LocalCache[("Local Storage / SQLite Cache\n(<1ms Instant Display)")]
        YTParser["Client-Side YouTube Recognizer\n(Zero Network Calls)"]
        
        NativeSheet -->|"2. Forward Intent Payload"| AppCore
        WebUI -->|"Direct URL Input"| AppCore
        AppCore <-->|"3. Instant UI Render & Offline Queue"| LocalCache
        AppCore -.->|"Pre-resolve Thumbnails"| YTParser
    end

    %% ─── 3. SUPABASE CLOUD ───
    subgraph S3 ["3. Cloud Data & Realtime Engine (Supabase)"]
        PostgresDB[("PostgreSQL Database\n• Row-Level Security (RLS)\n• GIN Full-Text Search")]
        RealtimeEngine["Supabase Realtime Engine\n(WebSocket Channel)"]
        PostgresDB -.->|"9. Broadcast 'UPDATE' Event"| RealtimeEngine
    end

    %% ─── 4. EDGE WORKER ───
    subgraph S4 ["4. Edge Worker Infrastructure (Cloudflare Workers)"]
        Worker["Cloudflare Edge API (savr-api)\nHono + TypeScript"]
        EdgeCache["Cloudflare CDN Edge Cache\n(24h TTL, X-Cache: HIT/MISS)"]
        SSRF["SSRF Guard & Metadata Scraper\n(OpenGraph / oEmbed / Twitter Cards)"]
        Worker <--> EdgeCache
        Worker --> SSRF
    end

    %% ─── 5. GROQ AI ───
    subgraph S5 ["5. Fast LLM Intelligence"]
        GroqCloud["Groq Cloud LLM\n(openai/gpt-oss-20b • ≤160 tokens)"]
    end

    %% ─── END-TO-END FLOW ARROWS ───
    AppCore -->|"4. Direct INSERT Bookmark (status: 'pending')"| PostgresDB
    AppCore -->|"5. Trigger Async AI Enrichment (Bearer JWT)"| Worker
    Worker -->|"6. Scrape Text & Fingerprint"| SSRF
    Worker -->|"7. Fast Text Prompt (<300ms)"| GroqCloud
    GroqCloud -->|"8. Structured Category, Tags & Summary"| Worker
    Worker -->|"8. UPDATE Bookmark Record"| PostgresDB
    RealtimeEngine ==>|"10. Instant WebSocket Live Feed Update"| AppCore

    class Share,NativeSheet,WebUI intake
    class AppCore,LocalCache,YTParser client
    class Worker,EdgeCache,SSRF edge
    class PostgresDB,RealtimeEngine supabase
    class GroqCloud ai
```

---

## 🌟 Key Features

| Feature | Description | Architecture Benefit |
| :--- | :--- | :--- |
| **📱 Native Share Intake** | Share links from Instagram, X, YouTube, Reddit, Chrome directly to BookMyMark. | One-tap intake without opening the app or leaving your current screen. |
| **🖼️ WhatsApp-Style Previews** | High-definition card previews without storing images in your database. | Zero storage bloat in PostgreSQL; YouTube resolved locally, others edge-cached for 24 hours. |
| **🤖 Ultra-Fast Groq AI** | Categorizes content and generates summary tags using `openai/gpt-oss-20b`. | Capped at 160 tokens; deduplicates via SHA-256 text fingerprinting. |
| **🔄 Supabase Realtime** | Realtime WebSocket synchronization on database `UPDATE` events. | Eliminates polling; UI updates automatically the moment AI completes. |
| **🔍 Full-Text Search (GIN)** | PostgreSQL weighted full-text search (`search_vector tsvector`). | Instant multi-attribute search across titles, tags, and AI summaries. |
| **📴 Local-First Offline Mode** | Local cache + queued sync operations. | UI loads under 1ms on app open; changes sync automatically when online. |

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
│   ├── tests/                     # Vitest test suite (Auth, Bookmarks, Metadata, Groq)
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
├── scripts/                       # Branding and asset generator utilities
├── supabase/
│   └── migrations/                # PostgreSQL schema, RLS, Realtime & FTS GIN index
├── LICENSE                        # MIT License
└── SECURITY.md                    # Security vulnerability reporting policy
```

---

## 🚀 Quickstart Guide

Anyone can clone and run BookMyMark locally in minutes:

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm**
- **Supabase Account**: Free project from [supabase.com](https://supabase.com)
- **Groq API Key**: Free key from [console.groq.com](https://console.groq.com)
- **Android Studio & SDK** *(optional, only for building native Android APK)*

---

### 2. Clone the Repository
```bash
git clone https://github.com/Pruthviraj141/BookMyMark.git
cd BookMyMark
```

---

### 3. Database Setup (Supabase)
1. Open your Supabase Dashboard and go to the **SQL Editor**.
2. Run the two migration scripts in sequential order:
   - [`supabase/migrations/20261101000000_create_bookmarks_and_storage.sql`](supabase/migrations/20261101000000_create_bookmarks_and_storage.sql)
   - [`supabase/migrations/20261101120000_enable_realtime_and_fulltext_search.sql`](supabase/migrations/20261101120000_enable_realtime_and_fulltext_search.sql)
3. Under **Authentication → Providers**, enable **Google** (or Email).
4. Under **Database → Replication**, verify that Realtime is toggled ON for the `bookmarks` table.

---

### 4. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Populate `.env` with your Groq and Supabase keys:
```env
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

Verify the backend test suite:
```bash
npm test
```

Start the backend server:
```bash
npm run dev
# Running at http://localhost:3000
```

*(Optional)* Deploy to Cloudflare Workers:
```bash
npx wrangler deploy
```

---

### 5. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
```
Edit `.env` with your URLs:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3000   # Or your deployed Cloudflare worker URL
```

Launch the Vite development server:
```bash
npm run dev
# App ready at http://localhost:5173
```

---

## 📱 Compiling the Android APK

To build the APK locally from source:

```bash
cd frontend

# 1. Build the web production assets
npm run build

# 2. Sync web bundle to Android native container
npx cap sync android

# 3. Compile the debug APK using Gradle
cd android
./gradlew assembleDebug
```

The resulting APK will be ready at:
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

To install directly to a connected Android phone over USB:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 🌐 API & Endpoints

| Endpoint | Method | Auth | Description | Cache Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | Public | Service health and runtime status check. | No cache |
| `/api/link-preview?url=...` | `GET` | Public | Scrapes OpenGraph, Twitter Card, and oEmbed metadata. | Cloudflare Edge Cache (24 hours, `X-Cache: HIT`) |
| `/api/bookmarks/:id/enrich` | `POST` | Bearer Token | Authenticated background AI categorization via Groq `openai/gpt-oss-20b`. | Background execution (`waitUntil`) |

---

## 📄 License

Distributed under the [MIT License](LICENSE).
