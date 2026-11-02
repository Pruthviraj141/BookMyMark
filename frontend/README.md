# BookMyMark — Frontend & Android Client

The client application for **BookMyMark**, built with React 19, Vite, Tailwind CSS v4, and Capacitor for Android native capabilities.

---

## 1. Key Features

- **Multi-Platform Visual Feed**: Masonry visual layout for bookmarks across YouTube, Instagram, X (Twitter), Reddit, and web articles.
- **Instant Client Previews**: Client-side YouTube thumbnail resolution (`https://i.ytimg.com/vi/${id}/hqdefault.jpg`) without backend roundtrips.
- **IntersectionObserver Lazy Loading**: Previews only fetch when cards approach the viewport.
- **Local-First Caching**: Fast local storage / IndexedDB caching with <1ms screen render on startup.
- **Realtime Sync**: Subscribes to Supabase Realtime WebSocket changes to update UI immediately when Groq AI classification finishes.
- **Android Share Menu Integration**: Native Android ShareReceiver activity that captures shared URLs directly from Instagram, YouTube, Chrome, etc.

---

## 2. Directory Structure

```
frontend/
├── src/
│   ├── components/            # BookmarkCard, MasonryFeed, BottomNavigation, Modals
│   │   └── ui/                # Accessible design system components (Button, Modal, etc.)
│   ├── config/                # Supabase client & API base URL config
│   ├── context/               # AuthContext (Google OAuth & session state)
│   ├── screens/               # HomeScreen, CategoriesScreen, FavoritesScreen, SearchScreen, SettingsScreen
│   ├── services/
│   │   ├── bookmarks.service.ts # Supabase direct CRUD operations
│   │   ├── preview.service.ts   # Edge preview client & YouTube parser
│   │   ├── local-db.service.ts  # Local-first cache and offline queue
│   │   └── nativeBridge.kt     # Capacitor Android native bridge
│   ├── theme/                 # Dark/light tokens and ThemeProvider
│   ├── App.tsx                # Main application component & tab switching
│   └── main.tsx               # Application bootstrap
├── android/                   # Native Android Studio project (Capacitor)
│   └── app/src/main/
│       ├── AndroidManifest.xml      # Includes SEND intent-filter for Android Share Menu
│       └── java/com/mybookmark/app/
│           ├── MainActivity.java
│           ├── NativeBridgePlugin.kt
│           └── ShareReceiverActivity.kt
├── public/                    # PWA icons, favicon, branding assets
└── vite.config.ts             # Vite configuration with React and Tailwind
```

---

## 3. Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in:
- `VITE_SUPABASE_URL`: Your Supabase Project URL (`https://<project-ref>.supabase.co`)
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase Anon / Publishable API key
- `VITE_API_BASE_URL`: URL of your deployed Cloudflare Worker or local backend (`http://localhost:3000`)

### 3. Run Web Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 4. Android Native Development (Capacitor)

### Sync Web Build with Android
Whenever web assets are rebuilt, sync them with the Android container:
```bash
npm run build
npx cap sync android
```

### Open in Android Studio
```bash
npx cap open android
```

### Build Debug APK via Command Line
```bash
cd android
./gradlew assembleDebug
```
The compiled APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 5. Android Share Sheet Intake

The application registers an `android.intent.action.SEND` intent filter in `AndroidManifest.xml`. When you tap **Share → BookMyMark** in any Android app:
1. `ShareReceiverActivity.kt` extracts the shared text/URL.
2. Checks user authentication state from SharedPreferences (bridged via `NativeBridgePlugin.kt`).
3. Saves the bookmark directly or queues it locally, displaying an instant native toast without disrupting user workflow.
