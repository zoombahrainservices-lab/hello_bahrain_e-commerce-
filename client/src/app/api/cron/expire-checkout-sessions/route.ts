import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { releaseStockBatch } from '@/lib/db-stock-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/expire-checkout-sessions
 * Cleanup job to expire old checkout sessions and release inventory
 * 
 * This endpoint should be called periodically (every 15-30 minutes) via:
 * - Vercel Cron Jobs (configured in vercel.json)
 * - External cron service (cron-job.org, etc.)
 * - Manual trigger for testing
 * 
 * Security: In production, this should be protected by a secret token or Vercel Cron
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security (recommended in production)
    // const cronSecret = request.headers.get('authorization');
    // if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    const now = new Date().toISOString();

    // Find expired initiated checkout sessions
    const { data: expiredSessions, error: fetchError } = await getSupabase()
      .from('checkout_sessions')
      .select('id, items, inventory_reserved_at, inventory_released_at')
      .eq('status', 'initiated')
      .lt('expires_at', now)
      .is('inventory_released_at', null); // Only process if not already released

    if (fetchError) {
      console.error('Error fetching expired checkout sessions:', fetchError);
      return NextResponse.json(
        { message: 'Error fetching expired sessions', error: fetchError.message },
        { status: 500 }
      );
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      return NextResponse.json({
        message: 'No expired checkout sessions found',
        processed: 0,
      });
    }

    let processedCount = 0;
    const errors: Array<{ sessionId: string; error: string }> = [];

    // Process each expired session
    for (const session of expiredSessions) {
      try {
        const items = session.items || [];

        if (items.length === 0) {
          // Skip sessions with no items
          continue;
        }

        // Release reserved stock
        const releaseResult = await releaseStockBatch(
          items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        );

        if (!releaseResult.success) {
          errors.push({
            sessionId: session.id,
            error: releaseResult.errors?.map(e => e.error).join(', ') || 'Failed to release stock',
          });
          continue;
        }

        // Update session: mark as expired and mark inventory as released
        const { error: updateError } = await getSupabase()
          .from('checkout_sessions')
          .update({
            status: 'expired',
            inventory_released_at: now,
          })
          .eq('id', session.id)
          .eq('status', 'initiated'); // Only update if still initiated (prevent race conditions)

        if (updateError) {
          errors.push({
            sessionId: session.id,
            error: updateError.message || 'Failed to update session status',
          });
          // Stock was already released, but session status update failed
          // This is logged but doesn't prevent processing other sessions
          console.error(`Failed to update session ${session.id} status:`, updateError);
        } else {
          processedCount++;
        }
      } catch (error: any) {
        errors.push({
          sessionId: session.id,
          error: error?.message || 'Unexpected error processing session',
        });
        console.error(`Error processing expired session ${session.id}:`, error);
      }
    }

    return NextResponse.json({
      message: 'Cleanup job completed',
      processed: processedCount,
      total: expiredSessions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in expire-checkout-sessions cron job:', error);
    return NextResponse.json(
      {
        message: 'Error in cleanup job',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/expire-checkout-sessions
 * Allow manual triggering for testing
 */
export async function GET(request: NextRequest) {
  // For testing purposes, GET can trigger the cleanup
  // In production, you might want to disable this or require auth
  return POST(request);
}

