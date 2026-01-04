-- Add alignment columns to banners table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) DEFAULT 'left';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_vertical VARCHAR(10) DEFAULT 'middle';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_align VARCHAR(10) DEFAULT 'left';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_vertical VARCHAR(10) DEFAULT 'middle';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for display order
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'banners' 
AND column_name IN ('text_align', 'text_vertical', 'button_align', 'button_vertical', 'display_order');




























