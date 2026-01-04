import { NextRequest } from 'next/server';
import { decryptTrandata } from '@/lib/services/benefit/crypto';
import { parseResponseTrandata, isTransactionSuccessful } from '@/lib/services/benefit/trandata';
import { getSupabase } from '@/lib/db';
import { convertReservedToSold } from '@/lib/db-stock-helpers';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/benefit/callback
 * Handles POST redirect from BENEFIT gateway (both success and error cases)
 * 
 * BENEFIT expects a plain text response with HTTP 200 status:
 * REDIRECT=https://helloonebahrain.com/pay/benefit/response?orderId=...
 * 
 * This route processes the data and returns the REDIRECT= response format
 */
export async function POST(request: NextRequest) {
  try {
    // Get orderId from query params (BENEFIT includes it in URL)
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.CLIENT_URL || 'https://helloonebahrain.com');

    // Get form data from POST request (BENEFIT sends as form-encoded)
    const formData = await request.formData();
    const trandataParam = formData.get('trandata') as string | null;
    const errorText = formData.get('ErrorText') as string | null;
    const errorParam = formData.get('Error') as string | null;

    // If no orderId, return redirect to error page
    if (!orderId) {
      const errorUrl = `${baseUrl}/pay/benefit/error?error=missing_order`;
      return new Response(`REDIRECT=${errorUrl}`, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Check for error case first (ErrorText or Error parameter)
    if (errorText || errorParam) {
      const errorUrl = new URL('/pay/benefit/error', baseUrl);
      errorUrl.searchParams.set('orderId', orderId);
      if (errorText) {
        errorUrl.searchParams.set('ErrorText', errorText);
      }
      if (errorParam) {
        errorUrl.searchParams.set('Error', errorParam);
      }
      if (trandataParam) {
        errorUrl.searchParams.set('trandata', trandataParam);
      }

      // Optionally mark order as failed
      try {
        await getSupabase()
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', orderId)
          .eq('payment_status', 'unpaid');
      } catch (markError) {
        console.error('[BENEFIT Callback] Failed to mark order as failed:', markError);
      }

      return new Response(`REDIRECT=${errorUrl.toString()}`, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Success case: process trandata
    const resourceKey = process.env.BENEFIT_RESOURCE_KEY;
    if (!resourceKey) {
      console.error('[BENEFIT Callback] Missing resource key');
      const errorUrl = `${baseUrl}/pay/benefit/error?orderId=${orderId}&error=config`;
      return new Response(`REDIRECT=${errorUrl}`, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // If no trandata, redirect to response page for manual status check
    if (!trandataParam) {
      console.warn('[BENEFIT Callback] No trandata in request, redirecting to response page');
      const responseUrl = `${baseUrl}/pay/benefit/response?orderId=${orderId}`;
      return new Response(`REDIRECT=${responseUrl}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Fetch order to verify it exists
    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .select('id, user_id, total, payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[BENEFIT Callback] Order not found:', orderId);
      const errorUrl = `${baseUrl}/pay/benefit/error?orderId=${orderId}&error=not_found`;
      return new Response(`REDIRECT=${errorUrl}`, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      });
    }

    try {
      // Decrypt trandata
      const decryptedTrandata = decryptTrandata(trandataParam, resourceKey);
      
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
        const successUrl = new URL('/pay/benefit/response', baseUrl);
        successUrl.searchParams.set('orderId', orderId);
        successUrl.searchParams.set('trandata', trandataParam);
        
      return new Response(`REDIRECT=${successUrl.toString()}`, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      });
      } else {
        // Transaction failed (but no ErrorText, so it's in trandata)
        console.error('[BENEFIT Callback] Transaction failed:', responseData);
        const errorUrl = new URL('/pay/benefit/error', baseUrl);
        errorUrl.searchParams.set('orderId', orderId);
        errorUrl.searchParams.set('trandata', trandataParam);
        
        return new Response(`REDIRECT=${errorUrl.toString()}`, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    } catch (decryptError: any) {
      console.error('[BENEFIT Callback] Decryption/parsing error:', decryptError);
      // Redirect to error page even if we can't decrypt
      const errorUrl = `${baseUrl}/pay/benefit/error?orderId=${orderId}&error=decrypt`;
      return new Response(`REDIRECT=${errorUrl}`, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
        },
      });
    }
  } catch (error: any) {
    console.error('[BENEFIT Callback] Error:', error);
    // Return error redirect with HTTP 200
    const orderId = request.nextUrl.searchParams.get('orderId') || 'unknown';
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.CLIENT_URL || 'https://helloonebahrain.com');
    const errorUrl = `${baseUrl}/pay/benefit/error?orderId=${orderId}&error=server`;
    return new Response(`REDIRECT=${errorUrl}`, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * GET /api/payments/benefit/callback
 * Fallback for GET requests (shouldn't happen, but handle gracefully)
 * Still return REDIRECT= format for consistency
 */
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId') || 'unknown';
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : (process.env.CLIENT_URL || 'https://helloonebahrain.com');
  const responseUrl = `${baseUrl}/pay/benefit/response?orderId=${orderId}`;
  return new Response(`REDIRECT=${responseUrl}`, {
    status: 200,
    headers: { 
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}
