# SAVR — PHASE 2: ANDROID APPLICATION AND CAPACITOR MASTER PROMPT

You are a senior Android application developer, Capacitor engineer, React/TypeScript developer and mobile UI/UX architect.

Phase 1 of SAVR has already been completed.

Your task is to build the complete Android application using the existing working backend.

This phase must produce a functional Android APK that I can install and test on my physical Android phone.

The most important functionality is native Android Sharesheet integration.

When a user selects Savr while sharing content from Instagram or X, the bookmark should be saved immediately without opening the normal Savr interface.

Do not rewrite or unnecessarily modify the completed backend.

# 1. FIRST ACTION: INSPECT PHASE 1

Before making changes, inspect:

- frontend/package.json
- frontend/ Capacitor configuration
- frontend/src/
- frontend/android/
- backend/API_CONTRACT.md
- backend/README.md
- backend API implementation
- Authentication request and response formats
- Bookmark creation request and response formats
- AI processing status format

Treat backend/API_CONTRACT.md as the source of truth.

Do not invent API endpoints.

Do not change the backend's authentication strategy.

Do not replace the SQLite backend.

Do not create a second database.

Do not recreate the project.

Use the existing React/Vite and Capacitor installation.

If the Phase 1 API contract has an implementation discrepancy, identify it and make the smallest compatible correction.

The API base URL must remain configurable.

# 2. PRODUCT AND DESIGN OBJECTIVE

Build SAVR as a premium Android bookmark application.

Use the Savr reference screenshot supplied to the project as the primary visual direction.

The UI must preserve these characteristics:

- Dark visual appearance.
- Minimal interface.
- Two-column masonry-style bookmark feed.
- Prominent content images.
- Platform identification.
- Title underneath each image.
- Description beneath the title.
- AI-generated tags below the description.
- Rounded cards.
- Comfortable spacing.
- Responsive mobile layout.
- Subtle animations.
- Clean bottom navigation.

Do not create a generic AI dashboard.

Do not overuse gradients, glass effects or decorative elements.

Actual saved content must be the focus.

Use:

- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- Lucide React.
- Capacitor.

# 3. FRONTEND STRUCTURE

Use a maintainable component structure similar to:

frontend/src/
  app/
  components/
    BookmarkCard/
    MasonryFeed/
    SearchBar/
    TagChip/
    BottomNavigation/
    LoadingState/
    EmptyState/

  screens/
    LoginScreen.tsx
    RegisterScreen.tsx
    HomeScreen.tsx
    SearchScreen.tsx
    BookmarkDetailScreen.tsx
    SettingsScreen.tsx

  services/
    api.ts
    auth.ts
    bookmarks.ts

  hooks/
    useAuth.ts
    useBookmarks.ts

  config/
    api.config.ts

  types/
    bookmark.ts
    auth.ts

  utils/
    url.ts
    date.ts

  styles/

Adapt the structure to the existing project where appropriate.

Avoid overengineering.

# 4. AUTHENTICATION AND SESSION

Create login and registration screens.

Fields:

- Username
- Password

Support:

- Register.
- Login.
- Logout.
- Session restoration.
- Authentication error handling.

Use the exact Phase 1 endpoints and schemas.

After login, securely persist the session as practically as possible for this prototype.

Create a small native Capacitor bridge that saves the authentication token and API base URL into app-private SharedPreferences.

Do not store passwords.

When the user logs out:

- Clear the frontend session.
- Clear the native session token.
- Clear pending user-specific operations where appropriate.
- Return to the login screen.

The share receiver and React application must use the same native session configuration.

Do not create an independent authentication mechanism inside Android.

# 5. HOME SCREEN — PRIMARY EXPERIENCE

Build a visually polished two-column masonry feed.

Each bookmark card should include:

1. Actual thumbnail.
2. Platform icon.
3. Source domain.
4. Title.
5. Short description.
6. AI-generated category.
7. Topic tags.
8. Saved date/time.
9. AI processing indicator when needed.

Display actual images from the backend.

Prioritize the thumbnail URL returned by Phase 1.

Do not use random stock photos as substitutes for unavailable post thumbnails.

When a thumbnail is missing:

- Show a well-designed platform-specific placeholder.
- Retain the post title and description.
- Keep the card visually consistent.

Use image lazy loading.

Preserve different image aspect ratios.

Implement an actual responsive masonry-style layout rather than two rigid equal-height columns.

Ensure cards work properly on common Android screen widths.

# 6. SEARCH AND FILTERS

Implement search using the existing backend search endpoint.

Support:

- Title.
- Description.
- Summary.
- Tags.
- Available content text.

Provide platform filters:

- All
- Instagram
- X
- YouTube
- Reddit
- TikTok
- Websites

Also provide category filtering.

Debounce search input.

Avoid unnecessary API calls.

# 7. BOOKMARK DETAIL SCREEN

When a user taps a card, display:

- Large thumbnail.
- Original title.
- Platform.
- Description.
- AI summary.
- Category.
- Tags.
- Personal notes.
- Saved time.
- Original URL.
- Open original post.
- Edit bookmark.
- Delete bookmark.

Use the existing backend endpoints.

Allow manually editing tags and content.

Ensure AI background processing does not overwrite manually edited information.

# 8. MANUAL BOOKMARK CREATION

Provide a small manual URL input.

The user can paste a URL and add it.

Send the request to:

POST /api/bookmarks

using the API contract from Phase 1.

The manual form and Android native share receiver must use the same backend bookmark creation workflow.

Do not duplicate classification logic in React.

# 9. MOST IMPORTANT: NATIVE ANDROID SHARE RECEIVER

This is the highest-priority Android feature.

Implement a proper Android share-target integration.

Do not merely use the Capacitor Share plugin.

The standard Capacitor Share plugin is primarily for sharing content outward and does not, by itself, receive incoming Android shares.

Implement a dedicated minimal Kotlin Android activity.

Name:

ShareReceiverActivity

Register the activity in the existing AndroidManifest.xml.

Support:

- android.intent.action.SEND
- android.intent.category.DEFAULT
- text/plain

Also support the necessary incoming share variants where useful.

Use an appropriate icon, label and lightweight activity theme.

Avoid changing the existing launcher activity unnecessarily.

## A. Required user experience

The user should experience exactly this:

Instagram:
1. Open Instagram.
2. Open a Reel.
3. Tap Share.
4. Select Savr in Android's Sharesheet.
5. Savr receives the shared content.
6. Savr saves the bookmark automatically.
7. A small native notification appears.
8. Instagram becomes visible again.

X:
Follow the same flow.

The user must not have to navigate through Savr's home screen.

The user must not press another Save button.

There must be no additional confirmation screen for an authenticated user.

IMPORTANT:
A custom button injected into Instagram or X is not required or permitted by this design.

Savr must be a proper Android Sharesheet target.

Do not promise that Android will always rank Savr first.

## B. Intent processing

Handle:

- Intent.EXTRA_TEXT.
- Intent.EXTRA_SUBJECT.
- ClipData.
- Cold-start intents.
- Already-running activity cases.

Extract a valid HTTP/HTTPS URL from the shared text.

Preserve the accompanying shared text.

Support URLs containing query parameters.

Validate the source domain where appropriate, but do not reject legitimate URLs from supported platforms.

Prevent duplicate submissions.

Use correct Android lifecycle handling, including onCreate and onNewIntent where needed.

## C. Save without opening the normal app

This requirement is non-negotiable.

ShareReceiverActivity must not display the main React application after an authenticated share.

Implement a minimal native activity that:

1. Receives the intent.
2. Retrieves the native session token.
3. Retrieves the backend API base URL.
4. Submits the bookmark request.
5. Waits for the server's initial persisted-success response.
6. Displays a small native Toast.
7. Finishes the activity.

Use a background executor for network calls.

Never perform network requests on Android's main UI thread.

Use bounded connection and read timeouts.

Do not launch MainActivity after successful saving.

The user must return to the original application.

## D. Native session storage

Implement a tiny Capacitor plugin or equivalent shared native configuration layer.

Methods:

- setSessionToken
- clearSessionToken
- setApiBaseUrl
- getConnectionConfiguration

Store these values using app-private SharedPreferences.

Use the same storage mechanism in both the normal React application and ShareReceiverActivity.

Do not store the password.

Do not expose the Groq key in the Android application.

## E. First-time sharing

If the user has not logged into Savr:

1. Preserve the incoming share payload.
2. Launch the normal application.
3. Display the login screen.
4. After successful authentication, submit the pending share automatically.
5. Display a confirmation.
6. Navigate to the library.

Do not discard shared content before authentication.

## F. Offline and backend failure handling

The current backend runs on my Fedora machine.

If the backend cannot be reached:

- Preserve the shared URL and text locally using app-private storage.
- Display a message such as "Queued — will sync when connected".
- Retry pending shares when the app is next opened.
- Only remove a pending item after server acknowledgement.
- Avoid creating duplicates during retry.

Implement a lightweight persistent queue.

Do not introduce Redis, WorkManager or unnecessary infrastructure unless the existing Android implementation genuinely requires it.

## G. Native permission and configuration

Inspect the existing Android project and implement appropriate configuration for:

- Internet access.
- ACTION_SEND intent filter.
- App icon.
- Share activity label.
- Native activity lifecycle.
- Debug local-network HTTP access.

Enable cleartext HTTP only for the debug/local configuration.

Do not disable HTTPS security globally.

# 10. API INTEGRATION

Read Phase 1's API_CONTRACT.md.

Use one centralized API client.

Configure:

VITE_API_BASE_URL

Support:

- Browser development.
- Android emulator.
- Physical Android phone.

The physical phone must use the Fedora computer's LAN IP address, not localhost.

For example:

http://192.168.1.10:3000

This must remain configurable.

The native Android receiver must use the same configured backend base URL.

When a request includes an authenticated bearer token, use the token from the native session store.

Do not create a second set of bookmark APIs.

Do not change the request body format defined in Phase 1.

# 11. ANDROID UI AND EXPERIENCE

The application must behave like a polished native mobile application.

Implement:

- Status bar styling.
- Navigation bar styling.
- Safe-area padding.
- Android back-button handling.
- Keyboard handling.
- Pull-to-refresh where appropriate.
- Touch-friendly interactions.
- Smooth scrolling.
- Lazy image rendering.
- Loading skeletons.
- Empty states.
- Error states.
- Network connection indication.

The home screen must load quickly.

AI processing must not freeze the interface.

When bookmark status changes, refresh the affected item without reloading the entire application unnecessarily.

# 12. PERFORMANCE

Keep the first version lightweight.

- Avoid large animation libraries unless already installed.
- Use CSS transitions for simple animations.
- Lazy-load images.
- Debounce search.
- Avoid unnecessary renders.
- Paginate bookmarks.
- Cache basic loaded data where appropriate.
- Avoid downloading videos.
- Avoid processing large images unnecessarily.

Do not implement full video transcription.

Do not implement semantic search or vector databases.

# 13. LOCAL TESTING AND APK

The backend will still run locally on Fedora.

The phone and computer will initially use the same Wi-Fi network.

Provide clear instructions for:

1. Finding Fedora's LAN IP.
2. Configuring the frontend API base URL.
3. Starting the backend.
4. Building the React frontend.
5. Syncing Capacitor.
6. Building the APK.

Use the existing Android project.

Do not recreate Capacitor configuration.

Commands should be similar to:

npm run build

npx cap sync android

cd android

./gradlew assembleDebug

Use the actual folder paths based on the existing project.

Install the debug APK if ADB is available.

# 14. CORE VERIFICATION

Keep testing focused. Do not create an unnecessarily enormous test suite.

Verify:

Frontend:
- Login.
- Registration.
- Session restoration.
- Home feed.
- Bookmark images.
- Search.
- Platform filters.
- Bookmark details.
- Manual URL submission.

Integration:
- React communicates with the real backend.
- AI processing status updates.
- Bearer authentication works.
- User-specific bookmarks remain private.

Android:
- Android project compiles.
- Savr is registered as a share target.
- A text/plain share can be received.
- URL extraction works.
- Session token reaches native code.
- Authenticated share requests work without opening MainActivity.
- Duplicate submission is prevented.
- Cold-start handling works.
- Network failure is queued.

Do not claim Instagram or X has been tested unless it has actually been tested with the real applications on a physical device.

If no physical device is connected, build the APK and provide the remaining manual verification steps.

# 15. FUTURE DEPLOYMENT COMPATIBILITY

We plan to move the backend to Cloudflare Workers in the future.

Do not deploy now.

Do not introduce Cloudflare dependencies into the Android application.

Keep the frontend independent of the backend's physical hosting location.

The only change required for future deployment should ideally be the configured API base URL and any deployment-specific security settings.

# 16. FINAL ACCEPTANCE CRITERIA

The Phase 2 implementation is complete when:

1. Savr opens on an Android phone.
2. Registration and login work.
3. The home screen resembles the supplied Savr reference.
4. Saved content shows actual available images.
5. Titles, descriptions and AI tags display correctly.
6. Manual URL submission works.
7. Search and filters work.
8. Bookmark details work.
9. Android Sharesheet displays Savr as a share target.
10. Sharing a compatible URL from Instagram can save it automatically.
11. Sharing a compatible URL from X can save it automatically.
12. The authenticated sharing flow does not show the normal Savr home screen.
13. Native confirmation works.
14. The original application becomes visible again.
15. Saved bookmarks appear in the library.
16. The debug APK builds successfully.

# 17. FINAL REPORT

At completion, provide:

- Final architecture.
- Components implemented.
- Native Android files changed.
- Share receiver implementation details.
- Backend integration details.
- Environment configuration.
- Commands to start the project.
- APK location.
- Core build and test results.
- Known extraction limitations.
- Any physical-device tests still required.

Do not stop after designing the UI.

Do not create mock-only screens.

Do not use fake bookmark data in the production feed.

Do not replace the real backend with local hardcoded arrays.

Do not ask for new API credentials because they are already configured in the backend.

Do not rewrite Phase 1.

**FINAL OBJECTIVE: Deliver an installable Android APK that looks like the supplied Savr reference and can save content from Instagram and X through the Android Sharesheet with one selection and no manual save screen.**