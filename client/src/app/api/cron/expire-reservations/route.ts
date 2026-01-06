import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { releaseStockBatch } from '@/lib/db-stock-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/expire-reservations
 * Cleanup job to cancel expired unpaid reservations and restore stock
 * 
 * This endpoint should be called periodically (every 5-15 minutes) via:
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

    // Find expired unpaid reservations
    const { data: expiredOrders, error: fetchError } = await getSupabase()
      .from('orders')
      .select(`
        id,
        order_items (
          product_id,
          quantity
        )
      `)
      .eq('payment_status', 'unpaid')
      .eq('inventory_status', 'reserved')
      .lt('reservation_expires_at', now)
      .is('inventory_released_at', null); // Only process if not already released

    if (fetchError) {
      console.error('Error fetching expired reservations:', fetchError);
      return NextResponse.json(
        { message: 'Error fetching expired reservations', error: fetchError.message },
        { status: 500 }
      );
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({
        message: 'No expired reservations found',
        processed: 0,
      });
    }

    let processedCount = 0;
    const errors: Array<{ orderId: string; error: string }> = [];

    // Process each expired order
    for (const order of expiredOrders) {
      try {
        const orderItems = order.order_items || [];

        if (orderItems.length === 0) {
          // Skip orders with no items
          continue;
        }

        // Release reserved stock
        const releaseResult = await releaseStockBatch(
          orderItems.map((item: any) => ({
            productId: item.product_id,
            quantity: item.quantity,
          }))
        );

        if (!releaseResult.success) {
          errors.push({
            orderId: order.id,
            error: releaseResult.errors?.map(e => e.error).join(', ') || 'Failed to release stock',
          });
          continue;
        }

        // Update order: cancel it and mark inventory as released
        const { error: updateError } = await getSupabase()
          .from('orders')
          .update({
            status: 'cancelled',
            inventory_status: 'released',
            inventory_released_at: now,
          })
          .eq('id', order.id)
          .eq('inventory_status', 'reserved'); // Only update if still reserved (prevent race conditions)

        if (updateError) {
          errors.push({
            orderId: order.id,
            error: updateError.message || 'Failed to update order status',
          });
          // Stock was already released, but order status update failed
          // This is logged but doesn't prevent processing other orders
          console.error(`Failed to update order ${order.id} status:`, updateError);
        } else {
          processedCount++;
        }
      } catch (error: any) {
        errors.push({
          orderId: order.id,
          error: error?.message || 'Unexpected error processing order',
        });
        console.error(`Error processing expired order ${order.id}:`, error);
      }
    }

    return NextResponse.json({
      message: 'Cleanup job completed',
      processed: processedCount,
      total: expiredOrders.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in expire-reservations cron job:', error);
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
 * GET /api/cron/expire-reservations
 * Allow manual triggering for testing
 */
export async function GET(request: NextRequest) {
  // For testing purposes, GET can trigger the cleanup
  // In production, you might want to disable this or require auth
  return POST(request);
}



