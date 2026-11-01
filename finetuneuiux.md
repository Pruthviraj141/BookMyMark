# SAVR — READABILITY, SMOOTH SCROLLING & CATEGORY EXPERIENCE REFINEMENT

Work on my existing SAVR Android application.

I like the current overall layout and monochrome black-and-white visual direction. Do not redesign the entire application again.

Fix the reading experience, scrolling performance and navigation.

## 1. FIX READABILITY FIRST

The current interface is difficult to read and lacks visual flow.

Inspect and improve:

- Font sizes.
- Font weights.
- Line heights.
- Text contrast.
- Paragraph spacing.
- Card title hierarchy.
- Metadata readability.
- Tag sizing.
- Content alignment.

Use a consistent, highly readable typography system.

Make titles prominent, descriptions comfortable to read and metadata subtle but legible.

Avoid excessively small text, tightly packed information and unnecessary truncation.

Keep the strict monochrome design.

Make the application feel like a professional reading and content library, not a generic dashboard.

## 2. FIX SMOOTH SCROLLING

Profile the existing Android application and identify the actual causes of scrolling jank.

Investigate:

- Repeated React renders.
- Masonry layout recalculations.
- Image loading and layout shifts.
- Unnecessary state updates.
- Nested scroll containers.
- Expensive shadows, filters and animations.
- IntersectionObserver duplication.
- Large unoptimized image rendering.

Improve:

- BookmarkCard memoization.
- Stable React keys.
- Lazy-loaded images with reserved aspect ratios.
- Efficient masonry rendering.
- Pagination for larger feeds.
- Stable component state.
- Smooth native-feeling vertical scrolling.
- Minimal layout shifts.

Avoid replacing the existing masonry implementation unless profiling demonstrates that it is the root cause.

Remove unnecessary animations and expensive CSS effects.

Test smooth scrolling on an actual Android device.

## 3. HOME SCREEN — KEEP IT SIMPLE

Keep the existing home layout and header.

The top platform filter row must remain:

All | Instagram | X | YouTube | Reddit | ...

Show platforms only when bookmarks from those platforms exist.

IMPORTANT:

Remove the entire horizontal category-chip row from the Home screen.

Home should only show:
- All.
- Dynamically available platform filters.
- Bookmark masonry feed.

Do not show Technology, Funny, Entertainment or other category chips on Home.

## 4. ADD A DEDICATED CATEGORY SCREEN

Add a Category entry button in the top header, immediately before the Search button.

Use a simple monochrome grid icon.

When tapped, navigate to a separate Categories screen.

Create a beautiful Google Photos-inspired category selection experience.

Use a two-column grid with large, comfortable category tiles.

Suggested categories include:

- Technology.
- AI & Science.
- Education.
- Knowledge.
- Entertainment.
- Movies.
- Funny.
- Motivation.
- Fitness.
- Lifestyle.
- Travel.
- Other.

IMPORTANT:

These must NOT be permanently hardcoded UI categories.

Generate category entries dynamically from existing bookmark categories.

When AI creates a new category, it should automatically appear on the Categories screen.

Each category tile should display:
- Category name.
- Number of saved bookmarks.
- Optional small monochrome icon.
- A subtle preview or visual treatment.

When a category is tapped, display only bookmarks belonging to that category.

Maintain the existing search and bookmark services.

Do not create another database or AI categorization system.

If multiple category names represent the same concept, normalize them sensibly without deleting existing user data.

## 5. SWIPE NAVIGATION

Keep existing bottom navigation buttons.

However, also support natural horizontal swiping between:

Home ↔ Search ↔ Favorites.

Requirements:

- Tapping navigation buttons must still work.
- Swiping left and right should switch primary tabs.
- Preserve the selected tab.
- Do not conflict with vertical feed scrolling.
- Use clear horizontal gesture thresholds.
- Avoid accidental navigation when a user scrolls vertically.
- Do not intercept gestures inside inputs, modals or the bookmark detail bottom sheet.

The Categories screen should open through its dedicated header action and support normal back navigation.

Keep Android back-button behaviour correct.

## 6. PRESERVE EXISTING DESIGN AND FUNCTIONALITY

Keep:
- Monochrome black-and-white palette.
- Existing SAVR logo.
- Existing masonry layout.
- Bookmark cover previews.
- Bookmark details bottom sheet.
- Supabase Google authentication.
- Direct Supabase CRUD.
- SQLite synchronization.
- Supabase Realtime.
- Cloudflare Worker.
- Text-only Groq classification.
- Android Sharesheet.

Do not introduce new AI models, databases or dependencies.

Do not introduce additional colorful accents.

Do not add unnecessary dashboard elements.

## 7. IMPLEMENTATION AND VERIFICATION

Work in this order:

1. Inspect typography and readability issues.
2. Identify scrolling performance bottlenecks.
3. Fix font hierarchy and spacing.
4. Optimize masonry rendering and image loading.
5. Remove the Home category-chip row.
6. Create dynamic Categories screen.
7. Add category header action before Search.
8. Implement horizontal swipe navigation.
9. Test both light and dark modes.
10. Build and verify the Android APK.

Do not use fake categories or fake bookmarks.

Do not leave buttons without functionality.

Take screenshots of the actual redesigned screens where possible.

Test vertical scrolling, horizontal navigation and category selection on Android.

FINAL OBJECTIVE:

Keep Home clean, make reading effortless, make scrolling smooth and give categories their own beautiful 2-column discovery screen.

The application should feel as intuitive as Google Photos, while retaining SAVR's own professional monochrome identity.