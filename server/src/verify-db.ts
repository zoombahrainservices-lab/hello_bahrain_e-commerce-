import dotenv from 'dotenv';
import { connectDB, getSupabase } from './config/db';

dotenv.config();

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database connection and tables...\n');

    await connectDB();
    const supabase = getSupabase();

    // Check each required table
    const tables = ['users', 'products', 'banners', 'orders', 'order_items'];
    const results: { [key: string]: boolean } = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error && error.code === 'PGRST116') {
          results[table] = false;
          console.log(`❌ Table '${table}' does not exist`);
        } else {
          results[table] = true;
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (err: any) {
        if (err.code === 'PGRST116' || err.message?.includes('does not exist')) {
          results[table] = false;
          console.log(`❌ Table '${table}' does not exist`);
        } else {
          console.log(`⚠️  Could not verify table '${table}': ${err.message}`);
        }
      }
    }

    const allExist = Object.values(results).every(exists => exists);

    console.log('\n' + '='.repeat(50));
    if (allExist) {
      console.log('✅ All tables exist! Database is ready.');
      console.log('✅ You can now run: npm run seed');
    } else {
      console.log('❌ Some tables are missing.');
      console.log('\n📝 To fix this:');
      console.log('1. Go to: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/sql/new');
      console.log('2. Open: server/src/config/schema.sql');
      console.log('3. Copy ALL contents and paste into SQL Editor');
      console.log('4. Click "Run"');
      console.log('5. Then run this script again: npm run verify-db');
    }
    console.log('='.repeat(50) + '\n');

    process.exit(allExist ? 0 : 1);
  } catch (error: any) {
    console.error('❌ Error verifying database:', error.message);
    process.exit(1);
  }
}

verifyDatabase();




