import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/benefit/callback-error
 * Handles POST redirect from BENEFIT gateway (error case)
 * 
 * BENEFIT redirects here with POST data when payment fails
 * This route processes the error and redirects to the error page
 */
export async function POST(request: NextRequest) {
  try {
    // Get orderId from query params
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      // Redirect to error page if no orderId
      const redirectUrl = new URL('/pay/benefit/error', request.url);
      redirectUrl.searchParams.set('error', 'missing_order');
      return NextResponse.redirect(redirectUrl, 303); // 303 See Other - changes POST to GET
    }

    // Get form data from POST request (BENEFIT may send error data)
    const formData = await request.formData();
    const trandataParam = formData.get('trandata') as string | null;
    const errorText = formData.get('ErrorText') as string | null;
    const errorParam = formData.get('Error') as string | null;

    // Build redirect URL to error page (absolute URL required)
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.CLIENT_URL || 'https://helloonebahrain.com');
    
    const redirectUrl = new URL('/pay/benefit/error', baseUrl);
    redirectUrl.searchParams.set('orderId', orderId);

    // Include error details if available
    if (trandataParam) {
      redirectUrl.searchParams.set('trandata', trandataParam);
    }
    if (errorText) {
      redirectUrl.searchParams.set('ErrorText', errorText);
    }
    if (errorParam) {
      redirectUrl.searchParams.set('Error', errorParam);
    }

    // Use 303 redirect to change POST to GET
    return NextResponse.redirect(redirectUrl, 303);
  } catch (error: any) {
    console.error('[BENEFIT Callback Error] Error:', error);
    // Redirect to error page
    const orderId = request.nextUrl.searchParams.get('orderId') || 'unknown';
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : (process.env.CLIENT_URL || 'https://helloonebahrain.com');
    return NextResponse.redirect(new URL(`/pay/benefit/error?orderId=${orderId}&error=server`, baseUrl), 303);
  }
}

/**
 * GET /api/payments/benefit/callback-error
 * Fallback for GET requests (shouldn't happen, but handle gracefully)
 */
export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId') || 'unknown';
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : (process.env.CLIENT_URL || 'https://helloonebahrain.com');
  return NextResponse.redirect(new URL(`/pay/benefit/error?orderId=${orderId}`, baseUrl), 303);
}

