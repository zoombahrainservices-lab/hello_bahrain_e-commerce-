import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { getCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Handle OPTIONS (preflight)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

// GET /api/auth/me
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  try {
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      // Add CORS headers to error response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        authResult.headers.set(key, value);
      });
      return authResult;
    }

    const user = await supabaseHelpers.findUserById(authResult.user.id);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
      },
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}



