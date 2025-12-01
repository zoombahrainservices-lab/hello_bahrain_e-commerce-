# Banner Alignment Columns Fix

## Problem
Alignment values are not being saved because the database columns don't exist.

## Solution
Run this SQL in your Supabase SQL Editor:

```sql
-- Add alignment columns to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) DEFAULT 'left';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_vertical VARCHAR(10) DEFAULT 'middle';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_align VARCHAR(10) DEFAULT 'left';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_vertical VARCHAR(10) DEFAULT 'middle';

-- Add display order column
ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for display order
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);
```

## Steps:
1. Go to your Supabase Dashboard
2. Click on "SQL Editor"
3. Paste the SQL above
4. Click "Run"
5. Restart your backend server
6. Try updating a banner with alignment settings

## After Running SQL:
- Alignment values will be saved properly
- Display order will work
- All banner features will be fully functional




