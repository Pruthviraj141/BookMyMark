# BOOKMYMARK — PHASE 2
# REAL PRODUCTION AUTHENTICATION, BOOKMARK SAVING & ANDROID SYNCHRONISATION

## Objective

Phase 1 has delivered the working browser extension foundation for Chrome, Firefox and Brave.

Now connect that extension to the actual BookMyMark production account and bookmark system.

The final experience must work like this:

1. A user opens the BookMyMark extension.
2. The user signs in using the same BookMyMark account used by Android.
3. The user right-clicks a link or page and selects Save to BookMyMark.
4. The extension authenticates the user and creates a bookmark through the existing production saving pipeline.
5. The bookmark appears in the actual Supabase production database.
6. The existing Android application receives the database change through its current Realtime and synchronisation implementation.
7. The new bookmark appears in Android without reinstalling the app or manually refreshing the page.
8. Any subsequent changes to the bookmark are handled consistently across devices through the existing synchronisation system.

**This must be a genuine end-to-end production integration, not a simulated demonstration.**

Do not start by inventing a new backend or database design.

Read the root `AGENTS.md`, the Phase 0 architecture audit and the completed Phase 1 implementation first.

---

# 1. ABSOLUTE PRODUCTION PROTECTION

The Android application is already running successfully in production.

Its UI, UX, business logic, authentication, database structure and local data must remain protected.

Continue following the root `AGENTS.md`.

### Protected application areas

- `frontend/src/`
- `frontend/android/`
- `frontend/capacitor.config.ts`
- Existing frontend configuration.
- Existing backend production services.
- Existing SQLite database implementation.
- Existing Supabase migrations and database structure.
- Existing production data.
- Existing AI classification and metadata services.

You have explicit permission in this phase to create NEW bookmark records through the existing authorised production saving mechanism.

This permission does NOT include permission to:

- Modify or delete existing bookmarks.
- Bulk-update or migrate user data.
- Reset production data.
- Change the Android UI or UX.
- Refactor mobile application components.
- Replace the existing SQLite caching system.
- Replace the existing Realtime implementation.
- Change production database schemas.
- Change production RLS policies.
- Deploy a modified backend.
- Introduce new database migrations without approval.

You may READ protected files to understand the existing implementation.

If the existing Android Realtime implementation is insufficient, STOP and explain the exact missing capability. Do not modify protected mobile files without my explicit approval.

The requirement is to use the existing production infrastructure wherever possible.

# 2. FIRST: RE-INSPECT PHASE 0 AND PHASE 1

Before writing code, inspect:

- Root `AGENTS.md`.
- Phase 0 architecture report.
- Phase 1 extension source.
- Phase 1 generated manifests.
- Existing Supabase client configuration.
- Existing authentication implementation.
- Existing bookmark creation service.
- Existing bookmark schema.
- Existing RLS policies.
- Existing backend routes.
- Existing metadata enrichment workflow.
- Existing Android Realtime subscription.
- Existing SQLite cache synchronisation.
- Existing environment variable names.

Trace the actual save operation used by the Android app.

Document its exact sequence:

```text
Android share receiver
       |
       v
Existing bookmark capture
       |
       v
Existing authentication
       |
       v
Existing bookmark creation mechanism
       |
       v
Supabase production database
       |
       v
Existing metadata / AI enrichment
       |
       v
Existing Supabase Realtime
       |
       v
Android SQLite cache and UI
```

Do not rely on assumptions or old documentation.

Inspect the real code and follow its actual behaviour.

## Mandatory architecture decision

Determine whether the Android app currently creates bookmarks through:

A. Direct Supabase CRUD using the authenticated user session.

B. Existing authenticated Hono/Cloudflare Worker API routes.

C. A combination of these.

Reuse the same production saving mechanism.

Do not create a second bookmark creation system.

Do not create another cloud database.

Do not create a separate AI enrichment pipeline.

If the existing app creates a bookmark directly through Supabase, reuse the existing schema, client privileges and RLS rules.

If the existing app creates it through an authenticated backend route, call that exact existing route using the extension's authenticated user token.

Do not change the existing route merely to make extension development easier.

If neither existing route can safely support extension creation, STOP and report the minimum required backend change for my approval.

# 3. AUTHENTICATION — SAME USER ACCOUNT

The extension must authenticate using the existing BookMyMark authentication system.

The user must access the same Supabase Auth user ID that they use in Android.

Do not create another user system.

Do not create duplicate user records.

Do not share the Android refresh token with the extension.

Each client can maintain its own independent secure session, while all clients authenticate as the same Supabase user.

### Preferred authentication

The current application uses Supabase authentication. Inspect the existing provider configuration and reuse the same provider.

If Google OAuth is the existing production login method, implement Google OAuth through Supabase Auth using the OAuth PKCE flow.

Use the browser extension identity API:

- `browser.identity.getRedirectURL()`
- `browser.identity.launchWebAuthFlow()`

Use the installed WXT browser abstraction where supported.

Supabase OAuth initiation should use:

- `supabase.auth.signInWithOAuth()`
- `skipBrowserRedirect: true`
- `flowType: 'pkce'`
- Browser-specific `redirectTo`.

Complete the OAuth callback using:

`supabase.auth.exchangeCodeForSession(code)`

Do not send the Google password to the extension.

Do not implement a custom password collection screen.

### Cross-browser OAuth

OAuth must be tested separately on:

- Chrome.
- Brave.
- Firefox.

Requirements:

1. Stable extension identity for every published browser build.
2. Correct callback URL generated for each browser.
3. Exact callback URLs configured in Supabase's allowed redirect URL list.
4. Correct Google authentication callback through the existing Supabase Auth provider.
5. Correct PKCE verifier persistence.
6. Successful session exchange.
7. Persistent session after browser restart.
8. Secure sign-out.

For Firefox, configure a stable Gecko add-on ID.

For Chrome and Brave, verify a stable Chromium extension ID strategy.

Do not commit a private extension signing key to the repository.

### Important configuration requirement

Supabase's authentication redirect allowlist may need additional extension-specific entries.

Generate the exact redirect URLs for development and production.

Do not add broad wildcard redirect permissions unnecessarily.

Do not modify the Google OAuth provider's existing Supabase callback URI unless an actual configuration requirement is verified.

If dashboard configuration must be performed manually, give me the exact values and instructions. Do not guess.

### Session ownership

Avoid creating multiple independent Supabase auth clients that refresh the same extension session concurrently.

Prefer a single background authentication/data service that owns:

- Supabase client initialisation.
- Session persistence.
- Token refresh.
- User verification.
- Bookmark creation.
- Cloud requests.

The popup should communicate with this service using typed extension runtime messages.

Ensure that the authentication flow can be initiated through an actual user click in the popup and works across background service-worker suspension/restart.

Use an appropriate browser storage adapter based on `browser.storage.local` for Supabase Auth persistence.

Configure the Supabase client appropriately:

- Persistent session.
- PKCE flow.
- Correct automatic refresh behaviour.
- Correct URL detection settings for a manual extension OAuth callback.

Never put session tokens in URLs, console logs, page scripts or context-menu labels.

Do not use `storage.sync` for authentication sessions.

Do not expose session access to content scripts.

Do not store passwords.

# 4. PRODUCTION DATA SECURITY

This section is non-negotiable.

The extension must use the existing Supabase project and the existing bookmark table.

Use the Supabase publishable key and the signed-in user's access token, or the existing authenticated backend route.

Never expose:

- `SUPABASE_SECRET_KEY`
- Legacy `service_role` credentials.
- Backend secrets.
- Groq credentials.
- Any private signing key.

Never put a privileged database key in a browser extension.

When direct Supabase access is used:

- RLS must be enabled.
- The existing authenticated user's policy must permit their own insert and read.
- The row owner must be determined by the verified user session.
- The extension must not be able to choose another user's owner ID.
- Existing user-specific data isolation must remain intact.

Never bypass RLS.

When a backend API route is used:

- Verify the Supabase JWT on the server.
- Derive the user identity from the verified token.
- Never trust a user ID supplied by the extension.
- Use the existing authorisation middleware.
- Return safe and meaningful errors.

Supabase's current guidance:
https://supabase.com/docs/guides/database/secure-data

https://supabase.com/docs/guides/database/postgres/row-level-security

# 5. USE THE EXISTING BOOKMARK SCHEMA

Do not invent a new production bookmark model.

Inspect the actual production schema and identify:

- Primary key.
- User ownership field.
- URL field.
- Title.
- Description.
- Summary.
- Tags.
- Platform.
- Category.
- Created timestamp.
- Updated timestamp.
- Enrichment status.
- Any other fields required by the current application.

Follow the exact existing field names and constraints.

The extension must produce records that the existing Android application can understand without modification.

Do not introduce new fields merely because they are convenient.

### Bookmark creation rules

When a user saves a link:

- Save the exact intended URL.
- Capture the title if available.
- Identify the platform.
- Use the existing defaults for optional fields.
- Use the existing status lifecycle.
- Preserve the existing created/updated timestamp conventions.

Do not fabricate summaries, AI tags or categories.

Do not pretend a record has completed AI enrichment when it has not.

### Duplicate protection

The extension must use the existing duplicate-handling behaviour.

Inspect existing unique constraints and application-level duplicate logic.

Requirements:

- Do not create multiple rows when a user double-clicks Save.
- Do not create multiple rows when an operation is retried.
- Never update an existing saved bookmark merely because the same URL was saved again.
- Preserve any existing AI-generated tags, summaries and manual edits.
- Show a clear "Already saved" result when appropriate.

Prefer an existing unique constraint or existing server-side idempotency mechanism.

If the existing application already has a duplicate-checking service, reuse it.

Never introduce a new database constraint or migration without explicit approval.

# 6. SAVING PIPELINE — EXACTLY ONCE

Every save action must use the production saving sequence.

The intended flow:

```text
Right-click or extension popup
             |
             v
Capture exact target URL
             |
             v
Validate URL
             |
             v
Check authentication
             |
             v
Invoke existing bookmark save mechanism
             |
             v
Production Supabase bookmark record
             |
             v
Existing metadata enrichment
             |
             v
Existing AI classification
             |
             v
Supabase updated record
             |
             v
Existing Android Realtime subscriber
```

Important:

If the existing save route already triggers metadata extraction and AI classification, do not trigger enrichment a second time.

If the current architecture inserts directly into Supabase and calls an existing enrichment endpoint afterward, reproduce that exact sequence.

Do not introduce a parallel classifier.

Do not call Groq from the extension.

Do not implement metadata scraping inside the extension.

Do not create another image-processing pipeline.

### Cover images

Maintain the existing BookMyMark decision:

- Images are display-only.
- Do not upload image files.
- Do not add Supabase Storage uploads.
- Do not create new image columns.
- Do not persist cover-image URLs if the current app does not persist them.
- Preserve the existing dynamic preview-image handling.

### Success and status behaviour

Show distinct states:

- Saving.
- Saved to BookMyMark.
- Already saved.
- AI organising, when the existing pipeline reports processing.
- Ready, when the existing status reports completion.
- Offline / waiting to sync.
- Authentication required.
- Save failed.

Do not show a success state until the production save operation actually succeeds.

If saving succeeds but optional enrichment fails, keep the bookmark and report its real status. Never create a second bookmark just to retry enrichment.

# 7. OFFLINE AND PENDING CAPTURE HANDLING

Use the existing Phase 1 local capture storage as a foundation.

However, separate old preview-only captures from new Phase 2 pending saves.

**Never automatically upload existing Phase 1 preview drafts to the production database.**

Those older captures were explicitly marked local preview records.

For new Phase 2 actions:

- If authenticated and online, save directly to production.
- If offline, save a clearly marked pending operation locally.
- Preserve the exact URL and capture metadata.
- On the next popup opening, startup event or subsequent save, attempt to process pending operations when online.
- Do not introduce frequent polling or background timers.
- Do not lose a pending bookmark if the service worker stops.
- Keep a stable operation ID to prevent duplicate inserts during retries.
- Remove an operation from the queue only after confirmed production success.

Show the difference between:

- Saved in cloud.
- Waiting locally.
- Failed and requiring retry.

When signed out, allow the user to capture a new link locally and clearly explain that it has not reached their BookMyMark account.

Provide a deliberate sign-in action and process only Phase 2 pending captures that the user actually saved.

Do not import the legacy Phase 1 preview queue automatically.

# 8. SUPABASE REALTIME — ANDROID SYNCHRONISATION

This is the most important end-to-end success condition.

The Android app must receive newly created production bookmarks and subsequent bookmark changes through its EXISTING Realtime and cache synchronisation implementation.

Before implementing anything, inspect the existing Android Realtime logic in read-only mode.

Verify:

1. The correct production bookmark table is subscribed.
2. The subscription is authenticated.
3. The subscription is scoped to the appropriate user's records.
4. INSERT events are handled.
5. UPDATE events are handled.
6. DELETE events are handled if the current application supports deletion.
7. New and updated records are merged into the existing SQLite cache correctly.
8. Duplicate Realtime events do not create duplicate local records.
9. The application updates its existing state without requiring a reinstall.
10. Reconnection and foreground resumption behave correctly.

Do not modify Android code to force this integration.

### Expected behaviour

When a new bookmark is created from the extension:

```text
Extension
   |
   v
Supabase INSERT
   |
   v
Existing Realtime subscription
   |
   v
Android receives INSERT
   |
   v
Existing SQLite cache upsert
   |
   v
Existing Android UI reflects the new bookmark
```

When AI enrichment updates the record:

```text
AI / existing backend
       |
       v
Supabase UPDATE
       |
       v
Existing Android Realtime subscription
       |
       v
Existing SQLite cache update
       |
       v
Android displays updated tags / summary / status
```

When the user changes or removes a bookmark through another supported client, follow the existing synchronisation behaviour.

### Important Realtime rules

Do not replace the current Realtime architecture.

If the Android app uses `postgres_changes`, keep using it.

Supabase currently documents Broadcast as the more scalable option, while Postgres Changes is simpler. There is no reason to migrate a working production subscription solely for this integration.

Documentation:
https://supabase.com/docs/guides/realtime/subscribing-to-database-changes

https://supabase.com/docs/guides/realtime/postgres-changes

Check whether the existing bookmark table is already enabled in the `supabase_realtime` publication.

If it is not enabled, STOP and show the exact required database configuration change. Do not execute a migration without approval.

If existing Android code does not support the required events, STOP and report the exact gap.

A new extension INSERT does not prove Android sync works. Verify the actual existing subscriber and SQLite cache behaviour.

### Foreground and background expectations

When Android is open and connected, changes should arrive through Realtime.

When Android is backgrounded, closed or disconnected, do not promise an uninterrupted WebSocket connection.

On the next app opening or foreground reconciliation, its existing initial-fetch/sync mechanism must retrieve the current server state.

Do not introduce push notifications or another background sync service in this phase.

# 9. EXTENSION POPUP — PRODUCTION CONNECTED

Adapt the existing Phase 1 popup rather than replacing the visual design.

Maintain the BookMyMark monochrome identity.

### Signed-out state

Show:

- BookMyMark logo.
- Short message: "Everything worth keeping."
- Sign in with Google button.
- Small explanation that sign-in enables cloud saving.

### Signed-in state

Show:

- Current page information.
- Prominent Save button.
- Signed-in email or account indicator.
- Save status.
- Recent saved bookmarks from the existing production database.
- Sign-out option.

### Recent bookmarks

Fetch only the authenticated user's own bookmarks.

Use the existing schema.

Display a compact list with the same design system.

Show changes made by Android or other clients when the popup is opened.

While the popup is open, use an appropriate user-scoped Realtime subscription if needed for live status updates.

Do not keep unnecessary permanent WebSocket connections in the background.

Avoid full-library queries on every popup render. Fetch an appropriate small recent-items limit and load more only when requested.

### Context-menu flow

An authenticated user right-clicks a page or link:

- Capture the exact URL.
- Save through the existing pipeline.
- Update the action badge or show a non-intrusive status.
- Prevent double submission.
- Preserve the exact target.
- Report the real result.

An unauthenticated user receives a clear "Sign in to save to your library" prompt. Do not silently claim a cloud save.

# 10. AUTHENTICATION STORAGE AND TOKEN REFRESH

The Supabase JS client must be configured specifically for the extension environment.

Use:

- Existing production Supabase URL.
- Existing public publishable key.
- Authenticated user session.
- Persistent browser extension storage.
- PKCE authentication.
- Correct token refresh and expiry handling.

Use an appropriate custom storage adapter for `browser.storage.local`.

Follow the installed `@supabase/supabase-js` API rather than copying outdated examples.

Official documentation:

https://supabase.com/docs/reference/javascript/initializing

https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession

https://supabase.com/docs/guides/auth/sessions

https://supabase.com/docs/guides/auth/redirect-urls

Do not trust the user object embedded in an unverified locally stored session for server authorisation.

When necessary, verify the authenticated user through Supabase Auth or validate the JWT through the existing backend authentication middleware.

Avoid concurrent refreshes of a single session from multiple extension contexts.

Never print tokens or refresh tokens in logs.

Never send an access token to an unrelated third-party endpoint.

# 11. BACKEND INTEGRATION AND DEPLOYMENT SAFETY

Reuse the actual existing production backend routes.

Do not implement new duplicate routes.

Do not deploy a new Worker.

Do not modify the current Worker deployment.

If the extension needs an existing API:

- Verify its method.
- Verify its endpoint.
- Verify its request schema.
- Verify its authentication middleware.
- Verify its response.
- Verify its CORS/extension-origin compatibility.
- Use the exact existing contract.

Do not guess API endpoint names or create routes based on old documentation.

If production Worker changes are genuinely required, STOP and report the minimum necessary change for my approval.

### Environment configuration

Use the existing public configuration where appropriate.

Only public values may be bundled:

- Supabase project URL.
- Supabase publishable key.
- Existing public API base URL.

Never bundle:

- Supabase secret key.
- Service-role key.
- Groq API key.
- Private signing keys.
- Backend environment secrets.

If any environment variable is missing, report its name and expected location without printing its value.

# 12. AUTOMATED TESTS

Add tests for the real integration.

### Authentication tests

- OAuth URL creation.
- PKCE callback parsing.
- Valid code exchange.
- Cancelled authentication.
- Expired session.
- Refresh token handling.
- Sign-out.
- Restored session after browser restart.

### Bookmark operation tests

- Save an ordinary webpage.
- Save a clicked hyperlink.
- Save a YouTube URL.
- Save an X post URL.
- Save a Reddit post URL.
- Invalid URL rejection.
- Duplicate prevention.
- Rapid double-click prevention.
- Existing bookmark preservation.
- Authentication-required behaviour.
- Offline pending queue.
- Pending retry.
- Enrichment failure without duplicate creation.

### Security tests

- User A can only read their own bookmarks.
- User A cannot create records belonging to user B.
- User A cannot read user B's bookmarks.
- No client can modify another user's record.
- Invalid or expired tokens are rejected.
- No privileged key is present in the extension build.

Use existing RLS policies and production permissions.

Do not modify policies just to make a test pass.

If policy behaviour is wrong, report the exact issue and stop before changing production security.

# 13. REAL PRODUCTION END-TO-END TESTING

This is the critical validation.

First run automated tests with mocks or a non-production test environment.

Do not insert fake records, seed data, or random test bookmarks into production.

Do not delete or modify real production records to clean up tests.

For the production demonstration, use an intentional URL selected by me.

### Test A — Extension to Supabase

1. Load the Phase 2 extension.
2. Sign in using the same Google account as the Android application.
3. Confirm the Supabase user ID matches the Android account.
4. Open a real webpage.
5. Right-click and save it.
6. Verify the save succeeded.
7. Verify the correct user owns the new database row.

### Test B — Supabase to Android

1. Keep Android logged in with the same account.
2. Keep the Android application open.
3. Save a new bookmark from the extension.
4. Wait for the existing Realtime event.
5. Verify the bookmark appears in the Android UI.
6. Verify the existing SQLite cache is updated through its current listener.
7. Verify it does not appear more than once.

### Test C — Metadata and AI enrichment

1. Save a supported real URL.
2. Verify the existing metadata pipeline executes.
3. Verify existing AI classification is invoked according to its normal rules.
4. Confirm tags, summaries and status updates reach the existing Supabase row.
5. Confirm the Android app receives the updated record through its existing Realtime mechanism.

Do not call AI classification more than once unnecessarily.

### Test D — Reverse direction

1. Make a normal bookmark change from Android.
2. Confirm the change is stored in Supabase.
3. Reopen the extension popup.
4. Verify the latest server state is displayed.
5. If the popup is already open, verify its scoped Realtime update where implemented.

### Test E — Account isolation

Use a separately authorised test account if available.

Verify that each account sees only its own records.

Do not create or delete production users automatically.

### Important distinction

Separate verified tests into:

- Local automated tests.
- Browser-specific build tests.
- Live authentication tests.
- Live production database save tests.
- Live Android Realtime tests.

Do not claim production synchronisation is proven merely because the Supabase insert returned successfully.

# 14. ERROR HANDLING AND PERFORMANCE

Keep the implementation fast and simple.

- Do not poll the database continuously.
- Do not introduce a second sync scheduler.
- Do not create background timers for Realtime.
- Avoid unnecessary metadata calls.
- Avoid repeated authentication requests.
- Avoid loading the complete bookmark library in the popup.
- Use stable operation identifiers.
- Make saves idempotent.
- Avoid duplicate subscriptions.
- Clean up popup subscriptions when closed.
- Retry only safe pending operations.
- Do not automatically retry an operation that might create duplicate records unless idempotency is guaranteed.

Provide understandable errors for:

- Network failure.
- Authentication expiry.
- Insufficient permission.
- Duplicate bookmark.
- Database rejection.
- Enrichment failure.
- Realtime disconnection.

Do not hide failures behind a generic "Saved successfully" message.

# 15. PHASE 2 PRODUCTION SAFETY CHECK

Before final handover:

- Verify no existing bookmark was modified.
- Verify no existing bookmark was deleted.
- Verify no database migration was applied.
- Verify no schema was changed.
- Verify no RLS policy was changed.
- Verify no Android source file was modified.
- Verify no Android build or deployment was performed.
- Verify no production backend deployment occurred.
- Verify Phase 1 functionality still works.
- Verify Chrome build.
- Verify Firefox build.
- Verify Brave compatibility.
- Verify no secrets are included in the distribution bundles.
- Verify Git changes are isolated to approved extension files and any separately approved configuration.

If a production configuration gap prevents completion, disclose it clearly.

Never bypass the protection rules to force the integration to work.

# 16. FINAL ACCEPTANCE CRITERIA

Phase 2 is complete only when:

1. The extension authenticates through the existing BookMyMark account system.
2. Chrome, Firefox and Brave authentication work.
3. The same Supabase user ID is used as Android.
4. A new bookmark is written into the real production database.
5. RLS correctly protects user ownership.
6. Existing metadata extraction and AI enrichment execute exactly once.
7. Existing Android Realtime receives the new record.
8. The existing Android local cache and UI reflect the new record.
9. Subsequent supported updates remain synchronised.
10. There are no duplicate rows from repeated saves.
11. Existing mobile production functionality remains unchanged.
12. No existing production bookmark was modified or deleted.

If any of these acceptance criteria cannot be verified, report the blocker honestly.

# 17. STOP CONDITION

Do not automatically proceed to website development, custom Share-menu integration or another phase.

When Phase 2 implementation is complete:

1. Summarise every file changed.
2. Explain the authentication implementation.
3. Explain the exact production save mechanism reused.
4. Report the database and RLS verification.
5. Report the Android Realtime verification.
6. Report automated tests.
7. Provide Chrome, Firefox and Brave installation/build instructions.
8. List any manual Supabase redirect configuration required.
9. Clearly identify which live tests still require my interaction.
10. Confirm the protected Android application source and existing records remained untouched.

If a production permission, database configuration or Android Realtime capability is missing, stop and request the specific approval needed.

**The final goal is simple: Save something from a desktop browser, and see it in the same BookMyMark library on Android. No duplicate backend. No duplicate database. No mobile redesign. No damage to production.**

Implement the actual code, test the complete flow, and prove the result before declaring Phase 2 complete.