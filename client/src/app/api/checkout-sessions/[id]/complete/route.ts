import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';
import { releaseStockBatch } from '@/lib/db-stock-helpers';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { queryTransaction } from '@/lib/services/eazypayCheckout';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * POST /api/checkout-sessions/[id]/complete
 * Verifies payment status with gateway and creates order from session if successful
 * Used for EazyPay return flow
 * 
 * Request body:
 * - globalTransactionsId: string (optional, from EazyPay return URL)
 * 
 * Response:
 * - success: boolean
 * - orderId?: string (if payment successful)
 * - message: string
 */
export async function POST(
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
    const body = await request.json();
    const { globalTransactionsId } = body;

    // Verify checkout session exists and belongs to user
    const { data: session, error: sessionError } = await getSupabase()
      .from('checkout_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', authResult.user.id)
      .eq('status', 'initiated')
      .single();

    if (sessionError || !session) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Checkout session not found or already processed' }, { status: 404 }),
        request
      );
    }

    // Check if session already has an order (idempotency)
    if (session.order_id) {
      const { data: existingOrder } = await getSupabase()
        .from('orders')
        .select('id, payment_status')
        .eq('id', session.order_id)
        .single();
      
      if (existingOrder && existingOrder.payment_status === 'paid') {
        return cors.addHeaders(
          NextResponse.json({
            success: true,
            message: 'Order already created',
            orderId: existingOrder.id,
          }),
          request
        );
      }
    }

    // Determine which globalTransactionsId to use
    const finalGlobalTransactionsId = globalTransactionsId || session.global_transactions_id;

    if (!finalGlobalTransactionsId) {
      return cors.addHeaders(
        NextResponse.json({ message: 'No transaction ID found' }, { status: 400 }),
        request
      );
    }

    // Query EazyPay to verify payment status
    let transactionData;
    try {
      transactionData = await queryTransaction(finalGlobalTransactionsId);
    } catch (queryError: any) {
      console.error('[Session Complete] EazyPay query error:', queryError);
      return cors.addHeaders(
        NextResponse.json({ 
          success: false,
          message: 'Failed to verify payment status' 
        }, { status: 500 }),
        request
      );
    }

    // Check payment status
    const isPaid = transactionData.isPaid === true || transactionData.status === 'SUCCESS';
    const isPending = transactionData.status === 'PENDING';
    const isCanceled = transactionData.status === 'CANCELED' || transactionData.status === 'CANCELLED';

    // If payment failed or cancelled, mark session as failed and release inventory
    if (!isPaid && !isPending) {
      // Mark session as failed
      await getSupabase()
        .from('checkout_sessions')
        .update({ 
          status: isCanceled ? 'cancelled' : 'failed',
          inventory_released_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
      
      // Release reserved inventory
      await releaseStockBatch(
        session.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      ).catch(releaseError => {
        console.error('[Session Complete] Failed to release stock:', releaseError);
      });
      
      return cors.addHeaders(
        NextResponse.json({
          success: false,
          message: isCanceled ? 'Payment was cancelled' : 'Payment failed',
        }),
        request
      );
    }

    // If pending, return pending status (don't create order yet)
    if (isPending) {
      return cors.addHeaders(
        NextResponse.json({
          success: false,
          message: 'Payment is still being processed',
          pending: true,
        }),
        request
      );
    }

    // Payment successful - create order from session
    // First, verify products still exist and get current data
    const orderItems = [];

    for (const item of session.items) {
      const product = await supabaseHelpers.findProductById(item.productId);
      
      if (!product) {
        console.error('[Session Complete] Product not found:', item.productId);
        // Mark session as failed and release inventory
        await getSupabase()
          .from('checkout_sessions')
          .update({ status: 'failed' })
          .eq('id', sessionId);
        
        await releaseStockBatch(
          session.items.map((it: any) => ({
            productId: it.productId,
            quantity: it.quantity,
          }))
        ).catch(() => {});
        
        return cors.addHeaders(
          NextResponse.json({ 
            success: false,
            message: `Product not found: ${item.productId}` 
          }, { status: 404 }),
          request
        );
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
      payment_raw_response: transactionData,
      global_transactions_id: finalGlobalTransactionsId,
    };

    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) {
      console.error('[Session Complete] Order creation error:', orderError);
      // Mark session as failed and release inventory
      await getSupabase()
        .from('checkout_sessions')
        .update({ status: 'failed' })
        .eq('id', sessionId);
      
      await releaseStockBatch(
        session.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      ).catch(() => {});
      
      return cors.addHeaders(
        NextResponse.json({ 
          success: false,
          message: 'Failed to create order' 
        }, { status: 500 }),
        request
      );
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
      console.error('[Session Complete] Order items creation error:', itemsError);
      // Delete order and mark session as failed
      await getSupabase()
        .from('orders')
        .delete()
        .eq('id', order.id);
      
      await getSupabase()
        .from('checkout_sessions')
        .update({ status: 'failed' })
        .eq('id', sessionId);
      
      await releaseStockBatch(
        session.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      ).catch(() => {});
      
      return cors.addHeaders(
        NextResponse.json({ 
          success: false,
          message: 'Failed to create order items' 
        }, { status: 500 }),
        request
      );
    }

    // Mark session as paid and link order
    await getSupabase()
      .from('checkout_sessions')
      .update({ 
        status: 'paid',
        order_id: order.id 
      })
      .eq('id', sessionId);

    console.log('[Session Complete] Payment successful, order created:', order.id);

    return cors.addHeaders(
      NextResponse.json({
        success: true,
        message: 'Order created successfully',
        orderId: order.id,
      }),
      request
    );
  } catch (error: any) {
    console.error('[Session Complete] Error:', error);
    return cors.addHeaders(
      NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to complete checkout session',
        },
        { status: 500 }
      ),
      request
    );
  }
}


