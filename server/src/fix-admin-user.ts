import bcrypt from 'bcrypt';
import { getSupabase } from './config/db';

async function fixAdminUser() {
  const supabase = getSupabase();

  const adminEmail = 'admin@hellobahrain.com';
  const adminPassword = 'Admin@1234';

  try {
    console.log('🔐 Ensuring admin user exists and has a known password...');

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Upsert admin user by email
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          name: 'Admin User',
          email: adminEmail,
          password_hash: passwordHash,
          role: 'admin',
        },
        {
          onConflict: 'email',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to upsert admin user:', error);
      return;
    }

    console.log('✅ Admin user ensured:', data.email, 'role:', data.role);
    console.log('   You can now log in with:');
    console.log('   Email   : admin@hellobahrain.com');
    console.log('   Password: Admin@1234');
  } catch (err) {
    console.error('❌ Error while fixing admin user:', err);
  }
}

fixAdminUser();




