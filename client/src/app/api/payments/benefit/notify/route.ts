import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { decryptTrandata } from '@/lib/services/benefit/crypto';
import { parseResponseTrandata, isTransactionSuccessful } from '@/lib/services/benefit/trandata';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/benefit/notify
 * Merchant Notification endpoint for BENEFIT gateway
 * 
 * CRITICAL: This endpoint receives server-to-server notifications from BENEFIT
 * - Must respond quickly (within 30 seconds)
 * - Must respond with correct JSON format
 * - Failure to acknowledge may void the transaction
 * - Should be idempotent (handle duplicate notifications)
 * 
 * Request body:
 * - trandata: string (encrypted hex string from BENEFIT)
 * 
 * Response:
 * - JSON acknowledgement as per BENEFIT specification
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { trandata } = body;

    if (!trandata) {
      console.error('[BENEFIT Notify] Missing trandata');
      // Still return 200 to prevent retries for invalid requests
      return NextResponse.json({
        status: 'error',
        message: 'Missing trandata',
      }, { status: 200 });
    }

    // Get resource key from environment
    const resourceKey = process.env.BENEFIT_RESOURCE_KEY;

    if (!resourceKey) {
      console.error('[BENEFIT Notify] Missing resource key');
      // Return error but with 200 status to prevent retries
      return NextResponse.json({
        status: 'error',
        message: 'Configuration error',
      }, { status: 200 });
    }

    // Decrypt trandata
    let decryptedTrandata: string;
    try {
      decryptedTrandata = decryptTrandata(trandata, resourceKey);
    } catch (decryptError: any) {
      console.error('[BENEFIT Notify] Decryption error:', decryptError.message);
      return NextResponse.json({
        status: 'error',
        message: 'Decryption failed',
      }, { status: 200 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[BENEFIT Notify] Decrypted trandata:', decryptedTrandata);
    }

    // Parse trandata
    let responseData;
    try {
      responseData = parseResponseTrandata(decryptedTrandata);
    } catch (parseError: any) {
      console.error('[BENEFIT Notify] Parse error:', parseError.message);
      return NextResponse.json({
        status: 'error',
        message: 'Parse failed',
      }, { status: 200 });
    }

    // Extract trackId (order ID)
    const trackId = responseData.trackId;

    if (!trackId) {
      console.error('[BENEFIT Notify] Missing trackId');
      return NextResponse.json({
        status: 'error',
        message: 'Missing trackId',
      }, { status: 200 });
    }

    // Find order by trackId
    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .select('id, payment_status, total')
      .eq('id', trackId)
      .single();

    if (orderError || !order) {
      console.error('[BENEFIT Notify] Order not found:', trackId);
      // Return success to prevent retries for non-existent orders
      return NextResponse.json({
        status: 'success',
        message: 'Order not found',
      }, { status: 200 });
    }

    // Idempotency: If already paid, acknowledge and return
    if (order.payment_status === 'paid') {
      console.log('[BENEFIT Notify] Order already paid:', trackId);
      return NextResponse.json({
        status: 'success',
        message: 'Already processed',
      }, { status: 200 });
    }

    // Validate transaction
    const isSuccessful = isTransactionSuccessful(responseData);

    if (!isSuccessful) {
      console.log('[BENEFIT Notify] Transaction not successful:', responseData.result);
      // Still acknowledge to prevent retries
      return NextResponse.json({
        status: 'success',
        message: 'Transaction not successful',
      }, { status: 200 });
    }

    // Validate amount matches order
    if (responseData.amt) {
      const responseAmount = parseFloat(responseData.amt);
      const orderAmount = parseFloat(order.total);
      const amountDiff = Math.abs(responseAmount - orderAmount);

      if (amountDiff > 0.01) {
        console.error('[BENEFIT Notify] Amount mismatch:', {
          responseAmount,
          orderAmount,
          difference: amountDiff,
        });
        // Still acknowledge but don't mark as paid
        return NextResponse.json({
          status: 'success',
          message: 'Amount mismatch',
        }, { status: 200 });
      }
    }

    // Update order as paid
    const updateData: any = {
      payment_status: 'paid',
      paid_on: new Date().toISOString(),
      payment_raw_response: responseData,
      inventory_status: 'sold',
      reservation_expires_at: null,
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
      .eq('id', trackId);

    if (updateError) {
      console.error('[BENEFIT Notify] Update error:', updateError);
      // Still return success to prevent retries
      // Log for manual review
      return NextResponse.json({
        status: 'error',
        message: 'Update failed',
      }, { status: 200 });
    }

    const processingTime = Date.now() - startTime;
    console.log(`[BENEFIT Notify] Payment successful for order: ${trackId} (${processingTime}ms)`);

    // Return acknowledgement
    return NextResponse.json({
      status: 'success',
      message: 'Payment processed',
      trackId,
    }, { status: 200 });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`[BENEFIT Notify] Error (${processingTime}ms):`, error);
    
    // Return success to prevent retries, but log for manual review
    return NextResponse.json({
      status: 'error',
      message: 'Processing error',
    }, { status: 200 });
  }
}

