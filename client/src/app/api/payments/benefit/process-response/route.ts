import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';
import { decryptTrandata } from '@/lib/services/benefit/crypto';
import { parseResponseTrandata, isTransactionSuccessful } from '@/lib/services/benefit/trandata';
import { storePaymentToken } from '@/lib/services/benefit/token-storage';

export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * POST /api/payments/benefit/process-response
 * Process BENEFIT payment response (decrypt and validate)
 * 
 * Request body:
 * - orderId: string (required)
 * - trandata: string (required, encrypted hex string from BENEFIT)
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - transactionDetails: object (if successful)
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
    const { orderId, trandata } = body;

    // Validation
    if (!orderId) {
      return cors.addHeaders(
        NextResponse.json({ message: 'orderId is required' }, { status: 400 }),
        request
      );
    }

    if (!trandata) {
      return cors.addHeaders(
        NextResponse.json({ message: 'trandata is required' }, { status: 400 }),
        request
      );
    }

    // Verify order exists and belongs to user
    // Include benefit_track_id for trackId validation
    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .select('id, user_id, total, payment_status, benefit_track_id')
      .eq('id', orderId)
      .eq('user_id', authResult.user.id)
      .single();

    if (orderError || !order) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Order not found' }, { status: 404 }),
        request
      );
    }

    // Check if order is already paid (idempotency)
    if (order.payment_status === 'paid') {
      return cors.addHeaders(
        NextResponse.json({
          success: true,
          message: 'Order already processed',
        }),
        request
      );
    }

    // Get resource key from environment
    const resourceKey = process.env.BENEFIT_RESOURCE_KEY;

    if (!resourceKey) {
      console.error('[BENEFIT Process] Missing resource key');
      return cors.addHeaders(
        NextResponse.json({ message: 'BENEFIT gateway not configured' }, { status: 500 }),
        request
      );
    }

    // Decrypt trandata
    let decryptedTrandata: string;
    try {
      decryptedTrandata = decryptTrandata(trandata, resourceKey);
    } catch (decryptError: any) {
      console.error('[BENEFIT Process] Decryption error:', decryptError.message);
      return cors.addHeaders(
        NextResponse.json({ message: 'Failed to decrypt payment data' }, { status: 400 }),
        request
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[BENEFIT Process] Decrypted trandata:', decryptedTrandata);
    }

    // Parse trandata
    let responseData;
    try {
      responseData = parseResponseTrandata(decryptedTrandata);
    } catch (parseError: any) {
      console.error('[BENEFIT Process] Parse error:', parseError.message);
      return cors.addHeaders(
        NextResponse.json({ message: 'Invalid payment response format' }, { status: 400 }),
        request
      );
    }

    // Validate transaction
    const isSuccessful = isTransactionSuccessful(responseData);

    if (!isSuccessful) {
      console.log('[BENEFIT Process] Transaction failed:', responseData.result);
      return cors.addHeaders(
        NextResponse.json({
          success: false,
          message: `Payment failed: ${responseData.result || 'Unknown error'}`,
        }),
        request
      );
    }

    // Validate amount matches order
    if (responseData.amt) {
      const responseAmount = parseFloat(responseData.amt);
      const orderAmount = parseFloat(order.total);
      const amountDiff = Math.abs(responseAmount - orderAmount);

      if (amountDiff > 0.01) { // Allow 0.01 difference for rounding
        console.error('[BENEFIT Process] Amount mismatch:', {
          responseAmount,
          orderAmount,
          difference: amountDiff,
        });
        return cors.addHeaders(
          NextResponse.json({
            success: false,
            message: 'Payment amount mismatch',
          }),
          request
        );
      }
    }

    // Validate trackId matches the stored benefit_track_id
    // We send numeric trackId to BenefitPay, not the UUID orderId
    if (responseData.trackId) {
      const storedTrackId = order.benefit_track_id;
      
      // Compare trackId from response with stored benefit_track_id
      // Convert both to strings for comparison (trackId might be string or number)
      if (storedTrackId && String(responseData.trackId) !== String(storedTrackId)) {
        console.error('[BENEFIT Process] TrackId mismatch:', {
          responseTrackId: responseData.trackId,
          storedTrackId: storedTrackId,
          orderId,
        });
        return cors.addHeaders(
          NextResponse.json({
            success: false,
            message: 'Order reference mismatch',
          }),
          request
        );
      }
      
      // If no stored trackId but we have one in response, log warning but allow
      // (might be from old orders before we started storing trackId)
      if (!storedTrackId) {
        console.warn('[BENEFIT Process] No stored benefit_track_id for order:', orderId);
        // Still allow processing - might be from before we started storing trackId
      }
    }

    // Update order as paid
    // IMPORTANT: Also restore status to 'pending' if it was cancelled by the cron job
    // This handles race conditions where the cron job cancelled the order before payment completed
    const updateData: any = {
      payment_status: 'paid',
      paid_on: new Date().toISOString(),
      payment_raw_response: responseData,
      inventory_status: 'sold', // Mark inventory as sold
      reservation_expires_at: null, // Clear reservation expiry
      status: 'pending', // Ensure status is pending (not cancelled) for paid orders
    };

    // Store BENEFIT-specific fields
    if (responseData.transId) {
      updateData.benefit_trans_id = responseData.transId;
    }
    if (responseData.ref) {
      updateData.benefit_ref = responseData.ref;
    }
    if (responseData.authRespCode) {
      updateData.benefit_auth_resp_code = responseData.authRespCode;
    }
    if (responseData.paymentId) {
      updateData.benefit_payment_id = responseData.paymentId;
    }

    const { error: updateError } = await getSupabase()
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('[BENEFIT Process] Update error:', updateError);
      return cors.addHeaders(
        NextResponse.json({ message: 'Failed to update order status' }, { status: 500 }),
        request
      );
    }

    console.log('[BENEFIT Process] Payment successful for order:', orderId);

    // Extract and store token asynchronously (non-blocking)
    // Only if feature is enabled and payment was successful
    if (process.env.BENEFIT_FASTER_CHECKOUT_ENABLED === 'true' && isSuccessful) {
      // Extract token from responseData
      // Field name from BENEFIT docs: check for common field names
      const token = responseData.token || 
                    responseData.paymentToken || 
                    responseData.cardToken || 
                    responseData.savedToken ||
                    responseData.tokenId;
      
      if (token) {
        // Store token asynchronously (don't await - let it run in background)
        storePaymentToken({
          userId: authResult.user.id,
          token,
          paymentId: responseData.paymentId,
          orderId: orderId,
          responseData, // For card details if available
        }).catch(error => {
          // Log but don't fail response - token storage is non-critical
          console.error('[BENEFIT Process] Token storage failed (non-blocking):', error);
        });
      } else if (process.env.NODE_ENV === 'development') {
        // Log when token is expected but not found (for debugging)
        console.log('[BENEFIT Process] No token found in response data. Available fields:', Object.keys(responseData));
      }
    }

    return cors.addHeaders(
      NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        transactionDetails: {
          transId: responseData.transId,
          ref: responseData.ref,
          authRespCode: responseData.authRespCode,
        },
      }),
      request
    );
  } catch (error: any) {
    console.error('[BENEFIT Process] Error:', error);
    return cors.addHeaders(
      NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to process payment response',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      ),
      request
    );
  }
}

