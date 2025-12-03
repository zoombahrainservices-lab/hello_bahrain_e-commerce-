import { readFileSync } from 'fs';
import { join } from 'path';
import { getSupabase } from './config/db';

async function applyBannerSchemaFix() {
  try {
    console.log('📋 Applying banner schema fixes...');
    console.log('⚠️  Note: This script shows the SQL to run manually.');
    console.log('   Please copy and paste it into Supabase SQL Editor.\n');

    const sqlPath = join(__dirname, 'config', 'banner-schema-updates.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📝 SQL to run in Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
    console.log('\n✅ Copy the SQL above and run it in Supabase SQL Editor');
    console.log('   Then restart your backend server.\n');
  } catch (error) {
    console.error('❌ Error reading SQL file:', error);
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
    console.log(`
-- Add alignment columns to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) DEFAULT 'left' CHECK (text_align IN ('left', 'center', 'right'));
ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_vertical VARCHAR(10) DEFAULT 'middle' CHECK (text_vertical IN ('top', 'middle', 'bottom'));
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_align VARCHAR(10) DEFAULT 'left' CHECK (button_align IN ('left', 'center', 'right'));
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_vertical VARCHAR(10) DEFAULT 'middle' CHECK (button_vertical IN ('top', 'middle', 'bottom'));

-- Add order column to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);
    `);
  }
}

applyBannerSchemaFix();






