import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export const connectDB = async (): Promise<SupabaseClient> => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" - expected if tables aren't created yet
      console.warn('⚠️  Supabase connection test warning:', error.message);
      console.log('ℹ️  This is normal if you haven\'t created the tables yet. Run the SQL schema to create them.');
    } else {
      console.log('✅ Supabase Connected Successfully');
    }

    return supabase;
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error);
    throw error;
  }
};

export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Call connectDB() first.');
  }
  return supabase;
};
