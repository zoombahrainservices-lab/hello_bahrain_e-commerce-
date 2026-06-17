-- =============================================================
-- MEDIA VARIANT ENUM MIGRATION
-- Run in Supabase Dashboard → SQL Editor
-- Adds new responsive variant types for Fix 8
-- =============================================================

ALTER TYPE media_variant_type ADD VALUE IF NOT EXISTS 'tiny';
ALTER TYPE media_variant_type ADD VALUE IF NOT EXISTS 'xs';
ALTER TYPE media_variant_type ADD VALUE IF NOT EXISTS 'card';
ALTER TYPE media_variant_type ADD VALUE IF NOT EXISTS 'hero';
