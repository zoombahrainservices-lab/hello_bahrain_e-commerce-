import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';
import { encryptTrandata } from '@/lib/services/benefit/crypto';
import { buildPlainTrandata, validateTrandataParams } from '@/lib/services/benefit/trandata';
import { getTokenForUser } from '@/lib/services/benefit/token-storage';

export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * POST /api/payments/benefit/init-with-token
 * Initialize BENEFIT payment using saved token (Faster Checkout)
 * 
 * Request body:
 * - orderId: string (required)
 * - amount: number (required)
 * - tokenId: string (required, UUID of saved token)
 * - currency: string (optional, defaults to 'BHD')
 * 
 * Response:
 * - paymentUrl: string (redirect URL to BENEFIT payment page with token)
 * - paymentId: string (BENEFIT payment ID)
 */
export async function POST(request: NextRequest) {
  try {
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    // Check if feature is enabled
    if (process.env.BENEFIT_FASTER_CHECKOUT_ENABLED !== 'true') {
      return cors.addHeaders(
        NextResponse.json({ message: 'Faster Checkout feature is not enabled' }, { status: 403 }),
        request
      );
    }

    // Authenticate user
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return cors.addHeaders(authResult, request);
    }

    const body = await request.json();
    const { orderId, amount, tokenId, currency = 'BHD' } = body;

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

    if (!tokenId) {
      return cors.addHeaders(
        NextResponse.json({ message: 'tokenId is required' }, { status: 400 }),
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

    // Get and verify token belongs to user
    const { token, error: tokenError } = await getTokenForUser(tokenId, authResult.user.id);
    
    if (tokenError || !token) {
      return cors.addHeaders(
        NextResponse.json({ message: tokenError || 'Token not found or access denied' }, { status: 404 }),
        request
      );
    }

    // Get BENEFIT credentials from environment
    const tranportalId = process.env.BENEFIT_TRANPORTAL_ID;
    const tranportalPassword = process.env.BENEFIT_TRANPORTAL_PASSWORD;
    const resourceKey = process.env.BENEFIT_RESOURCE_KEY;
    const benefitEndpoint = process.env.BENEFIT_ENDPOINT;

    if (!tranportalId || !tranportalPassword || !resourceKey || !benefitEndpoint) {
      console.error('[BENEFIT Init With Token] Missing environment variables');
      return cors.addHeaders(
        NextResponse.json({ message: 'BENEFIT gateway not configured' }, { status: 500 }),
        request
      );
    }

    // Build URLs
    const baseUrl = process.env.CLIENT_URL || 'https://helloonebahrain.com';
    const responseURL = `${baseUrl}/api/payments/benefit/ack?orderId=${orderId}`;
    const errorURL = `${baseUrl}/pay/benefit/error?orderId=${orderId}`;

    // Format amount to 3 decimal places for BHD
    const amountFormatted = parseFloat(amount.toString()).toFixed(3);

    // Generate numeric trackId (BenefitPay recommends numeric IDs)
    const numericTrackId = Date.now().toString();
    
    // Store the numeric trackId mapping in database for later lookup
    await getSupabase()
      .from('orders')
      .update({ benefit_track_id: numericTrackId })
      .eq('id', orderId);
    
    const trackId = numericTrackId;

    // Build plain trandata WITH TOKEN
    const trandataParams = {
      amt: amountFormatted,
      trackId,
      responseURL,
      errorURL,
      tranportalId,
      tranportalPassword,
      udf1: "", // Keep empty per BENEFIT recommendation
      token: token, // Include saved token for Faster Checkout
    };

    // Validate parameters
    try {
      validateTrandataParams(trandataParams);
    } catch (validationError: any) {
      console.error('[BENEFIT Init With Token] Validation error:', validationError.message);
      return cors.addHeaders(
        NextResponse.json({ message: `Invalid parameters: ${validationError.message}` }, { status: 400 }),
        request
      );
    }

    // Build plain trandata JSON
    const plainTrandata = buildPlainTrandata(trandataParams);

    if (process.env.NODE_ENV === 'development') {
      console.log('[BENEFIT Init With Token] Plain trandata (token included):', plainTrandata.replace(token, '[TOKEN_REDACTED]'));
    }

    // Encrypt trandata
    let encryptedTrandata: string;
    try {
      encryptedTrandata = encryptTrandata(plainTrandata, resourceKey);
    } catch (encryptError: any) {
      console.error('[BENEFIT Init With Token] Encryption error:', encryptError.message);
      return cors.addHeaders(
        NextResponse.json({ message: 'Failed to encrypt payment data' }, { status: 500 }),
        request
      );
    }

    // Build request payload for BENEFIT
    const benefitPayload = [
      {
        id: tranportalId,
        trandata: encryptedTrandata,
      },
    ];

    if (process.env.NODE_ENV === 'development') {
      console.log('[BENEFIT Init With Token] Calling BENEFIT endpoint:', benefitEndpoint);
      console.log('[BENEFIT Init With Token] Encrypted trandata length:', encryptedTrandata.length);
    }

    // Call BENEFIT hosted endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(benefitEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(benefitPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BENEFIT Init With Token] HTTP error:', response.status, errorText);
        throw new Error(`BENEFIT API error: ${response.status}`);
      }

      const responseData = await response.json();

      if (process.env.NODE_ENV === 'development') {
        console.log('[BENEFIT Init With Token] Response:', JSON.stringify(responseData, null, 2));
      }

      // Parse BENEFIT response
      let data;
      if (Array.isArray(responseData) && responseData.length > 0) {
        data = responseData[0];
      } else if (typeof responseData === 'object' && responseData !== null) {
        data = responseData;
      } else {
        console.error('[BENEFIT Init With Token] Invalid response format:', responseData);
        return cors.addHeaders(
          NextResponse.json({ message: 'Invalid response from BENEFIT gateway' }, { status: 500 }),
          request
        );
      }

      if (data.status === "1" && data.result) {
        // Success: result is already the full payment URL
        const fullPaymentUrl = data.result;

        // Extract PaymentID from URL for storing in database
        const paymentIdMatch = fullPaymentUrl.match(/[?&]PaymentID=([^&]+)/);
        const paymentId = paymentIdMatch ? paymentIdMatch[1] : null;

        // Update order with BENEFIT payment ID (if we extracted it)
        if (paymentId) {
          await getSupabase()
            .from('orders')
            .update({
              benefit_payment_id: paymentId,
            })
            .eq('id', orderId);
        }

        return cors.addHeaders(
          NextResponse.json({
            paymentUrl: fullPaymentUrl,
            paymentId: paymentId || undefined,
          }),
          request
        );
      } else if (data.status === "2") {
        // Error response from BENEFIT
        const errorMessage = data.errorText || data.error || 'BENEFIT gateway error';
        console.error('[BENEFIT Init With Token] Gateway error:', errorMessage);
        return cors.addHeaders(
          NextResponse.json({ message: errorMessage }, { status: 400 }),
          request
        );
      } else {
        // Unexpected response format
        console.error('[BENEFIT Init With Token] Unexpected response:', data);
        return cors.addHeaders(
          NextResponse.json({ message: 'Unexpected response from BENEFIT gateway' }, { status: 500 }),
          request
        );
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[BENEFIT Init With Token] Request timeout');
        return cors.addHeaders(
          NextResponse.json({ message: 'BENEFIT gateway timeout' }, { status: 504 }),
          request
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[BENEFIT Init With Token] Error:', error);
    return cors.addHeaders(
      NextResponse.json(
        {
          message: error.message || 'Failed to initialize BENEFIT payment with token',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      ),
      request
    );
  }
}

