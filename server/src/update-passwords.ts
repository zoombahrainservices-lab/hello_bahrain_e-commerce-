import bcrypt from 'bcrypt';
import { getSupabase } from './config/db';

async function updatePasswords() {
  const supabase = getSupabase();

  // Choose new strong passwords that satisfy the frontend rules
  const newAdminPassword = 'Admin@1234';
  const newUserPassword = 'User@1234';

  try {
    console.log('🔐 Updating admin and test user passwords...');

    const adminHash = await bcrypt.hash(newAdminPassword, 10);
    const userHash = await bcrypt.hash(newUserPassword, 10);

    // Update admin user
    const { error: adminError } = await supabase
      .from('users')
      .update({ password_hash: adminHash })
      .eq('email', 'admin@hellobahrain.com');

    if (adminError) {
      console.error('Failed to update admin password:', adminError);
    } else {
      console.log('✅ Updated admin password (admin@hellobahrain.com)');
    }

    // Update test user
    const { error: userError } = await supabase
      .from('users')
      .update({ password_hash: userHash })
      .eq('email', 'user@example.com');

    if (userError) {
      console.error('Failed to update test user password:', userError);
    } else {
      console.log('✅ Updated test user password (user@example.com)');
    }

    console.log('🎉 Done. You can now log in with the new passwords:');
    console.log('   Admin: admin@hellobahrain.com / Admin@1234');
    console.log('   User : user@example.com        / User@1234');
  } catch (err) {
    console.error('Error while updating passwords:', err);
  }
}

updatePasswords();




