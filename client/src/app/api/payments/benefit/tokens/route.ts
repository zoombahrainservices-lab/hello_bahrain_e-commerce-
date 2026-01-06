import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { cors } from '@/lib/cors';
import { getUserTokens } from '@/lib/services/benefit/token-storage';

export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * GET /api/payments/benefit/tokens
 * Get user's saved payment tokens (metadata only, no encrypted tokens)
 * 
 * Response:
 * - Array of token metadata: [{ id, card_alias, last_4_digits, card_type, is_default, created_at }]
 */
export async function GET(request: NextRequest) {
  try {
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    // Authenticate user
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return cors.addHeaders(authResult, request);
    }

    // Check if feature is enabled
    if (process.env.BENEFIT_FASTER_CHECKOUT_ENABLED !== 'true') {
      return cors.addHeaders(
        NextResponse.json({ tokens: [] }, { status: 200 }),
        request
      );
    }

    // Get user's saved tokens (metadata only)
    const tokens = await getUserTokens(authResult.user.id);

    return cors.addHeaders(
      NextResponse.json({ tokens }),
      request
    );
  } catch (error: any) {
    console.error('[BENEFIT Tokens] Error:', error);
    return cors.addHeaders(
      NextResponse.json(
        {
          error: 'Failed to fetch tokens',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      ),
      request
    );
  }
}


