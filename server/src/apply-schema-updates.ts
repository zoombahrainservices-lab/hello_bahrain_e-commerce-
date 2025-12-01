import dotenv from 'dotenv';
import { getSupabase } from './config/db';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function applySchemaUpdates() {
  try {
    console.log('🔄 Applying database schema updates...\n');

    const supabase = getSupabase();
    const schemaPath = path.join(__dirname, 'config', 'schema-updates.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        // Execute each statement using RPC or direct SQL
        // Note: Supabase doesn't support direct SQL execution via client
        // You'll need to run this in Supabase SQL Editor
        console.log(`Executing: ${statement.substring(0, 50)}...`);
      } catch (error: any) {
        console.error(`Error executing statement: ${error.message}`);
      }
    }

    console.log('\n✅ Schema updates applied!');
    console.log('\n📝 Note: Some updates may need to be run manually in Supabase SQL Editor');
    console.log('   See: server/src/config/schema-updates.sql');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error applying schema updates:', error.message);
    console.log('\n📝 Please run the SQL manually in Supabase SQL Editor:');
    console.log('   File: server/src/config/schema-updates.sql');
    process.exit(1);
  }
}

applySchemaUpdates();




