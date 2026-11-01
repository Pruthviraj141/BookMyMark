-- Migration: 20261101000000_create_bookmarks_and_storage.sql
-- Description: Create bookmarks table with RLS, indexes, and private storage bucket

-- 1. Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  title TEXT,
  description TEXT,
  shared_text TEXT,
  extracted_text TEXT,
  summary TEXT,
  category TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_type TEXT,
  thumbnail_url TEXT,
  cover_storage_path TEXT,
  cover_source TEXT,
  cover_status TEXT DEFAULT 'pending',
  ai_status TEXT NOT NULL DEFAULT 'pending',
  ai_confidence REAL,
  ai_evidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ DEFAULT now(),
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  metadata_hash TEXT,
  CONSTRAINT bookmarks_user_normalized_url_unique UNIQUE (user_id, normalized_url)
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON public.bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_platform ON public.bookmarks(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_category ON public.bookmarks(user_id, category);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_normalized ON public.bookmarks(user_id, normalized_url);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON public.bookmarks USING GIN (tags);

-- 3. Row Level Security on bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can read own bookmarks"
  ON public.bookmarks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can update own bookmarks"
  ON public.bookmarks FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 4. Create private storage bucket for bookmark covers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bookmark-covers',
  'bookmark-covers',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 5. Storage RLS policies for bookmark-covers
DROP POLICY IF EXISTS "Authenticated users can read own covers" ON storage.objects;
CREATE POLICY "Authenticated users can read own covers"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bookmark-covers'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

DROP POLICY IF EXISTS "Authenticated users can upload own covers" ON storage.objects;
CREATE POLICY "Authenticated users can upload own covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bookmark-covers'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

DROP POLICY IF EXISTS "Authenticated users can update own covers" ON storage.objects;
CREATE POLICY "Authenticated users can update own covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'bookmark-covers'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'bookmark-covers'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

DROP POLICY IF EXISTS "Authenticated users can delete own covers" ON storage.objects;
CREATE POLICY "Authenticated users can delete own covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'bookmark-covers'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
