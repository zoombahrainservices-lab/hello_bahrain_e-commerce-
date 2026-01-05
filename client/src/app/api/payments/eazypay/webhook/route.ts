import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabase } from '@/lib/db';
import { queryTransaction } from '@/lib/services/eazypayCheckout';
import { releaseStockBatch } from '@/lib/db-stock-helpers';
import { supabaseHelpers } from '@/lib/supabase-helpers';

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

    // CRITICAL: Find checkout session by global transaction ID (primary key for webhook)
    const { data: sessions, error: findError } = await getSupabase()
      .from('checkout_sessions')
      .select('*')
      .eq('global_transactions_id', globalTransactionsId)
      .eq('status', 'initiated')
      .limit(1);

    if (findError || !sessions || sessions.length === 0) {
      console.error('EazyPay webhook: Checkout session not found', globalTransactionsId);
      // Return 200 to prevent retries for invalid transaction IDs
      return NextResponse.json({ message: 'Session not found' }, { status: 200 });
    }

    const session = sessions[0];

    // Check if session already has an order (idempotency)
    if (session.order_id) {
      const { data: existingOrder } = await getSupabase()
        .from('orders')
        .select('id, payment_status')
        .eq('id', session.order_id)
        .single();
      
      if (existingOrder && existingOrder.payment_status === 'paid') {
        return NextResponse.json({ message: 'Order already processed' }, { status: 200 });
      }
    }

    // If payment failed, mark session as failed and release inventory
    if (!isPaid) {
      // Mark session as failed
      await getSupabase()
        .from('checkout_sessions')
        .update({ 
          status: 'failed',
          inventory_released_at: new Date().toISOString(),
        })
        .eq('id', session.id);
      
      // Release reserved inventory
      await releaseStockBatch(
        session.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      ).catch(releaseError => {
        console.error('EazyPay webhook: Failed to release stock:', releaseError);
      });
      
      // Return 200 quickly
      return NextResponse.json({ message: 'Webhook processed - payment failed' }, { status: 200 });
    }

    // Payment successful - create order from session
    // First, verify products still exist and get current data
    const orderItems = [];

    for (const item of session.items) {
      const product = await supabaseHelpers.findProductById(item.productId);
      
      if (!product) {
        console.error('EazyPay webhook: Product not found:', item.productId);
        // Mark session as failed and release inventory
        await getSupabase()
          .from('checkout_sessions')
          .update({ status: 'failed' })
          .eq('id', session.id);
        
        await releaseStockBatch(
          session.items.map((it: any) => ({
            productId: it.productId,
            quantity: it.quantity,
          }))
        ).catch(() => {});
        
        // Still return 200 to prevent retries
        return NextResponse.json({ message: 'Product not found' }, { status: 200 });
      }

      orderItems.push({
        product_id: product.id,
        name: item.name || product.name,
        price: item.price || product.price,
        quantity: item.quantity,
        image: item.image || product.image,
      });
    }

    // Create order
    const orderInsertData: any = {
      user_id: session.user_id,
      total: session.total,
      status: 'pending',
      payment_status: 'paid',
      payment_method: session.payment_method,
      shipping_address: session.shipping_address,
      inventory_status: 'sold',
      inventory_reserved_at: session.inventory_reserved_at,
      paid_on: new Date().toISOString(),
      payment_raw_response: body, // Store webhook payload
      global_transactions_id: globalTransactionsId,
    };

    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) {
      console.error('EazyPay webhook: Order creation error:', orderError);
      // Mark session as failed and release inventory
      await getSupabase()
        .from('checkout_sessions')
        .update({ status: 'failed' })
        .eq('id', session.id);
      
      await releaseStockBatch(
        session.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      ).catch(() => {});
      
      // Still return 200 to prevent retries
      return NextResponse.json({ message: 'Order creation failed but acknowledged' }, { status: 200 });
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await getSupabase()
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('EazyPay webhook: Order items creation error:', itemsError);
      // Delete order and mark session as failed
      await getSupabase()
        .from('orders')
        .delete()
        .eq('id', order.id);
      
      await getSupabase()
        .from('checkout_sessions')
        .update({ status: 'failed' })
        .eq('id', session.id);
      
      await releaseStockBatch(
        session.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      ).catch(() => {});
      
      // Still return 200 to prevent retries
      return NextResponse.json({ message: 'Order items creation failed but acknowledged' }, { status: 200 });
    }

    // Mark session as paid and link order
    await getSupabase()
      .from('checkout_sessions')
      .update({ 
        status: 'paid',
        order_id: order.id 
      })
      .eq('id', session.id);

    console.log('EazyPay webhook: Payment successful, order created:', order.id);

    // CRITICAL: Return 200 quickly - webhook processing should be fast
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

