import dotenv from 'dotenv';
import { connectDB, getSupabase } from './config/db';

dotenv.config();

async function debugUsers() {
  await connectDB();
  const supabase = getSupabase();

  console.log('🔍 Listing users (email, role, has password_hash)...\n');

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, password_hash')
    .limit(20);

  if (error) {
    console.error('❌ Error fetching users:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('ℹ️ No users found in the database.');
    process.exit(0);
  }

  for (const user of data) {
    console.log({
      id: user.id,
      email: user.email,
      role: user.role,
      hasPasswordHash: !!user.password_hash,
      passwordHashPreview: user.password_hash ? String(user.password_hash).slice(0, 10) + '...' : null,
    });
  }

  process.exit(0);
}

debugUsers();



