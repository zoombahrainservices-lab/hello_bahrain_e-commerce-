import dotenv from 'dotenv';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Parse PostgreSQL connection string
const postgresUrl = process.env.DATABASE_URL || 'postgresql://postgres:KcI3Ij6EpYUDleFl@db.clmhzxiuzqvebzlkbdjs.supabase.co:5432/postgres';

async function setupDatabase() {
  const client = new Client({
    connectionString: postgresUrl,
    ssl: {
      rejectUnauthorized: false, // Supabase requires SSL
    },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read SQL schema file
    const schemaPath = path.join(__dirname, 'config/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📝 Executing database schema...\n');

    // Execute the entire SQL file
    await client.query(sql);

    console.log('✅ Database schema executed successfully!\n');

    // Verify tables were created
    const tables = ['users', 'products', 'banners', 'orders', 'order_items'];
    console.log('🔍 Verifying tables...\n');

    for (const table of tables) {
      const result = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
        [table]
      );
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' not found`);
      }
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('✅ You can now run: npm run seed');

    await client.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error setting up database:', error.message);
    console.error('\n📝 If you see permission errors, you may need to:');
    console.log('1. Run the SQL manually in Supabase SQL Editor');
    console.log('2. Go to: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/sql/new');
    console.log('3. Copy contents of server/src/config/schema.sql');
    console.log('4. Paste and run in SQL Editor\n');
    await client.end();
    process.exit(1);
  }
}

setupDatabase();

