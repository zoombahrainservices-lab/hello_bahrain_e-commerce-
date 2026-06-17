-- Migration: add search_vector column to media_items
-- The app queries .textSearch('search_vector', ...) but the schema only had a
-- functional GIN index with no stored column, causing silent search failures.
-- Run this once in the Supabase SQL editor.

-- 1. Add the stored tsvector column (safe to re-run)
ALTER TABLE media_items
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Backfill all existing rows
UPDATE media_items
SET search_vector = to_tsvector(
  'simple',
  coalesce(original_file_name, '') || ' ' ||
  coalesce(file_name,           '') || ' ' ||
  coalesce(alt_text,            '') || ' ' ||
  coalesce(title,               '') || ' ' ||
  coalesce(caption,             '')
);

-- 3. GIN index on the new stored column
--    (keeps the old functional index too — it does not conflict)
CREATE INDEX IF NOT EXISTS media_items_search_vector_idx
  ON media_items USING gin(search_vector);

-- 4. Trigger function to keep search_vector current on every write
CREATE OR REPLACE FUNCTION media_items_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'simple',
    coalesce(NEW.original_file_name, '') || ' ' ||
    coalesce(NEW.file_name,           '') || ' ' ||
    coalesce(NEW.alt_text,            '') || ' ' ||
    coalesce(NEW.title,               '') || ' ' ||
    coalesce(NEW.caption,             '')
  );
  RETURN NEW;
END;
$$;

-- 5. Attach the trigger (DROP first so re-running is safe)
DROP TRIGGER IF EXISTS media_items_search_vector_trigger ON media_items;
CREATE TRIGGER media_items_search_vector_trigger
  BEFORE INSERT OR UPDATE ON media_items
  FOR EACH ROW EXECUTE FUNCTION media_items_search_vector_update();
