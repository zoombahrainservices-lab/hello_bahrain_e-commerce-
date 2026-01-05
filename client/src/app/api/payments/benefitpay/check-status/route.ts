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
import { validateWalletCredentials } from '@/lib/services/benefitpay_wallet/config';
import { generateSignatureForStatus } from '@/lib/services/benefitpay_wallet/signing';
import { releaseStockBatch } from '@/lib/db-stock-helpers';

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

    // Generate signature using centralized signing utility
    const signature = generateSignatureForStatus(statusParams, credentials.secretKey);

    console.log('[BenefitPay Check Status] Calling BenefitPay API:', {
      url: credentials.checkStatusUrl,
      merchant_id: credentials.merchantId,
      app_id: credentials.appId,
      reference_id: referenceNumber,
    });

    // Call BenefitPay check-status API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-FOO-Signature': signature,
      'X-FOO-Signature-Type': 'KEYVAL',
    };

    // Add X-CLIENT-ID only if provided (Phase 4.1)
    if (credentials.clientId && credentials.clientId.trim() !== '') {
      headers['X-CLIENT-ID'] = credentials.clientId;
      console.log('[BenefitPay Check Status] ✓ X-CLIENT-ID header added');
    } else {
      console.log('[BenefitPay Check Status] ⚠ X-CLIENT-ID not provided (optional, skipping)');
    }

    const response = await fetch(credentials.checkStatusUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(statusParams),
    });

    // Check if response is JSON or HTML (error case)
    const contentType = response.headers.get('content-type');
    let responseData: any;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // Response is HTML (likely an error page)
      const htmlText = await response.text();
      console.error('[BenefitPay Check Status] Received HTML instead of JSON:', htmlText.substring(0, 500));
      console.error('[BenefitPay Check Status] Check-status URL might be incorrect:', credentials.checkStatusUrl);
      throw new Error(
        `Invalid response from BenefitPay API. Expected JSON but received HTML. ` +
        `URL: ${credentials.checkStatusUrl}. ` +
        `Please verify the check-status URL is correct: https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status`
      );
    }

    console.log('[BenefitPay Check Status] Raw API response:', {
      httpStatus: response.status,
      contentType: contentType,
      hasData: !!responseData,
      responseKeys: responseData ? Object.keys(responseData) : [],
    });
    
    console.log('[BenefitPay Check Status] API response data:', JSON.stringify(responseData, null, 2));

    // Defensive parsing: Validate response structure
    // BenefitPay API returns HTTP 200 even for errors, so we must parse response body
    
    // Handle meta.status (if present)
    if (responseData.meta) {
      console.log('[BenefitPay Check Status] Response has meta:', responseData.meta);
      
      if (responseData.meta.status === 'FAILED' || responseData.meta.status === 'ERROR') {
        console.log('[BenefitPay Check Status] meta.status indicates failure:', responseData.meta.status);
        // Treat as pending/not found (allow retry)
        return cors.addHeaders(
          NextResponse.json({
            success: false,
            status: 'pending',
            reason: responseData.meta.message || 'Transaction not found or still processing',
          }),
          request
        );
      }
    }

    // Handle response.status or status field
    let transactionStatus: string | undefined;
    if (responseData.response && responseData.response.status) {
      transactionStatus = responseData.response.status;
    } else if (responseData.status) {
      transactionStatus = responseData.status;
    }

    console.log('[BenefitPay Check Status] Transaction status:', transactionStatus || 'NOT FOUND');

    // Handle error structures
    if (responseData.error_code || responseData.errorCode || responseData.error) {
      const errorCode = responseData.error_code || responseData.errorCode;
      const errorDesc = responseData.error_description || responseData.errorDescription || responseData.error;
      console.log('[BenefitPay Check Status] Error in response:', { errorCode, errorDesc });
      
      // Treat as failed only if explicitly failed, otherwise pending
      return cors.addHeaders(
        NextResponse.json({
          success: false,
          status: 'failed',
          reason: errorDesc || errorCode || 'Payment failed',
        }),
        request
      );
    }

    // Validate required fields for success case
    if (transactionStatus === 'success') {
      console.log('[BenefitPay Check Status] Validating success response fields...');
      
      const requiredFields = ['rrn', 'receipt_number'];
      const missingFields = requiredFields.filter(field => 
        !responseData[field] && !(responseData.response && responseData.response[field])
      );
      
      if (missingFields.length > 0) {
        console.warn('[BenefitPay Check Status] Success response missing fields:', missingFields);
        // Still proceed, but log warning
      }
    }

    // Process response based on validated status
    if (transactionStatus === 'success') {
      // Payment successful - create order (with idempotency check)
      console.log('[BenefitPay Check Status] Payment successful, checking for existing order...');

      // IDEMPOTENCY CHECK 1: Check if session already has an order
      if (session.order_id) {
        console.log('[BenefitPay Check Status] Session already has order_id:', session.order_id);
        
        // Verify order exists
        const { data: existingOrder } = await getSupabase()
          .from('orders')
          .select('id')
          .eq('id', session.order_id)
          .single();

        if (existingOrder) {
          console.log('[BenefitPay Check Status] ✓ Returning existing order (idempotent)');
          return cors.addHeaders(
            NextResponse.json({
              success: true,
              orderId: session.order_id,
              status: 'paid',
              message: 'Payment already processed (idempotent)',
            }),
            request
          );
        } else {
          console.warn('[BenefitPay Check Status] order_id exists but order not found, will create new');
        }
      }

      // IDEMPOTENCY CHECK 2: Check if order already exists for this checkout_session_id
      const { data: existingOrderBySession } = await getSupabase()
        .from('orders')
        .select('id')
        .eq('checkout_session_id', sessionId)
        .single();

      if (existingOrderBySession) {
        console.log('[BenefitPay Check Status] ✓ Order already exists for this session (idempotent):', existingOrderBySession.id);
        
        // Update session with order_id if missing
        if (!session.order_id) {
          await getSupabase()
            .from('checkout_sessions')
            .update({ order_id: existingOrderBySession.id })
            .eq('id', sessionId);
        }

        return cors.addHeaders(
          NextResponse.json({
            success: true,
            orderId: existingOrderBySession.id,
            status: 'paid',
            message: 'Payment already processed (idempotent)',
          }),
          request
        );
      }

      // No existing order found - create new order
      console.log('[BenefitPay Check Status] Creating new order from session snapshot...');

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
        checkout_session_id: sessionId, // IDEMPOTENCY ANCHOR
        // Store wallet-specific fields
        reference_number: referenceNumber,
        rrn: responseData.rrn || responseData.response?.rrn || null,
        receipt_number: responseData.receipt_number || responseData.response?.receipt_number || null,
        gateway: responseData.gateway || responseData.response?.gateway || null,
        payment_raw_response: responseData,
      };

      const { data: order, error: orderError } = await getSupabase()
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        // Check if error is due to unique constraint (idempotency)
        if (orderError.code === '23505' && orderError.message.includes('unique_checkout_session_id')) {
          console.log('[BenefitPay Check Status] Unique constraint hit - order already exists (race condition)');
          
          // Fetch the existing order
          const { data: racedOrder } = await getSupabase()
            .from('orders')
            .select('id')
            .eq('checkout_session_id', sessionId)
            .single();

          if (racedOrder) {
            console.log('[BenefitPay Check Status] ✓ Returning existing order from race condition:', racedOrder.id);
            return cors.addHeaders(
              NextResponse.json({
                success: true,
                orderId: racedOrder.id,
                status: 'paid',
                message: 'Payment already processed (idempotent)',
              }),
              request
            );
          }
        }

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
    } else if (transactionStatus === 'failed') {
      // Payment failed - mark session as failed and release inventory
      const failureReason = responseData.error_description || responseData.errorDescription || 
                           responseData.error_code || responseData.errorCode || 'Payment declined';
      console.log('[BenefitPay Check Status] Payment failed:', failureReason);

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
          reason: failureReason,
        }),
        request
      );
    } else {
      // Transaction not found, pending, or unknown status - keep session as initiated
      console.log('[BenefitPay Check Status] Transaction not found, pending, or unknown status:', transactionStatus || 'undefined');

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

