/**
 * BenefitPay Wallet - Check Transaction Status
 * 
 * This endpoint checks the payment status with BenefitPay and:
 * 1. Calls the BenefitPay check-status API with proper signature
 * 2. Creates an order if payment is successful
 * 3. Marks session as failed if payment failed
 * 4. Releases inventory on failure
 * 
 * This endpoint should be called:
 * - After the SDK success callback (SDK success ≠ payment success)
 * - Periodically via polling for delayed payments
 * - When user manually checks payment status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';
import { 
  generateStatusCheckSignature, 
  validateWalletCredentials 
} from '@/lib/services/benefitpay/crypto';
import { releaseStockBatch } from '@/lib/db/inventory';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

interface CheckStatusRequest {
  referenceNumber: string;
  sessionId: string;
}

/**
 * POST /api/payments/benefitpay/check-status
 * 
 * Checks the payment status with BenefitPay and processes the result
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

    const body: CheckStatusRequest = await request.json();
    const { referenceNumber, sessionId } = body;

    console.log('[BenefitPay Check Status] Starting status check:', {
      referenceNumber,
      sessionId,
      userId: authResult.user.id,
    });

    if (!referenceNumber || !sessionId) {
      return cors.addHeaders(
        NextResponse.json(
          { message: 'Reference number and session ID are required' },
          { status: 400 }
        ),
        request
      );
    }

    // Validate credentials (uses same BENEFIT credentials as PG)
    let credentials;
    try {
      credentials = validateWalletCredentials();
    } catch (error: any) {
      console.error('[BenefitPay Check Status] Credentials validation failed:', error.message);
      return cors.addHeaders(
        NextResponse.json(
          { 
            message: 'BenefitPay Wallet is not properly configured. ' +
                     'Please set BENEFIT_TRANPORTAL_ID, BENEFIT_TRANPORTAL_PASSWORD, and BENEFIT_RESOURCE_KEY.'
          },
          { status: 500 }
        ),
        request
      );
    }

    // Fetch checkout session
    const { data: session, error: sessionError } = await getSupabase()
      .from('checkout_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', authResult.user.id)
      .single();

    if (sessionError || !session) {
      console.error('[BenefitPay Check Status] Session not found:', sessionError?.message);
      return cors.addHeaders(
        NextResponse.json(
          { message: 'Checkout session not found or unauthorized' },
          { status: 404 }
        ),
        request
      );
    }

    // If session already processed, return existing result
    if (session.status === 'paid' && session.order_id) {
      console.log('[BenefitPay Check Status] Session already paid:', session.order_id);
      return cors.addHeaders(
        NextResponse.json({
          success: true,
          orderId: session.order_id,
          status: 'paid',
          message: 'Payment already processed',
        }),
        request
      );
    }

    if (session.status === 'failed') {
      console.log('[BenefitPay Check Status] Session already failed');
      return cors.addHeaders(
        NextResponse.json({
          success: false,
          status: 'failed',
          reason: 'Payment previously failed',
        }),
        request
      );
    }

    // Build check-status request parameters
    const statusParams: Record<string, string> = {
      merchant_id: credentials.merchantId,
      reference_id: referenceNumber,
    };

    // Generate signature
    const signature = generateStatusCheckSignature(statusParams, credentials.secretKey);

    console.log('[BenefitPay Check Status] Calling BenefitPay API:', {
      url: credentials.checkStatusUrl,
      merchant_id: '***',
      reference_id: referenceNumber,
    });

    // Call BenefitPay check-status API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-FOO-Signature': signature,
      'X-FOO-Signature-Type': 'KEYVAL',
    };

    // Add X-CLIENT-ID if provided
    if (credentials.clientId) {
      headers['X-CLIENT-ID'] = credentials.clientId;
    }

    const response = await fetch(credentials.checkStatusUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(statusParams),
    });

    const responseData = await response.json();

    console.log('[BenefitPay Check Status] API response:', {
      status: response.status,
      data: responseData,
    });

    // Process response based on status
    if (responseData.status === 'success') {
      // Payment successful - create order
      console.log('[BenefitPay Check Status] Payment successful, creating order');

      // Create order from session snapshot
      const orderData = {
        user_id: session.user_id,
        items: session.items,
        shipping_address: session.shipping_address,
        total: session.total,
        payment_method: 'benefitpay_wallet',
        payment_provider: 'benefitpay',
        payment_status: 'completed',
        status: 'pending',
        // Store wallet-specific fields
        reference_number: referenceNumber,
        rrn: responseData.rrn || null,
        receipt_number: responseData.receipt_number || null,
        gateway: responseData.gateway || null,
        payment_raw_response: responseData,
      };

      const { data: order, error: orderError } = await getSupabase()
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('[BenefitPay Check Status] Failed to create order:', orderError);
        return cors.addHeaders(
          NextResponse.json(
            { message: 'Failed to create order', error: orderError.message },
            { status: 500 }
          ),
          request
        );
      }

      // Update checkout session
      const { error: updateError } = await getSupabase()
        .from('checkout_sessions')
        .update({
          status: 'paid',
          order_id: order.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('[BenefitPay Check Status] Failed to update session:', updateError);
      }

      console.log('[BenefitPay Check Status] Order created successfully:', order.id);

      return cors.addHeaders(
        NextResponse.json({
          success: true,
          orderId: order.id,
          status: 'paid',
          message: 'Payment successful',
        }),
        request
      );
    } else if (responseData.status === 'failed' || responseData.error_code) {
      // Payment failed - mark session as failed and release inventory
      console.log('[BenefitPay Check Status] Payment failed:', responseData.error_description || responseData.error_code);

      // Release inventory if it was reserved
      if (session.inventory_reserved_at && !session.inventory_released_at) {
        try {
          const itemsToRelease = (session.items as any[]).map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          }));
          await releaseStockBatch(itemsToRelease);
          console.log('[BenefitPay Check Status] Inventory released');
        } catch (releaseError: any) {
          console.error('[BenefitPay Check Status] Failed to release inventory:', releaseError);
        }
      }

      // Update session status
      const { error: updateError } = await getSupabase()
        .from('checkout_sessions')
        .update({
          status: 'failed',
          inventory_released_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('[BenefitPay Check Status] Failed to update session:', updateError);
      }

      return cors.addHeaders(
        NextResponse.json({
          success: false,
          status: 'failed',
          reason: responseData.error_description || responseData.error_code || 'Payment failed',
        }),
        request
      );
    } else {
      // Transaction not found or pending - keep session as initiated
      console.log('[BenefitPay Check Status] Transaction not found or pending');

      return cors.addHeaders(
        NextResponse.json({
          success: false,
          status: 'pending',
          reason: 'Transaction not found or still processing',
        }),
        request
      );
    }
  } catch (error: any) {
    console.error('[BenefitPay Check Status] Unexpected error:', error);
    return cors.addHeaders(
      NextResponse.json(
        { message: error.message || 'Failed to check payment status' },
        { status: 500 }
      ),
      request
    );
  }
}

