import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { cors } from '@/lib/cors';
import { decryptTrandata } from '@/lib/services/benefit/crypto';
import { parseResponseTrandata, getErrorMessage } from '@/lib/services/benefit/trandata';

export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * POST /api/payments/benefit/process-error
 * Process BENEFIT payment error response (decrypt and parse)
 * 
 * Request body:
 * - orderId: string (optional)
 * - trandata: string (required, encrypted hex string from BENEFIT)
 * 
 * Response:
 * - message: string (error message)
 * - errorDetails: object (if available)
 */
export async function POST(request: NextRequest) {
  try {
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    // Authenticate user (optional for error page)
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return cors.addHeaders(authResult, request);
    }

    const body = await request.json();
    const { trandata } = body;

    if (!trandata) {
      return cors.addHeaders(
        NextResponse.json({ message: 'trandata is required' }, { status: 400 }),
        request
      );
    }

    // Get resource key from environment
    const resourceKey = process.env.BENEFIT_RESOURCE_KEY;

    if (!resourceKey) {
      console.error('[BENEFIT Error] Missing resource key');
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
      console.error('[BENEFIT Error] Decryption error:', decryptError.message);
      return cors.addHeaders(
        NextResponse.json({
          message: 'Payment was not completed',
          errorDetails: null,
        }),
        request
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[BENEFIT Error] Decrypted trandata:', decryptedTrandata);
    }

    // Parse trandata
    let responseData;
    try {
      responseData = parseResponseTrandata(decryptedTrandata);
    } catch (parseError: any) {
      console.error('[BENEFIT Error] Parse error:', parseError.message);
      return cors.addHeaders(
        NextResponse.json({
          message: 'Payment was not completed',
          errorDetails: null,
        }),
        request
      );
    }

    // Get error message
    const errorMessage = getErrorMessage(responseData);

    return cors.addHeaders(
      NextResponse.json({
        message: errorMessage,
        errorDetails: {
          result: responseData.result,
          authRespCode: responseData.authRespCode,
          paymentId: responseData.paymentId,
        },
      }),
      request
    );
  } catch (error: any) {
    console.error('[BENEFIT Error] Error:', error);
    return cors.addHeaders(
      NextResponse.json(
        {
          message: 'Payment was not completed',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      ),
      request
    );
  }
}



