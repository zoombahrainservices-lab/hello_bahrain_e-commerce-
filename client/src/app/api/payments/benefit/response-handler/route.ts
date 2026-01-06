import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/benefit/response-handler
 * Handles POST redirect from BenefitPay gateway
 * 
 * BenefitPay redirects the browser with a POST request containing trandata in form data.
 * This route handler extracts the data and redirects to the page with GET + query params.
 * 
 * Flow:
 * 1. BenefitPay POST → /api/payments/benefit/response-handler
 * 2. Extract trandata from form data
 * 3. Redirect browser → /pay/benefit/response?sessionId=...&trandata=...
 * 4. Page loads with GET request and processes trandata
 */
export async function POST(request: NextRequest) {
  try {
    // Get sessionId from query params
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    // Get form data from POST request
    const formData = await request.formData();
    const trandata = formData.get('trandata') as string | null;
    const errorText = formData.get('ErrorText') as string | null;
    const error = formData.get('Error') as string | null;
    
    console.log('[BENEFIT Response Handler] Received POST:', {
      sessionId,
      hasTrandata: !!trandata,
      trandataLength: trandata?.length || 0,
      hasError: !!(errorText || error),
    });
    
    // Build redirect URL with query params
    const baseUrl = process.env.CLIENT_URL || 'https://helloonebahrain.com';
    const redirectUrl = new URL('/pay/benefit/response', baseUrl);
    
    if (sessionId) {
      redirectUrl.searchParams.set('sessionId', sessionId);
    }
    
    if (trandata) {
      redirectUrl.searchParams.set('trandata', trandata);
    }
    
    if (errorText) {
      redirectUrl.searchParams.set('ErrorText', errorText);
    }
    
    if (error) {
      redirectUrl.searchParams.set('Error', error);
    }
    
    console.log('[BENEFIT Response Handler] Redirecting to:', redirectUrl.toString());
    
    // Redirect browser to GET version of the page (303 = See Other, changes POST to GET)
    return NextResponse.redirect(redirectUrl, 303);
  } catch (error: any) {
    console.error('[BENEFIT Response Handler] Error:', error);
    
    // Redirect to error page
    const baseUrl = process.env.CLIENT_URL || 'https://helloonebahrain.com';
    const errorUrl = new URL('/pay/benefit/error', baseUrl);
    errorUrl.searchParams.set('error', 'server_error');
    
    // Include sessionId if available so error page can fetch payment ID
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    if (sessionId) {
      errorUrl.searchParams.set('sessionId', sessionId);
    }
    
    return NextResponse.redirect(errorUrl, 303);
  }
}


