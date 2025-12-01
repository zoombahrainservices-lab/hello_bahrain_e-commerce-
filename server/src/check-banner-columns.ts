import { getSupabase, connectDB } from './config/db';

async function checkBannerColumns() {
  try {
    await connectDB();
    console.log('🔍 Checking banner table structure...\n');

    // Fetch one banner to see what columns exist
    const { data, error } = await getSupabase()
      .from('banners')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching banner:', error.message);
      return;
    }

    if (!data) {
      console.log('⚠️  No banners found in database');
      return;
    }

    console.log('✅ Banner data structure:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n📋 Available columns:');
    Object.keys(data).forEach(key => {
      console.log(`  - ${key}`);
    });

    console.log('\n🎯 Checking alignment columns:');
    const alignmentColumns = ['text_align', 'text_vertical', 'button_align', 'button_vertical', 'display_order'];
    alignmentColumns.forEach(col => {
      if (col in data) {
        console.log(`  ✅ ${col}: ${data[col]}`);
      } else {
        console.log(`  ❌ ${col}: MISSING`);
      }
    });

    console.log('\n💡 If columns are MISSING, run this SQL in Supabase:');
    console.log('ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) DEFAULT \'left\';');
    console.log('ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_vertical VARCHAR(10) DEFAULT \'middle\';');
    console.log('ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_align VARCHAR(10) DEFAULT \'left\';');
    console.log('ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_vertical VARCHAR(10) DEFAULT \'middle\';');
    console.log('ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

checkBannerColumns();

