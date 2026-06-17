-- Migration: Add media_id column to banners table
-- This links banners to the media library for proper usage tracking and variant support.

ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS media_id uuid REFERENCES media_items(id) ON DELETE SET NULL;

-- Backfill: for existing banners that were imported into media_items via the
-- import-existing-images migration, try to match them by public_url / storage_path.
-- Run manually if needed after the import migration has been executed:
--
-- UPDATE banners b
-- SET media_id = mi.id
-- FROM media_items mi
-- WHERE mi.public_url = b.image
--   AND b.media_id IS NULL;
