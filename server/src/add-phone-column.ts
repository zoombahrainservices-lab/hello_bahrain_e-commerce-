import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

// Use same connection strategy as setup-db-direct.ts
const postgresUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:KcI3Ij6EpYUDleFl@db.clmhzxiuzqvebzlkbdjs.supabase.co:5432/postgres';

async function addPhoneColumn() {
  const client = new Client({
    connectionString: postgresUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('📝 Adding phone column to users table (if missing)...');

    const alterSql = `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
    `;

    await client.query(alterSql);

    console.log('✅ Phone column ensured on users table.\n');

    // Quick check that column exists
    const checkSql = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'phone';
    `;
    const result = await client.query(checkSql);

    if (result.rows.length > 0) {
      console.log('🔍 Verified: users.phone column exists.');
    } else {
      console.log('⚠️ Could not verify users.phone column; please check in Supabase UI.');
    }

    await client.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error adding phone column:', error.message);
    await client.end();
    process.exit(1);
  }
}

addPhoneColumn();


