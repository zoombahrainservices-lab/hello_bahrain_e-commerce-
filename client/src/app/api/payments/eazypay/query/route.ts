import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { queryTransaction } from '@/lib/services/eazypayCheckout';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';
import { convertReservedToSold } from '@/lib/db-stock-helpers';

export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * POST /api/payments/eazypay/query
 * Queries payment status from EazyPay and updates order if needed
 */
export async function POST(request: NextRequest) {
  try {
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return cors.addHeaders(authResult, request);
    }

    const body = await request.json();
    const { orderId, globalTransactionsId } = body;

    // CRITICAL: Accept either globalTransactionsId (preferred) or orderId
    let finalGlobalTransactionsId: string;

    if (globalTransactionsId) {
      // Use globalTransactionsId directly (from URL parameter)
      finalGlobalTransactionsId = globalTransactionsId;
      
      // Verify it belongs to user's order (security check)
      const { data: order } = await getSupabase()
        .from('orders')
        .select('id, user_id')
        .eq('global_transactions_id', globalTransactionsId)
        .eq('user_id', authResult.user.id)
        .single();
      
      if (!order) {
        return cors.addHeaders(
          NextResponse.json({ message: 'Transaction not found or access denied' }, { status: 404 }),
          request
        );
      }
    } else if (orderId) {
      // Look up globalTransactionsId from order
      const { data: order, error: orderError } = await getSupabase()
        .from('orders')
        .select('id, user_id, global_transactions_id, payment_status')
        .eq('id', orderId)
        .eq('user_id', authResult.user.id)
        .single();

      if (orderError || !order) {
        return cors.addHeaders(
          NextResponse.json({ message: 'Order not found' }, { status: 404 }),
          request
        );
      }

      if (!order.global_transactions_id) {
        return cors.addHeaders(
          NextResponse.json({ message: 'No payment transaction found for this order' }, { status: 400 }),
          request
        );
      }

      finalGlobalTransactionsId = order.global_transactions_id;
    } else {
      return cors.addHeaders(
        NextResponse.json({ message: 'orderId or globalTransactionsId is required' }, { status: 400 }),
        request
      );
    }

    // CRITICAL: Query EazyPay - this is the official verification
    // Never mark as paid without this query
    const transactionData = await queryTransaction(finalGlobalTransactionsId);

    // CRITICAL: Get order to update (using globalTransactionsId as primary key)
    const { data: orders, error: orderError } = await getSupabase()
      .from('orders')
      .select('id, user_id, payment_status, paid_on, inventory_status')
      .eq('global_transactions_id', finalGlobalTransactionsId)
      .limit(1);

    if (orderError || !orders || orders.length === 0) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Order not found for this transaction' }, { status: 404 }),
        request
      );
    }

    const order = orders[0];

    // CRITICAL: Only update if payment status changed and is verified as paid
    // Handle PENDING status - don't mark as paid yet
    const status = transactionData.status || (transactionData.isPaid ? 'PAID' : 'PENDING');
    
    if (status === 'PAID' && transactionData.isPaid && order.payment_status !== 'paid') {
      const updateData: any = {
        payment_status: 'paid',
        paid_on: transactionData.paidOn || new Date().toISOString(),
        payment_raw_response: transactionData,
      };

      if (transactionData.paymentMethod) {
        updateData.payment_method = transactionData.paymentMethod;
      }
      if (transactionData.dccUptake) {
        updateData.dcc_uptake = transactionData.dccUptake;
      }
      if (transactionData.dccReceiptText) {
        updateData.dcc_receipt_text = transactionData.dccReceiptText;
      }

      await getSupabase()
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      // Convert reserved inventory to sold when payment is confirmed
      if (order.inventory_status === 'reserved') {
        const convertResult = await convertReservedToSold(order.id);
        if (!convertResult.success) {
          // Log error but don't fail request - inventory state can be corrected later
          console.error('EazyPay query: Failed to convert reserved inventory to sold:', convertResult.error);
        }
      }
    }

    return cors.addHeaders(
      NextResponse.json({
        isPaid: transactionData.isPaid || false,
        status: status,
        globalTransactionsId: transactionData.globalTransactionsId || finalGlobalTransactionsId,
        paidOn: transactionData.paidOn,
        paymentMethod: transactionData.paymentMethod,
        dccUptake: transactionData.dccUptake,
        dccReceiptText: transactionData.dccReceiptText,
      }),
      request
    );
  } catch (error: any) {
    console.error('Error querying EazyPay payment:', error);
    return cors.addHeaders(
      NextResponse.json(
        {
          message: error.message || 'Failed to query payment status',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      ),
      request
    );
  }
}

