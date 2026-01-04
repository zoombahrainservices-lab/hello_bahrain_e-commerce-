import { NextRequest, NextResponse } from 'next/server';
import { decryptTrandata } from '@/lib/services/benefit/crypto';
import { parseResponseTrandata, isTransactionSuccessful } from '@/lib/services/benefit/trandata';
import { getSupabase } from '@/lib/db';
import { convertReservedToSold } from '@/lib/db-stock-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/benefit/callback
 * Handles POST redirect from BENEFIT gateway (success case)
 * 
 * BENEFIT redirects here with POST data containing encrypted trandata
 * This route processes the data and redirects to the success page
 */
export async function POST(request: NextRequest) {
  try {
    // Get orderId from query params (BENEFIT may include it in URL)
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.CLIENT_URL || 'https://helloonebahrain.com');

    if (!orderId) {
      // Redirect to error page if no orderId
      return NextResponse.redirect(new URL('/pay/benefit/error?error=missing_order', baseUrl), 303);
    }

    // Get form data from POST request (BENEFIT sends as form-encoded)
    const formData = await request.formData();
    const trandataParam = formData.get('trandata') as string | null;

    // If no trandata in form, try URL params
    const urlTrandata = searchParams.get('trandata') || trandataParam;

    const resourceKey = process.env.BENEFIT_RESOURCE_KEY;
    if (!resourceKey) {
      console.error('[BENEFIT Callback] Missing resource key');
      return NextResponse.redirect(new URL(`/pay/benefit/error?orderId=${orderId}&error=config`, baseUrl), 303);
    }

    // Fetch order
    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .select('id, user_id, total, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[BENEFIT Callback] Order not found:', orderId);
      return NextResponse.redirect(new URL(`/pay/benefit/error?orderId=${orderId}&error=not_found`, baseUrl), 303);
    }

    // If no trandata, redirect with orderId (user can check status manually)
    if (!urlTrandata) {
      console.warn('[BENEFIT Callback] No trandata in request, redirecting to response page');
      return NextResponse.redirect(new URL(`/pay/benefit/response?orderId=${orderId}`, baseUrl), 303);
    }

    try {
      // Decrypt trandata
      const decryptedTrandata = decryptTrandata(urlTrandata, resourceKey);
      
      // Parse response data
      const responseData = parseResponseTrandata(decryptedTrandata);

      // Check if transaction was successful
      if (isTransactionSuccessful(responseData)) {
        // Update order to paid
        const updateData: any = {
          payment_status: 'paid',
          benefit_trans_id: responseData.transId || responseData.tranid,
          benefit_ref: responseData.ref,
          benefit_auth_resp_code: responseData.authRespCode || responseData.auth,
        };

        const { error: updateError } = await getSupabase()
          .from('orders')
          .update(updateData)
          .eq('id', orderId);

        if (updateError) {
          console.error('[BENEFIT Callback] Failed to update order:', updateError);
        } else {
          // Convert reserved inventory to sold
          try {
            await convertReservedToSold(orderId);
          } catch (stockError) {
            console.error('[BENEFIT Callback] Failed to convert inventory:', stockError);
            // Don't fail the payment if inventory conversion fails
          }
        }

        // Redirect to success page with trandata
        const redirectUrl = new URL('/pay/benefit/response', baseUrl);
        redirectUrl.searchParams.set('orderId', orderId);
        redirectUrl.searchParams.set('trandata', urlTrandata);
        return NextResponse.redirect(redirectUrl, 303);
      } else {
        // Transaction failed
        console.error('[BENEFIT Callback] Transaction failed:', responseData);
        const redirectUrl = new URL('/pay/benefit/error', baseUrl);
        redirectUrl.searchParams.set('orderId', orderId);
        redirectUrl.searchParams.set('trandata', urlTrandata);
        return NextResponse.redirect(redirectUrl, 303);
      }
    } catch (decryptError: any) {
      console.error('[BENEFIT Callback] Decryption/parsing error:', decryptError);
      // Redirect to error page even if we can't decrypt
      return NextResponse.redirect(new URL(`/pay/benefit/error?orderId=${orderId}&error=decrypt`, baseUrl), 303);
    }
  } catch (error: any) {
    console.error('[BENEFIT Callback] Error:', error);
    // Redirect to error page
    const orderId = request.nextUrl.searchParams.get('orderId') || 'unknown';
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.CLIENT_URL || 'https://helloonebahrain.com');
    return NextResponse.redirect(new URL(`/pay/benefit/error?orderId=${orderId}&error=server`, baseUrl), 303);
  }
}

/**
 * GET /api/payments/benefit/callback
 * Fallback for GET requests (shouldn't happen, but handle gracefully)
 */
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId') || 'unknown';
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : (process.env.CLIENT_URL || 'https://helloonebahrain.com');
  return NextResponse.redirect(new URL(`/pay/benefit/response?orderId=${orderId}`, baseUrl), 303);
}

