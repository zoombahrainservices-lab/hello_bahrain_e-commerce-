/**
 * Update wallet timestamp for checkout session
 * 
 * This endpoint allows updating specific wallet-related timestamps
 * for debugging and performance analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

interface UpdateTimestampRequest {
  sessionId: string;
  timestampType: 'open_called_at' | 'callback_returned_at' | 'first_check_status_at' | 'final_status_at';
  timestamp: string; // ISO 8601 timestamp
}

/**
 * POST /api/checkout-sessions/update-wallet-timestamp
 * 
 * Updates a specific wallet timestamp for a checkout session
 */
export async function POST(request: NextRequest) {
  try {
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    // Authenticate user
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return cors.addHeaders(authResult, request);
    }

    const body: UpdateTimestampRequest = await request.json();
    const { sessionId, timestampType, timestamp } = body;

    if (!sessionId || !timestampType || !timestamp) {
      return cors.addHeaders(
        NextResponse.json(
          { message: 'Session ID, timestamp type, and timestamp are required' },
          { status: 400 }
        ),
        request
      );
    }

    // Validate timestamp type
    const validTypes = ['open_called_at', 'callback_returned_at', 'first_check_status_at', 'final_status_at'];
    if (!validTypes.includes(timestampType)) {
      return cors.addHeaders(
        NextResponse.json(
          { message: `Invalid timestamp type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        ),
        request
      );
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await getSupabase()
      .from('checkout_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', authResult.user.id)
      .single();

    if (sessionError || !session) {
      return cors.addHeaders(
        NextResponse.json(
          { message: 'Checkout session not found or unauthorized' },
          { status: 404 }
        ),
        request
      );
    }

    // Update timestamp
    const columnName = `wallet_${timestampType}`;
    const { error: updateError } = await getSupabase()
      .from('checkout_sessions')
      .update({
        [columnName]: timestamp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[Update Wallet Timestamp] Error:', updateError);
      return cors.addHeaders(
        NextResponse.json(
          { message: 'Failed to update timestamp' },
          { status: 500 }
        ),
        request
      );
    }

    console.log(`[Update Wallet Timestamp] Updated ${timestampType} for session ${sessionId}: ${timestamp}`);

    return cors.addHeaders(
      NextResponse.json({
        success: true,
        timestampType,
        timestamp,
      }),
      request
    );
  } catch (error: any) {
    console.error('[Update Wallet Timestamp] Unexpected error:', error);
    return cors.addHeaders(
      NextResponse.json(
        { message: error.message || 'Failed to update timestamp' },
        { status: 500 }
      ),
      request
    );
  }
}

