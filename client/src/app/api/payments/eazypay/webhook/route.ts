import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabase } from '@/lib/db';
import { queryTransaction } from '@/lib/services/eazypayCheckout';
import { convertReservedToSold } from '@/lib/db-stock-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/eazypay/webhook
 * Webhook endpoint for EazyPay payment notifications
 * Verifies signature and updates order status idempotently
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timestamp, nonce, globalTransactionsId, isPaid } = body;

    // Validation
    if (!timestamp || !nonce || !globalTransactionsId || typeof isPaid !== 'boolean') {
      return NextResponse.json(
        { message: 'Missing required webhook parameters' },
        { status: 400 }
      );
    }

    // Verify signature
    // signature = HMAC-SHA256(secret, timestamp + nonce + globalTransactionsId + isPaid)
    const secretKey = process.env.EAZYPAY_CHECKOUT_SECRET_KEY;
    if (!secretKey) {
      console.error('EazyPay webhook: Secret key not configured');
      return NextResponse.json(
        { message: 'Webhook configuration error' },
        { status: 500 }
      );
    }

    const providedSignature = request.headers.get('Secret-Hash') || request.headers.get('X-Signature');
    if (!providedSignature) {
      return NextResponse.json(
        { message: 'Missing signature' },
        { status: 401 }
      );
    }

    const message = timestamp + nonce + globalTransactionsId + String(isPaid);
    const computedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('hex');

    if (computedSignature !== providedSignature) {
      console.error('EazyPay webhook: Invalid signature', {
        provided: providedSignature,
        computed: computedSignature,
      });
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 401 }
      );
    }

    // CRITICAL: Find order by global transaction ID (primary key for webhook)
    const { data: orders, error: findError } = await getSupabase()
      .from('orders')
      .select('id, payment_status, paid_on, inventory_status')
      .eq('global_transactions_id', globalTransactionsId)
      .limit(1);

    if (findError || !orders || orders.length === 0) {
      console.error('EazyPay webhook: Order not found', globalTransactionsId);
      // Return 200 to prevent retries for invalid transaction IDs
      return NextResponse.json({ message: 'Order not found' }, { status: 200 });
    }

    const order = orders[0];

    // CRITICAL: Idempotent update - only update if not already paid
    if (order.payment_status === 'paid' && order.paid_on) {
      return NextResponse.json({ message: 'Order already processed' }, { status: 200 });
    }

    // PRODUCTION HARDENING: Fast response - do minimal work here
    // Query transaction details asynchronously if needed, but respond quickly
    // For now, use webhook data directly and query later if needed
    
    // Update order immediately with webhook data
    const updateData: any = {
      payment_status: isPaid ? 'paid' : 'unpaid',
      payment_raw_response: body, // Store webhook payload
    };

    if (isPaid) {
      updateData.paid_on = new Date().toISOString();
    }

    // Fast update - respond quickly
    const { error: updateError } = await getSupabase()
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('EazyPay webhook: Failed to update order', updateError);
      // Still return 200 to prevent retries - log for manual review
      return NextResponse.json({ message: 'Update failed but acknowledged' }, { status: 200 });
    }

    // Convert reserved inventory to sold when payment is confirmed
    if (isPaid && order.inventory_status === 'reserved') {
      const convertResult = await convertReservedToSold(order.id);
      if (!convertResult.success) {
        // Log error but don't fail webhook - inventory state can be corrected later
        console.error('EazyPay webhook: Failed to convert reserved inventory to sold:', convertResult.error);
      }
    }

    // CRITICAL: Return 200 quickly - webhook processing should be fast
    // Additional details can be queried later via query endpoint
    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('EazyPay webhook error:', error);
    return NextResponse.json(
      {
        message: 'Webhook processing error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

