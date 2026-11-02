# AGENTS.md — BookMyMark Production Safety & Development Guardrails

## 1. Production Application Freeze (ABSOLUTE RULE)
The existing production application (Android mobile app, Supabase backend, Cloudflare Worker API) is **FROZEN** and strictly **OUT OF SCOPE** for desktop/extension development.

### Protected Files and Directories (READ-ONLY)
Under no circumstances may any agent modify, refactor, rename, move, delete, overwrite, or replace:
- `frontend/src/**` (All React components, screens, services, theme, hooks, router)
- `frontend/android/**` (Native Java/Kotlin plugins, Manifest, Gradle files, resources, APKs)
- `frontend/capacitor.config.ts`
- `frontend/public/**`
- `frontend/package.json` and build configurations (`vite.config.ts`, `tsconfig*.json`)
- `backend/src/**` (Production Cloudflare Worker `worker.ts`, services, extractors, providers)
- `backend/package.json` and Cloudflare configuration (`wrangler.jsonc`)
- `supabase/migrations/**` (Database schemas, RLS policies, triggers, indexes)
- Any environment files (`.env*`) and production credentials

### Inviolable Invariants
- **Do not modify the existing Android application UI or UX.**
- **Do not change mobile navigation, screens, components, themes, or styles.**
- **Do not change application authentication behavior or token handling.**
- **Do not alter bookmark creation, SQLite/localStorage caching, or offline sync.**
- **Do not modify the AI classification pipeline or metadata extraction logic.**
- **Do not modify production database schemas, tables, RLS policies, or migrations.**
- **Do not clear, reset, seed, bulk-update, or delete database records.**
- **Never expose or replace API keys, secrets, or service-role keys.**
- **Do not deploy backend updates or publish app builds.**

If a task seems to require modifying any protected area, **STOP IMMEDIATELY** and ask for explicit approval.

---

## 2. Desktop & Browser Extension Isolation
All new development must be strictly isolated into independent directories created only upon explicit approval:
- `browser-extension/` — Chrome, Firefox, and Brave browser extension (using WXT + TypeScript).
- `web/` — Desktop web application (when scheduled and approved).
- `shared/` — New reusable design utilities only if necessary. Never extract from or move existing code out of `frontend/src/`.

**Rules:**
- Never move existing frontend components into another directory.
- Never modify existing package configs or import paths to accommodate new projects.
- Reference existing design files in read-only mode and reproduce styles independently.

---

## 3. Production Backend & Data Architecture
- **Data Source of Truth**: Supabase PostgreSQL (`public.bookmarks` table).
- **Authentication**: Supabase Auth (JWT issued to authenticated users).
- **Security & Authorization**: Row Level Security (RLS) enforces `(auth.uid() = user_id)`. Never bypass RLS and never use the Supabase service-role key on client-side code.
- **Saving Mechanism**:
  1. Direct insert to Supabase REST / Supabase Client with authenticated user JWT.
  2. Asynchronous background call to Cloudflare Worker `POST /api/bookmarks/:id/enrich` with `Authorization: Bearer <token>`.
  3. No image persistence policy (`thumbnail_url: null` on insert).
- **URL Normalization**: Always strip URL tracking parameters (`utm_*`, `fbclid`, `gclid`, etc.) and trailing slashes to respect the `bookmarks_user_normalized_url_unique` constraint.

---

## 4. Phase-by-Phase Development Discipline
- Work strictly in designated, approved phases.
- Before beginning each phase:
  1. Detail planned changes.
  2. Identify all affected files.
  3. Detail any production/backend dependencies.
  4. Wait for explicit user approval before execution.
- Validate the phase, report concise results, and **STOP**. Do not advance automatically.

---

## 5. Git & Working Tree Safety
- Verify `git status` before and after operations.
- Preserve all existing user modifications and uncommitted changes.
- Never execute destructive Git commands (`git reset --hard`, `git clean -fd`, `git checkout -- .`).
