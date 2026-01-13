import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';
import { encryptTrandata } from '@/lib/services/benefit/crypto';
import { buildPlainTrandata, validateTrandataParams } from '@/lib/services/benefit/trandata';

export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * POST /api/payments/benefit/init
 * Initialize BENEFIT payment gateway transaction
 * 
 * Request body:
 * - orderId: string (required)
 * - amount: number (required)
 * - currency: string (optional, defaults to 'BHD')
 * 
 * Response:
 * - paymentUrl: string (redirect URL to BENEFIT payment page)
 * - paymentId: string (BENEFIT payment ID)
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
    const { sessionId, amount, currency = 'BHD' } = body;

    // Validation
    if (!sessionId) {
      return cors.addHeaders(
        NextResponse.json({ message: 'sessionId is required' }, { status: 400 }),
        request
      );
    }

    if (!amount || parseFloat(amount) <= 0) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Valid amount is required' }, { status: 400 }),
        request
      );
    }

    // Verify checkout session exists and belongs to user
    const { data: session, error: sessionError } = await getSupabase()
      .from('checkout_sessions')
      .select('id, user_id, total, payment_method, status')
      .eq('id', sessionId)
      .eq('user_id', authResult.user.id)
      .eq('status', 'initiated')
      .single();

    if (sessionError || !session) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Checkout session not found or already processed' }, { status: 404 }),
        request
      );
    }

    // Get BENEFIT credentials from environment
    const tranportalId = process.env.BENEFIT_TRANPORTAL_ID;
    const tranportalPassword = process.env.BENEFIT_TRANPORTAL_PASSWORD;
    const resourceKey = process.env.BENEFIT_RESOURCE_KEY;
    const benefitEndpoint = process.env.BENEFIT_ENDPOINT;

    if (!tranportalId || !tranportalPassword || !resourceKey || !benefitEndpoint) {
      console.error('[BENEFIT Init] Missing environment variables');
      return cors.addHeaders(
        NextResponse.json({ message: 'BENEFIT gateway not configured' }, { status: 500 }),
        request
      );
    }

    // Validate resource key length (must be exactly 32 characters for AES-256)
    if (resourceKey.length !== 32) {
      console.error(`[BENEFIT Init] Invalid resource key length: expected 32 characters, got ${resourceKey.length}`);
      return cors.addHeaders(
        NextResponse.json({ 
          message: `BENEFIT_RESOURCE_KEY must be exactly 32 characters, but it's ${resourceKey.length} characters. Please check your environment variables.` 
        }, { status: 500 }),
        request
      );
    }

    // Build URLs
    // CRITICAL: Always use production URL (never localhost)
    // BenefitPay servers need to reach these URLs for Merchant Notification
    const baseUrl = process.env.CLIENT_URL || 'https://helloonebahrain.com';
    
    // Use ACK endpoint for responseURL (fast acknowledgement only)
    const responseURL = `${baseUrl}/api/payments/benefit/ack?sessionId=${sessionId}`;
    
    // Use error page for errorURL
    const errorURL = `${baseUrl}/pay/benefit/error?sessionId=${sessionId}`;

    // Format amount to 3 decimal places for BHD
    const amountFormatted = parseFloat(amount.toString()).toFixed(3);

    // Generate numeric trackId (BenefitPay recommends numeric IDs)
    // Use timestamp-based ID to ensure uniqueness
    const numericTrackId = Date.now().toString();
    
    const trackId = numericTrackId;

    // Build plain trandata
    const trandataParams = {
      amt: amountFormatted,
      trackId,
      responseURL,
      errorURL,
      tranportalId,
      tranportalPassword,
      udf1: "", // Keep empty per BENEFIT recommendation
    };

    // Validate parameters
    try {
      validateTrandataParams(trandataParams);
    } catch (validationError: any) {
      console.error('[BENEFIT Init] Validation error:', validationError.message);
      return cors.addHeaders(
        NextResponse.json({ message: `Invalid parameters: ${validationError.message}` }, { status: 400 }),
        request
      );
    }

    // Build plain trandata JSON
    const plainTrandata = buildPlainTrandata(trandataParams);

    if (process.env.NODE_ENV === 'development') {
      console.log('[BENEFIT Init] Plain trandata:', plainTrandata);
    }

    // Encrypt trandata
    let encryptedTrandata: string;
    try {
      encryptedTrandata = encryptTrandata(plainTrandata, resourceKey);
    } catch (encryptError: any) {
      console.error('[BENEFIT Init] Encryption error:', encryptError.message);
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
      console.log('[BENEFIT Init] Calling BENEFIT endpoint:', benefitEndpoint);
      console.log('[BENEFIT Init] Encrypted trandata length:', encryptedTrandata.length);
    }

    // Call BENEFIT hosted endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(benefitEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        body: JSON.stringify(benefitPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BENEFIT Init] HTTP error:', response.status, errorText);
        throw new Error(`BENEFIT API error: ${response.status}`);
      }

      const responseData = await response.json();

      if (process.env.NODE_ENV === 'development') {
        console.log('[BENEFIT Init] Response:', JSON.stringify(responseData, null, 2));
      }

      // Parse BENEFIT response
      // BENEFIT returns an array: [{ status: "1", result: "full_payment_url" }]
      // Or error: [{ status: "2", error: "...", errorText: "..." }]

      let data;
      if (Array.isArray(responseData) && responseData.length > 0) {
        // Extract first element from array
        data = responseData[0];
      } else if (typeof responseData === 'object' && responseData !== null) {
        // Fallback: if it's already an object
        data = responseData;
      } else {
        console.error('[BENEFIT Init] Invalid response format:', responseData);
        return cors.addHeaders(
          NextResponse.json({ message: 'Invalid response from BENEFIT gateway' }, { status: 500 }),
          request
        );
      }

      if (data.status === "1" && data.result) {
        // Success: result is already the full payment URL
        // Format: "https://test.benefit-gateway.bh/payment/paymentpage.htm?PaymentID=..."
        const fullPaymentUrl = data.result;

        // Extract PaymentID from URL for storing in database
        const paymentIdMatch = fullPaymentUrl.match(/[?&]PaymentID=([^&]+)/);
        const paymentId = paymentIdMatch ? paymentIdMatch[1] : null;

        // Update checkout session with BENEFIT tracking IDs
        await getSupabase()
          .from('checkout_sessions')
          .update({
            benefit_track_id: numericTrackId,
            benefit_payment_id: paymentId || null,
          })
          .eq('id', sessionId);

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
        console.error('[BENEFIT Init] Gateway error:', errorMessage);
        return cors.addHeaders(
          NextResponse.json({ message: errorMessage }, { status: 400 }),
          request
        );
      } else {
        // Unexpected response format
        console.error('[BENEFIT Init] Unexpected response:', data);
        return cors.addHeaders(
          NextResponse.json({ message: 'Unexpected response from BENEFIT gateway' }, { status: 500 }),
          request
        );
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[BENEFIT Init] Request timeout');
        return cors.addHeaders(
          NextResponse.json({ message: 'BENEFIT gateway timeout' }, { status: 504 }),
          request
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[BENEFIT Init] Error:', error);
    return cors.addHeaders(
      NextResponse.json(
        {
          message: error.message || 'Failed to initialize BENEFIT payment',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      ),
      request
    );
  }
}

