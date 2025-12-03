import { readFileSync } from 'fs';
import { join } from 'path';
import { getSupabase } from './config/db';

async function applyBannerSchemaUpdates() {
  try {
    console.log('📋 Applying banner schema updates...');

    const supabase = getSupabase();
    const sqlPath = join(__dirname, 'config', 'banner-schema-updates.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', {
          query: statement,
        });

        if (error) {
          // If RPC doesn't exist, try direct query (this might not work for ALTER TABLE)
          console.log('⚠️  Note: Some schema updates may need to be applied manually in Supabase SQL Editor');
          console.log('SQL to run:', statement);
        } else {
          console.log('✅ Applied:', statement.substring(0, 50) + '...');
        }
      }
    }

    console.log('✅ Banner schema updates applied!');
    console.log('📝 If you see warnings above, please run the SQL manually in Supabase SQL Editor');
  } catch (error) {
    console.error('❌ Error applying banner schema updates:', error);
    console.log('📝 Please run the SQL in server/src/config/banner-schema-updates.sql manually in Supabase SQL Editor');
  }
}

applyBannerSchemaUpdates();






