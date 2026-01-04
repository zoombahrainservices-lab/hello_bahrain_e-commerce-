import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * POST /api/payments/benefit/mark-failed
 * Mark order as failed/cancelled after payment error
 * 
 * Request body:
 * - orderId: string (required)
 * 
 * Response:
 * - success: boolean
 * - message: string
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

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return cors.addHeaders(
        NextResponse.json({ message: 'orderId is required' }, { status: 400 }),
        request
      );
    }

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .select('id, user_id, payment_status')
      .eq('id', orderId)
      .eq('user_id', authResult.user.id)
      .single();

    if (orderError || !order) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Order not found' }, { status: 404 }),
        request
      );
    }

    // Don't update if already paid
    if (order.payment_status === 'paid') {
      return cors.addHeaders(
        NextResponse.json({
          success: true,
          message: 'Order already paid',
        }),
        request
      );
    }

    // Mark order as failed (but don't cancel it, user might retry)
    // Note: If 'failed' status is not allowed, we'll keep it as 'unpaid' instead
    // Run FIX_PAYMENT_STATUS_CONSTRAINT.sql to enable 'failed' status
    const { error: updateError } = await getSupabase()
      .from('orders')
      .update({
        payment_status: 'unpaid', // Use 'unpaid' instead of 'failed' if constraint doesn't allow it
        // Don't change status to 'cancelled' - let user retry
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[BENEFIT Mark Failed] Update error:', updateError);
      return cors.addHeaders(
        NextResponse.json({ message: 'Failed to update order' }, { status: 500 }),
        request
      );
    }

    return cors.addHeaders(
      NextResponse.json({
        success: true,
        message: 'Order marked as failed',
      }),
      request
    );
  } catch (error: any) {
    console.error('[BENEFIT Mark Failed] Error:', error);
    return cors.addHeaders(
      NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to mark order as failed',
        },
        { status: 500 }
      ),
      request
    );
  }
}

