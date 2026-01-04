import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/health - Diagnostic endpoint to check database connection
export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    
    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasJwtSecret: !!process.env.JWT_SECRET,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
      supabaseUrlValid: supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co'),
      supabaseKeyLength: supabaseKey.length,
      supabaseKeyStartsWith: supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'MISSING',
    };

    // Try to connect to Supabase
    let dbCheck = {
      connected: false,
      error: null as string | null,
      tables: [] as string[],
    };

    try {
      // First, validate the URL format
      if (!supabaseUrl || !supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
        dbCheck.error = `Invalid Supabase URL format. Expected: https://xxxxx.supabase.co, Got: ${supabaseUrl.substring(0, 50)}`;
        return NextResponse.json({
          status: 'error',
          timestamp: new Date().toISOString(),
          environment: envCheck,
          database: dbCheck,
          message: 'Invalid Supabase URL configuration',
        });
      }

      const supabase = getSupabase();
      
      // Try to query a simple table to verify connection
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (usersError) {
        dbCheck.error = `${usersError.message} (Code: ${usersError.code || 'N/A'})`;
        if (usersError.code === 'PGRST116') {
          dbCheck.error += ' - Table does not exist. Run schema.sql in Supabase.';
        }
      } else {
        dbCheck.connected = true;
      }

      // Check if tables exist
      const tables = ['users', 'products', 'banners', 'orders', 'order_items', 'categories'];
      for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (!error) {
          dbCheck.tables.push(table);
        } else if (error.code === 'PGRST116') {
          // Table doesn't exist - this is expected if schema not run
        }
      }
    } catch (err: any) {
      dbCheck.error = `${err.message || 'Unknown error'} (Type: ${err.constructor?.name || 'Error'})`;
      if (err.message?.includes('fetch failed')) {
        dbCheck.error += ' - Cannot reach Supabase. Check URL and network.';
      }
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbCheck,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

