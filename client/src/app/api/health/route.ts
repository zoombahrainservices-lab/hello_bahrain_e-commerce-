import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/health - Diagnostic endpoint to check database connection
export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
      hasJwtSecret: !!process.env.JWT_SECRET,
      supabaseUrl: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 20)}...` : 'MISSING',
    };

    // Try to connect to Supabase
    let dbCheck = {
      connected: false,
      error: null as string | null,
      tables: [] as string[],
    };

    try {
      const supabase = getSupabase();
      
      // Try to query a simple table to verify connection
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (usersError) {
        dbCheck.error = usersError.message;
      } else {
        dbCheck.connected = true;
      }

      // Check if tables exist
      const tables = ['users', 'products', 'banners', 'orders', 'order_items', 'categories'];
      for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (!error) {
          dbCheck.tables.push(table);
        }
      }
    } catch (err: any) {
      dbCheck.error = err.message || 'Unknown error';
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

