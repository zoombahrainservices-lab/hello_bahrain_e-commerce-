import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createInvoice } from '@/lib/services/eazypayCheckout';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * POST /api/payments/eazypay/create-invoice
 * Creates an EazyPay invoice and returns payment URL
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
    const { orderId, currency = 'BHD', amount, description, userToken } = body;

    // Validation
    if (!orderId) {
      return cors.addHeaders(
        NextResponse.json({ message: 'orderId is required' }, { status: 400 }),
        request
      );
    }

    if (!amount || parseFloat(amount) <= 0) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Valid amount is required' }, { status: 400 }),
        request
      );
    }

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .select('id, user_id, total, payment_status')
      .eq('id', orderId)
      .eq('user_id', authResult.user.id)
      .single();

    if (orderError || !order) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Order not found' }, { status: 404 }),
        request
      );
    }

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return cors.addHeaders(
        NextResponse.json({ message: 'Order is already paid' }, { status: 400 }),
        request
      );
    }

    // Build return URLs
    // CRITICAL: EazyPay will append globalTransactionsId to returnUrl
    // Format: returnUrl?globalTransactionsId=...
    const baseUrl = process.env.CLIENT_URL || 'https://helloonebahrain.com';
    const returnUrl = `${baseUrl}/pay/complete?orderId=${orderId}`;
    const cancelUrl = `${baseUrl}/checkout/payment?orderId=${orderId}&cancelled=true`;
    const webhookUrl = `${baseUrl}/api/payments/eazypay/webhook`;

    // CRITICAL: Format amount to 3 decimal places (e.g., "80.000")
    // This must match exactly what we hash
    const amountFormatted = parseFloat(amount.toString()).toFixed(3);

    // Create invoice with EazyPay
    // CRITICAL: invoiceId and paymentMethod are REQUIRED fields
    // Note: Some EazyPay accounts don't support webhookUrl - if you get "Invalid number of inputs", 
    // try removing webhookUrl or contact EazyPay support to enable webhooks for your account
    const invoiceResponse = await createInvoice({
      currency,
      amount: amountFormatted, // Use formatted amount
      appId: process.env.EAZYPAY_CHECKOUT_APP_ID!,
      invoiceId: `ORDER_${orderId}`, // Required: Format as ORDER_<orderId>
      paymentMethod: 'BENEFITGATEWAY,CREDITCARD,APPLEPAY', // Required: Enable all payment methods
      returnUrl,
      // Temporarily remove webhookUrl - some accounts don't support it
      // webhookUrl, // Uncomment if your EazyPay account has webhooks enabled
      userToken: userToken || undefined,
      description: description || `Order #${orderId}`,
    });

    // Update order with global transaction ID and user token
    const updateData: any = {
      global_transactions_id: invoiceResponse.globalTransactionsId,
    };

    if (invoiceResponse.userToken) {
      updateData.user_token = invoiceResponse.userToken;
    }

    await getSupabase()
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    return cors.addHeaders(
      NextResponse.json({
        paymentUrl: invoiceResponse.paymentUrl,
        globalTransactionsId: invoiceResponse.globalTransactionsId,
        userToken: invoiceResponse.userToken,
      }),
      request
    );
  } catch (error: any) {
    console.error('Error creating EazyPay invoice:', error);
    return cors.addHeaders(
      NextResponse.json(
        {
          message: error.message || 'Failed to create payment invoice',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      ),
      request
    );
  }
}

