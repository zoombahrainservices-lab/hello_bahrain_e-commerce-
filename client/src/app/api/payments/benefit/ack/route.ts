import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/benefit/ack
 * Fast acknowledgement endpoint for BenefitPay Merchant Notification
 * 
 * This endpoint MUST:
 * - Respond within 2 seconds
 * - Return HTTP 200 with Content-Type: text/plain
 * - Return body: REDIRECT=https://your-domain.com/pay/benefit/response?sessionId=...
 * - NOT process payment (that happens in the response page)
 * - NOT require authentication (called by BenefitPay servers)
 * 
 * BenefitPay flow:
 * 1. Customer completes payment on BenefitPay gateway
 * 2. BenefitPay POSTs to this ACK endpoint (Merchant Notification)
 * 3. This endpoint responds with REDIRECT=... (acknowledges merchant is alive)
 * 4. BenefitPay redirects customer's browser to the REDIRECT URL
 * 5. The response page processes the payment
 */
export async function POST(request: NextRequest) {
  try {
    // Get sessionId from query params
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    // Get base URL (must be production URL, never localhost)
    const baseUrl = process.env.CLIENT_URL || 'https://helloonebahrain.com';
    
    // Log for debugging (optional)
    if (process.env.NODE_ENV === 'development') {
      console.log('[BENEFIT ACK] Received acknowledgement request for session:', sessionId);
    }
    
    // Fast acknowledgement - no processing, just return redirect URL
    // Redirect to response-handler which will convert POST to GET
    const redirectUrl = `${baseUrl}/api/payments/benefit/response-handler?sessionId=${sessionId || 'unknown'}`;
    
    // Return plain text REDIRECT response (exactly as BenefitPay expects)
    return new Response(`REDIRECT=${redirectUrl}`, {
      status: 200,
      headers: { 
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    // Even on error, return a valid REDIRECT response
    // Don't throw errors or return error status codes
    console.error('[BENEFIT ACK] Error:', error);
    const baseUrl = process.env.CLIENT_URL || 'https://helloonebahrain.com';
    const sessionId = request.nextUrl.searchParams.get('sessionId') || 'unknown';
    const errorUrl = `${baseUrl}/pay/benefit/error?sessionId=${sessionId}&error=ack_error`;
    
    return new Response(`REDIRECT=${errorUrl}`, {
      status: 200,
      headers: { 
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

/**
 * GET /api/payments/benefit/ack
 * Fallback for GET requests (shouldn't happen, but handle gracefully)
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId') || 'unknown';
  const baseUrl = process.env.CLIENT_URL || 'https://helloonebahrain.com';
  const redirectUrl = `${baseUrl}/api/payments/benefit/response-handler?sessionId=${sessionId}`;
  
  return new Response(`REDIRECT=${redirectUrl}`, {
    status: 200,
    headers: { 
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}

