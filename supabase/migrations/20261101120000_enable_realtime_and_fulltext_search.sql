-- Migration: 20261101120000_enable_realtime_and_fulltext_search.sql
-- Description: Add bookmarks to supabase_realtime and create generated search_vector with GIN index

-- 1. Enable Supabase Realtime on public.bookmarks
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'bookmarks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
  END IF;
END $do$;

-- 2. Add full-text search vector generated column
ALTER TABLE public.bookmarks
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '') || ' ' || coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(shared_text, '') || ' ' || coalesce(extracted_text, '') || ' ' || coalesce(tags::text, '')), 'C')
) STORED;

-- 3. Create GIN index for ultra-fast full-text search
CREATE INDEX IF NOT EXISTS idx_bookmarks_search_vector
ON public.bookmarks
USING GIN (search_vector);
