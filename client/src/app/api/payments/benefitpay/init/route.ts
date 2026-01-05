/**
 * BenefitPay Wallet - Initialize Payment
 * 
 * This endpoint initializes a BenefitPay Wallet payment by:
 * 1. Loading the checkout session
 * 2. Generating a unique reference number
 * 3. Creating a signed request for the InApp SDK
 * 4. Returning the signed parameters to the frontend
 * 
 * Security: All signature generation happens server-side only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';
import { 
  generateSecureHash, 
  validateWalletCredentials 
} from '@/lib/services/benefitpay/crypto';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

interface InitWalletRequest {
  sessionId: string;
  showResult?: boolean;
  hideMobileQR?: boolean;
  qr_timeout?: number;
}

/**
 * POST /api/payments/benefitpay/init
 * 
 * Initializes a BenefitPay Wallet payment for a checkout session
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

    const body: InitWalletRequest = await request.json();
    const { sessionId, showResult = true, hideMobileQR = false, qr_timeout = 300 } = body;

    console.log('[BenefitPay Wallet Init] Starting initialization:', {
      sessionId,
      userId: authResult.user.id,
    });

    if (!sessionId) {
      return cors.addHeaders(
        NextResponse.json(
          { message: 'Session ID is required' },
          { status: 400 }
        ),
        request
      );
    }

    // Validate credentials
    let credentials;
    try {
      credentials = validateWalletCredentials();
    } catch (error: any) {
      console.error('[BenefitPay Wallet Init] Credentials validation failed:', error.message);
      return cors.addHeaders(
        NextResponse.json(
          { message: 'BenefitPay Wallet is not properly configured' },
          { status: 500 }
        ),
        request
      );
    }

    // Fetch checkout session
    const { data: session, error: sessionError } = await getSupabase()
      .from('checkout_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', authResult.user.id)
      .single();

    if (sessionError || !session) {
      console.error('[BenefitPay Wallet Init] Session not found:', sessionError?.message);
      return cors.addHeaders(
        NextResponse.json(
          { message: 'Checkout session not found or unauthorized' },
          { status: 404 }
        ),
        request
      );
    }

    // Check if session is still valid
    if (session.status !== 'initiated') {
      console.error('[BenefitPay Wallet Init] Invalid session status:', session.status);
      return cors.addHeaders(
        NextResponse.json(
          { message: `Cannot initialize payment for session with status: ${session.status}` },
          { status: 400 }
        ),
        request
      );
    }

    // Generate unique reference number
    // Format: HB_<sessionId_no_dashes>_<timestamp>
    // This ensures uniqueness even if user retries the same session
    const referenceNumber = `HB_${sessionId.replace(/-/g, '').substring(0, 20)}_${Date.now()}`;

    // Build SDK parameters
    // IMPORTANT: All values must be strings for hash calculation
    // Expected format: appId="1988588907",merchantId="30021462",referenceNumber="HB_xxx",transactionAmount="2.000",transactionCurrency="BHD"
    const sdkParams: Record<string, string> = {
      merchantId: String(credentials.merchantId), // Ensure it's a string
      appId: String(credentials.appId), // Ensure it's a string (should be "1988588907")
      transactionAmount: Number(session.total).toFixed(3), // BHD format with 3 decimals as string "2.000"
      transactionCurrency: 'BHD', // Must be exactly "BHD"
      referenceNumber: referenceNumber, // Unique reference number
      showResult: showResult ? '1' : '0', // String "1" or "0"
      hideMobileQR: hideMobileQR ? '1' : '0', // String "1" or "0"
      qr_timeout: String(qr_timeout), // Convert to string
    };

    // Comprehensive logging before hash calculation
    console.log('[BenefitPay Wallet Init] SDK parameters (before hash):');
    console.log('[BenefitPay Wallet Init] - merchantId:', sdkParams.merchantId, '(expected: 3186 from EAZYPAY_MERCHANT_ID)');
    console.log('[BenefitPay Wallet Init] - appId:', sdkParams.appId, '(should be 1988588907)');
    console.log('[BenefitPay Wallet Init] - transactionAmount:', sdkParams.transactionAmount, '(should be string like "2.000")');
    console.log('[BenefitPay Wallet Init] - transactionCurrency:', sdkParams.transactionCurrency, '(should be exactly "BHD")');
    console.log('[BenefitPay Wallet Init] - referenceNumber:', sdkParams.referenceNumber);
    console.log('[BenefitPay Wallet Init] - showResult:', sdkParams.showResult);
    console.log('[BenefitPay Wallet Init] - hideMobileQR:', sdkParams.hideMobileQR);
    console.log('[BenefitPay Wallet Init] - qr_timeout:', sdkParams.qr_timeout);
    
    // Validate critical values
    const expectedMerchantIds = ['3186', '30021462', process.env.BENEFIT_TRANPORTAL_ID, process.env.EAZYPAY_MERCHANT_ID].filter(Boolean);
    if (!expectedMerchantIds.includes(sdkParams.merchantId)) {
      console.warn('[BenefitPay Wallet Init] WARNING: merchantId might be incorrect. Expected one of:', expectedMerchantIds.join(', '), 'Got:', sdkParams.merchantId);
    } else {
      console.log('[BenefitPay Wallet Init] ✓ merchantId validated:', sdkParams.merchantId);
    }
    if (sdkParams.appId !== '1988588907') {
      console.warn('[BenefitPay Wallet Init] WARNING: appId might be incorrect. Expected: 1988588907');
    }
    if (sdkParams.transactionCurrency !== 'BHD') {
      console.error('[BenefitPay Wallet Init] ERROR: transactionCurrency must be exactly "BHD"');
    }

    // Generate secure hash server-side
    // The hash calculation will exclude 'secure_hash', 'lang', and 'hashedString' from the calculation
    const secureHash = generateSecureHash(sdkParams, credentials.secretKey);

    // Add hash to parameters (secure_hash is NOT included in hash calculation itself)
    const signedParams = {
      ...sdkParams,
      secure_hash: secureHash,
    };

    // Log final parameters being sent to SDK
    console.log('[BenefitPay Wallet Init] Final signed parameters (for SDK):');
    console.log('[BenefitPay Wallet Init] - merchantId:', signedParams.merchantId);
    console.log('[BenefitPay Wallet Init] - appId:', signedParams.appId);
    console.log('[BenefitPay Wallet Init] - transactionAmount:', signedParams.transactionAmount);
    console.log('[BenefitPay Wallet Init] - transactionCurrency:', signedParams.transactionCurrency);
    console.log('[BenefitPay Wallet Init] - referenceNumber:', signedParams.referenceNumber);
    console.log('[BenefitPay Wallet Init] - secure_hash (first 50 chars):', signedParams.secure_hash.substring(0, 50) + '...');

    // Store reference number in checkout session for later verification
    const { error: updateError } = await getSupabase()
      .from('checkout_sessions')
      .update({
        benefit_track_id: referenceNumber, // Reuse this field for reference number
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[BenefitPay Wallet Init] Failed to update session:', updateError);
      return cors.addHeaders(
        NextResponse.json(
          { message: 'Failed to update checkout session' },
          { status: 500 }
        ),
        request
      );
    }

    console.log('[BenefitPay Wallet Init] Successfully generated signed parameters');

    return cors.addHeaders(
      NextResponse.json({
        success: true,
        signedParams,
        referenceNumber,
      }),
      request
    );
  } catch (error: any) {
    console.error('[BenefitPay Wallet Init] Unexpected error:', error);
    return cors.addHeaders(
      NextResponse.json(
        { message: error.message || 'Failed to initialize wallet payment' },
        { status: 500 }
      ),
      request
    );
  }
}

