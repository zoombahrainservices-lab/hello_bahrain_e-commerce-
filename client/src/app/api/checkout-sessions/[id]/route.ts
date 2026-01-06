import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * GET /api/checkout-sessions/[id]
 * Get checkout session by ID
 * 
 * Response:
 * - Session data with all fields
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return cors.addHeaders(authResult, request);
    }

    const sessionId = params.id;

    if (!sessionId) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Session ID is required' }, { status: 400 }),
        request
      );
    }

    const supabase = getSupabase();
    
    // Get checkout session - NO status filter so we can fetch paid/failed sessions too
    const { data: session, error } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', authResult.user.id) // Security: only get user's own sessions
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return cors.addHeaders(
          NextResponse.json({ message: 'Checkout session not found' }, { status: 404 }),
          request
        );
      }
      throw error;
    }

    return cors.addHeaders(
      NextResponse.json(session),
      request
    );
  } catch (error: any) {
    console.error('[Checkout Session] GET error:', error);
    return cors.addHeaders(
      NextResponse.json(
        { message: error.message || 'Failed to fetch checkout session' },
        { status: 500 }
      ),
      request
    );
  }
}


