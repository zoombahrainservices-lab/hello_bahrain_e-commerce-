import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';
import { decryptTrandata } from '@/lib/services/benefit/crypto';
import { parseResponseTrandata, isTransactionSuccessful } from '@/lib/services/benefit/trandata';
import { storePaymentToken } from '@/lib/services/benefit/token-storage';
import { releaseStockBatch } from '@/lib/db-stock-helpers';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import crypto from 'crypto';

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
    const { sessionId, trandata } = body;

    // Validation
    if (!sessionId) {
      return cors.addHeaders(
        NextResponse.json({ message: 'sessionId is required' }, { status: 400 }),
        request
      );
    }

    if (!trandata) {
      return cors.addHeaders(
        NextResponse.json({ message: 'trandata is required' }, { status: 400 }),
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

    // Look up checkout session by benefit_track_id or benefit_payment_id
    const trackId = responseData.trackId ? String(responseData.trackId) : null;
    const paymentId = responseData.paymentId || null;

    console.log('[BENEFIT Process] Payment IDs:', {
      paymentIdFromResponse: responseData.paymentId,
      trackId: trackId,
      sessionId: sessionId,
    });

    let session;
    if (trackId) {
      const { data: sessionByTrackId, error: sessionError } = await getSupabase()
        .from('checkout_sessions')
        .select('*')
        .eq('benefit_track_id', trackId)
        .eq('user_id', authResult.user.id)
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
        .eq('user_id', authResult.user.id)
        .single();
      
      if (!sessionError2 && sessionByPaymentId) {
        session = sessionByPaymentId;
      }
    }

    // If still not found and we have sessionId, use it directly
    if (!session && sessionId) {
      const { data: sessionById, error: sessionError3 } = await getSupabase()
        .from('checkout_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', authResult.user.id)
        .single();
      
      if (!sessionError3 && sessionById) {
        session = sessionById;
      }
    }

    if (!session) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Checkout session not found' }, { status: 404 }),
        request
      );
    }

    console.log('[BENEFIT Process] Session found:', {
      sessionId: session.id,
      status: session.status,
      orderId: session.order_id,
      trackId: session.benefit_track_id,
    });

    // If webhook already processed this payment, return existing order
    if (session.status === 'paid' && session.order_id) {
      console.log('[BENEFIT Process] Session already processed by webhook, returning existing order');
      
      const { data: existingOrder } = await getSupabase()
        .from('orders')
        .select('id, payment_status')
        .eq('id', session.order_id)
        .single();
      
      if (existingOrder && existingOrder.payment_status === 'paid') {
        // Extract transaction details from order if available
        const { data: orderWithDetails } = await getSupabase()
          .from('orders')
          .select('benefit_trans_id, benefit_ref, benefit_auth_resp_code, benefit_payment_id')
          .eq('id', session.order_id)
          .single();
        
        return cors.addHeaders(
          NextResponse.json({
            success: true,
            message: 'Payment already processed',
            orderId: existingOrder.id,
            transactionDetails: orderWithDetails ? {
              transId: orderWithDetails.benefit_trans_id,
              paymentId: orderWithDetails.benefit_payment_id || responseData.paymentId,
              ref: orderWithDetails.benefit_ref,
              authRespCode: orderWithDetails.benefit_auth_resp_code,
            } : undefined,
          }),
          request
        );
      }
    }

    // Check if session already has an order (idempotency - for edge cases)
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
            message: 'Order already processed',
            orderId: existingOrder.id,
          }),
          request
        );
      }
    }

    // Validate transaction
    const isSuccessful = isTransactionSuccessful(responseData);

    // Validate amount matches session
    if (responseData.amt) {
      const responseAmount = parseFloat(responseData.amt);
      const sessionAmount = parseFloat(session.total.toString());
      const amountDiff = Math.abs(responseAmount - sessionAmount);

      if (amountDiff > 0.01) { // Allow 0.01 difference for rounding
        console.error('[BENEFIT Process] Amount mismatch:', {
          responseAmount,
          sessionAmount,
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

    // If payment failed, mark session as failed and release inventory
    if (!isSuccessful) {
      console.log('[BENEFIT Process] Transaction failed:', responseData.result);
      
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
        console.error('[BENEFIT Process] Failed to release stock:', releaseError);
      });
      
      return cors.addHeaders(
        NextResponse.json({
          success: false,
          message: `Payment failed: ${responseData.result || 'Unknown error'}`,
        }),
        request
      );
    }

    // Payment successful - create order from session
    // First, verify products still exist and get current data
    const orderItems = [];
    let total = 0;

    for (const item of session.items) {
      const product = await supabaseHelpers.findProductById(item.productId);
      
      if (!product) {
        console.error('[BENEFIT Process] Product not found:', item.productId);
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
        
        return cors.addHeaders(
          NextResponse.json({ message: `Product not found: ${item.productId}` }, { status: 404 }),
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

      total += parseFloat((item.price || product.price).toString()) * item.quantity;
    }

    // Create order
    const orderInsertData: any = {
      user_id: session.user_id,
      total: session.total, // Use session total (may differ slightly from recalculated)
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
    
    // Store token ID from udf7 (Faster Checkout per spec v1.51)
    const tokenId = responseData.udf7 || null;
    if (tokenId) {
      orderInsertData.benefit_token_id = tokenId;
      console.log('[BENEFIT Process] Token ID received in udf7:', tokenId);
    }

    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) {
      console.error('[BENEFIT Process] Order creation error:', orderError);
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
      
      return cors.addHeaders(
        NextResponse.json({ message: 'Failed to create order' }, { status: 500 }),
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
      console.error('[BENEFIT Process] Order items creation error:', itemsError);
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
      
      return cors.addHeaders(
        NextResponse.json({ message: 'Failed to create order items' }, { status: 500 }),
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
      .eq('id', session.id);

    console.log('[BENEFIT Process] Payment successful, order created:', order.id);

    // Handle Faster Checkout token per spec v1.51
    if (process.env.BENEFIT_FASTER_CHECKOUT_ENABLED === 'true' && isSuccessful) {
      // Check for token deletion (udf9 = "DELETED")
      if (responseData.udf9 === 'DELETED') {
        console.log('[BENEFIT Process] Token deletion detected (udf9=DELETED)');
        
        // Mark all tokens for this user as deleted
        // Note: We don't have the specific token ID here, so we'll mark based on payment context
        if (tokenId) {
          // If we have tokenId, mark that specific token as deleted
          const tokenHash = crypto.createHash('sha256').update(tokenId).digest('hex');
          await getSupabase()
            .from('benefit_payment_tokens')
            .update({ status: 'deleted', updated_at: new Date().toISOString() })
            .eq('token_hash', tokenHash)
            .eq('user_id', authResult.user.id)
            .catch(error => {
              console.error('[BENEFIT Process] Failed to mark token as deleted:', error);
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
          console.log('[BENEFIT Process] Token received (udf7 or legacy field):', token.substring(0, 10) + '...');
          
          // Store token asynchronously (don't await - let it run in background)
          storePaymentToken({
            userId: authResult.user.id,
            token,
            paymentId: responseData.paymentId,
            orderId: order.id,
            responseData, // For card details if available
          }).catch(error => {
            // Log but don't fail response - token storage is non-critical
            console.error('[BENEFIT Process] Token storage failed (non-blocking):', error);
          });
        } else if (process.env.NODE_ENV === 'development') {
          // Log when token is expected but not found (for debugging)
          console.log('[BENEFIT Process] No token found in response data. Available fields:', Object.keys(responseData));
          console.log('[BENEFIT Process] udf7:', responseData.udf7, 'udf8:', responseData.udf8, 'udf9:', responseData.udf9);
        }
      }
    }
    
    // Log Faster Checkout fields for observability
    console.log('[BENEFIT Process] Faster Checkout fields:', {
      udf7: responseData.udf7 ? responseData.udf7.substring(0, 10) + '...' : 'not present',
      udf8: responseData.udf8 || 'not present',
      udf9: responseData.udf9 || 'not present',
    });

    return cors.addHeaders(
      NextResponse.json({
        success: true,
        message: 'Payment processed successfully',
        orderId: order.id,
        transactionDetails: {
          transId: responseData.transId,
          paymentId: responseData.paymentId || session.benefit_payment_id,
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

