import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { decryptTrandata } from '@/lib/services/benefit/crypto';
import { parseResponseTrandata, isTransactionSuccessful } from '@/lib/services/benefit/trandata';
import { storePaymentToken } from '@/lib/services/benefit/token-storage';
import { releaseStockBatch } from '@/lib/db-stock-helpers';
import { supabaseHelpers } from '@/lib/supabase-helpers';

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

    // Extract trackId
    const trackId = responseData.trackId ? String(responseData.trackId) : null;
    const paymentId = responseData.paymentId || null;

    console.log('[BENEFIT Notify] Payment identifiers:', {
      trackId,
      paymentId,
      transId: responseData.transId,
    });

    if (!trackId && !paymentId) {
      console.error('[BENEFIT Notify] Missing trackId and paymentId');
      return NextResponse.json({
        status: 'error',
        message: 'Missing trackId and paymentId',
      }, { status: 200 });
    }

    // Find checkout session by benefit_track_id or benefit_payment_id
    let session;
    if (trackId) {
      const { data: sessionByTrackId, error: sessionError } = await getSupabase()
        .from('checkout_sessions')
        .select('*')
        .eq('benefit_track_id', trackId)
        .eq('status', 'initiated')
        .single();
      
      if (!sessionError && sessionByTrackId) {
        session = sessionByTrackId;
      }
    }

    // If not found by trackId, try paymentId
    if (!session && paymentId) {
      const { data: sessionByPaymentId, error: sessionError2 } = await getSupabase()
        .from('checkout_sessions')
        .select('*')
        .eq('benefit_payment_id', paymentId)
        .eq('status', 'initiated')
        .single();
      
      if (!sessionError2 && sessionByPaymentId) {
        session = sessionByPaymentId;
      }
    }

    if (!session) {
      console.error('[BENEFIT Notify] Checkout session not found:', { trackId, paymentId });
      // Return success to prevent retries for non-existent sessions
      return NextResponse.json({
        status: 'success',
        message: 'Session not found',
      }, { status: 200 });
    }

    // Idempotency: If already has order and it's paid, acknowledge and return
    if (session.order_id) {
      const { data: existingOrder } = await getSupabase()
        .from('orders')
        .select('id, payment_status')
        .eq('id', session.order_id)
        .single();
      
      if (existingOrder && existingOrder.payment_status === 'paid') {
        console.log('[BENEFIT Notify] Order already paid:', session.order_id);
        return NextResponse.json({
          status: 'success',
          message: 'Already processed',
        }, { status: 200 });
      }
    }

    // Validate transaction
    const isSuccessful = isTransactionSuccessful(responseData);

    // Validate amount matches session
    if (responseData.amt) {
      const responseAmount = parseFloat(responseData.amt);
      const sessionAmount = parseFloat(session.total.toString());
      const amountDiff = Math.abs(responseAmount - sessionAmount);

      if (amountDiff > 0.01) {
        console.error('[BENEFIT Notify] Amount mismatch:', {
          responseAmount,
          sessionAmount,
          difference: amountDiff,
        });
        // Still acknowledge but don't create order
        return NextResponse.json({
          status: 'success',
          message: 'Amount mismatch',
        }, { status: 200 });
      }
    }

    // If payment failed, mark session as failed and release inventory
    if (!isSuccessful) {
      console.log('[BENEFIT Notify] Transaction not successful:', responseData.result);
      
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
        console.error('[BENEFIT Notify] Failed to release stock:', releaseError);
      });
      
      // Still acknowledge to prevent retries
      return NextResponse.json({
        status: 'success',
        message: 'Transaction not successful',
      }, { status: 200 });
    }

    // Payment successful - create order from session
    // First, verify products still exist and get current data
    const orderItems = [];

    for (const item of session.items) {
      const product = await supabaseHelpers.findProductById(item.productId);
      
      if (!product) {
        console.error('[BENEFIT Notify] Product not found:', item.productId);
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
        
        return NextResponse.json({
          status: 'error',
          message: 'Product not found',
        }, { status: 200 });
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
      payment_raw_response: responseData,
      benefit_track_id: session.benefit_track_id,
      benefit_payment_id: session.benefit_payment_id,
    };

    // Store BENEFIT-specific fields
    if (responseData.transId) {
      orderInsertData.benefit_trans_id = responseData.transId;
    }
    if (responseData.ref) {
      orderInsertData.benefit_ref = responseData.ref;
    }
    if (responseData.authRespCode) {
      orderInsertData.benefit_auth_resp_code = responseData.authRespCode;
    }

    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) {
      console.error('[BENEFIT Notify] Order creation error:', orderError);
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
      
      // Still return success to prevent retries
      return NextResponse.json({
        status: 'error',
        message: 'Order creation failed',
      }, { status: 200 });
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
      console.error('[BENEFIT Notify] Order items creation error:', itemsError);
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
      
      // Still return success to prevent retries
      return NextResponse.json({
        status: 'error',
        message: 'Order items creation failed',
      }, { status: 200 });
    }

    // Mark session as paid and link order
    await getSupabase()
      .from('checkout_sessions')
      .update({ 
        status: 'paid',
        order_id: order.id 
      })
      .eq('id', session.id);

    const processingTime = Date.now() - startTime;
    console.log(`[BENEFIT Notify] Payment successful, order created: ${order.id} (${processingTime}ms)`);

    // CRITICAL: Return acknowledgement FIRST (fast response)
    // Token storage happens asynchronously after response is sent
    const response = NextResponse.json({
      status: 'success',
      message: 'Payment processed',
      orderId: order.id,
    }, { status: 200 });

    // Handle Faster Checkout token per spec v1.51
    if (process.env.BENEFIT_FASTER_CHECKOUT_ENABLED === 'true' && isSuccessful && session.user_id) {
      // Check for token deletion (udf9 = "DELETED")
      if (responseData.udf9 === 'DELETED') {
        console.log('[BENEFIT Notify] Token deletion detected (udf9=DELETED)');
        
        // Mark token as deleted if we have tokenId from udf7
        const tokenId = responseData.udf7;
        if (tokenId) {
          const crypto = require('crypto');
          const tokenHash = crypto.createHash('sha256').update(tokenId).digest('hex');
          await getSupabase()
            .from('benefit_payment_tokens')
            .update({ status: 'deleted', updated_at: new Date().toISOString() })
            .eq('token_hash', tokenHash)
            .eq('user_id', session.user_id)
            .catch(error => {
              console.error('[BENEFIT Notify] Failed to mark token as deleted:', error);
            });
        }
      } else {
        // Extract token from udf7 (per spec v1.51) or fallback to legacy fields
        const token = responseData.udf7 || 
                      responseData.token || 
                      responseData.paymentToken || 
                      responseData.cardToken || 
                      responseData.savedToken ||
                      responseData.tokenId;
        
        if (token) {
          console.log('[BENEFIT Notify] Token received (udf7 or legacy field):', token.substring(0, 10) + '...');
          
          // Store token asynchronously (don't await - let it run in background)
          // This ensures notification handler responds quickly
          storePaymentToken({
            userId: session.user_id,
            token,
            paymentId: responseData.paymentId,
            orderId: order.id,
            responseData, // For card details if available
          }).catch(error => {
            // Log but don't fail notification - token storage is non-critical
            console.error('[BENEFIT Notify] Token storage failed (non-blocking):', error);
          });
        } else if (process.env.NODE_ENV === 'development') {
          // Log when token is expected but not found (for debugging)
          console.log('[BENEFIT Notify] No token found in response data. Available fields:', Object.keys(responseData));
          console.log('[BENEFIT Notify] udf7:', responseData.udf7, 'udf8:', responseData.udf8, 'udf9:', responseData.udf9);
        }
      }
    }
    
    // Log Faster Checkout fields for observability
    console.log('[BENEFIT Notify] Faster Checkout fields:', {
      udf7: responseData.udf7 ? responseData.udf7.substring(0, 10) + '...' : 'not present',
      udf8: responseData.udf8 || 'not present',
      udf9: responseData.udf9 || 'not present',
    });

    return response;
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


