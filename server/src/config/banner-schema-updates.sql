-- Add alignment columns to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) DEFAULT 'left' CHECK (text_align IN ('left', 'center', 'right'));
ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_vertical VARCHAR(10) DEFAULT 'middle' CHECK (text_vertical IN ('top', 'middle', 'bottom'));
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_align VARCHAR(10) DEFAULT 'left' CHECK (button_align IN ('left', 'center', 'right'));
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_vertical VARCHAR(10) DEFAULT 'middle' CHECK (button_vertical IN ('top', 'middle', 'bottom'));

-- Add order column to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);

