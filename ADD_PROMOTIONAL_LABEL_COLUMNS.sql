-- Add promotional label columns to products table
-- Run this in Supabase SQL Editor

ALTER TABLE products
ADD COLUMN IF NOT EXISTS promotional_label TEXT,
ADD COLUMN IF NOT EXISTS promotional_label_color TEXT DEFAULT '#ef4444';

-- Add comment to explain the columns
COMMENT ON COLUMN products.promotional_label IS 'Custom promotional label text (e.g., "SALE", "50% OFF", "HOT"). If NULL, auto-generated labels will be used.';
COMMENT ON COLUMN products.promotional_label_color IS 'Background color for the promotional label in hex format (e.g., "#ef4444"). Default is red.';

