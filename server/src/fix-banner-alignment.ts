import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixBannerAlignment() {
  console.log('🔧 Adding alignment columns to banners table...\n');

  const queries = [
    "ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) DEFAULT 'left'",
    "ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_vertical VARCHAR(10) DEFAULT 'middle'",
    "ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_align VARCHAR(10) DEFAULT 'left'",
    "ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_vertical VARCHAR(10) DEFAULT 'middle'",
    "ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0",
  ];

  for (const query of queries) {
    console.log(`Running: ${query}`);
    const { error } = await supabase.rpc('exec_sql', { sql: query });
    
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      console.log('\n⚠️  The RPC method might not exist. Running via raw SQL...\n');
      break;
    } else {
      console.log('✅ Success\n');
    }
  }

  // Alternative: Try running all at once
  console.log('🔄 Attempting to run all queries together...\n');
  
  const combinedSQL = `
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) DEFAULT 'left';
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_vertical VARCHAR(10) DEFAULT 'middle';
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_align VARCHAR(10) DEFAULT 'left';
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_vertical VARCHAR(10) DEFAULT 'middle';
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);
  `;

  console.log('SQL to run:');
  console.log(combinedSQL);
  console.log('\n⚠️  Note: Supabase JS client cannot run ALTER TABLE directly.');
  console.log('You need to run this SQL in Supabase Dashboard → SQL Editor\n');

  // Verify by checking a banner
  console.log('🔍 Checking current banner structure...\n');
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('❌ Error fetching banner:', error.message);
  } else if (data) {
    console.log('📋 Current columns in banners table:');
    Object.keys(data).forEach(key => {
      console.log(`  - ${key}`);
    });

    const alignmentColumns = ['text_align', 'text_vertical', 'button_align', 'button_vertical', 'display_order'];
    console.log('\n🎯 Alignment columns status:');
    alignmentColumns.forEach(col => {
      if (col in data) {
        console.log(`  ✅ ${col}: EXISTS (value: ${data[col]})`);
      } else {
        console.log(`  ❌ ${col}: MISSING`);
      }
    });
  }

  process.exit(0);
}

fixBannerAlignment().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});






