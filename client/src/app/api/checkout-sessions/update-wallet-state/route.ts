/**
 * Update wallet state for checkout session
 * 
 * This endpoint allows updating the wallet_state for explicit state machine tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

const VALID_STATES = [
  'INITIATED',
  'WALLET_POPUP_OPENED',
  'SDK_CALLBACK_SUCCESS',
  'SDK_CALLBACK_ERROR',
  'USER_CLOSED',
  'PENDING_STATUS_CHECK',
  'PAID',
  'FAILED',
  'EXPIRED',
  'UNKNOWN_NEEDS_MANUAL_REVIEW',
] as const;

type WalletState = typeof VALID_STATES[number];

interface UpdateStateRequest {
  sessionId: string;
  state: WalletState;
  previousState?: string; // For validation
}

/**
 * POST /api/checkout-sessions/update-wallet-state
 * 
 * Updates the wallet_state for a checkout session
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

    const body: UpdateStateRequest = await request.json();
    const { sessionId, state, previousState } = body;

    if (!sessionId || !state) {
      return cors.addHeaders(
        NextResponse.json(
          { message: 'Session ID and state are required' },
          { status: 400 }
        ),
        request
      );
    }

    // Validate state
    if (!VALID_STATES.includes(state)) {
      return cors.addHeaders(
        NextResponse.json(
          { message: `Invalid state. Must be one of: ${VALID_STATES.join(', ')}` },
          { status: 400 }
        ),
        request
      );
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await getSupabase()
      .from('checkout_sessions')
      .select('id, wallet_state')
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

    // Validate state transition (if previousState provided)
    if (previousState && session.wallet_state !== previousState) {
      console.warn(`[Update Wallet State] State mismatch: expected ${previousState}, got ${session.wallet_state}`);
      // Still allow update, but log warning
    }

    const oldState = session.wallet_state;
    
    // Update state
    const { error: updateError } = await getSupabase()
      .from('checkout_sessions')
      .update({
        wallet_state: state,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[Update Wallet State] Error:', updateError);
      return cors.addHeaders(
        NextResponse.json(
          { message: 'Failed to update state' },
          { status: 500 }
        ),
        request
      );
    }

    console.log(`[Update Wallet State] State transition for session ${sessionId}: ${oldState || 'NULL'} -> ${state}`);

    return cors.addHeaders(
      NextResponse.json({
        success: true,
        state,
        previousState: oldState,
      }),
      request
    );
  } catch (error: any) {
    console.error('[Update Wallet State] Unexpected error:', error);
    return cors.addHeaders(
      NextResponse.json(
        { message: error.message || 'Failed to update state' },
        { status: 500 }
      ),
      request
    );
  }
}

