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
import { validateWalletCredentials } from '@/lib/services/benefitpay_wallet/config';
import { generateSecureHashForSdk } from '@/lib/services/benefitpay_wallet/signing';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

interface InitWalletRequest {
  sessionId: string;
  showResult?: boolean;
  hideMobileQR?: boolean;
  qr_timeout?: number; // In milliseconds (default: 150000 = 2.5 minutes)
}

// QR timeout constraints (in milliseconds)
const MIN_QR_TIMEOUT = 60000;  // 1 minute
const MAX_QR_TIMEOUT = 300000; // 5 minutes
const DEFAULT_QR_TIMEOUT = 150000; // 2.5 minutes

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
    let { sessionId, showResult = true, hideMobileQR = false, qr_timeout } = body;

    // Validate and enforce QR timeout constraints
    if (qr_timeout === undefined || qr_timeout === null) {
      qr_timeout = DEFAULT_QR_TIMEOUT;
      console.log('[BenefitPay Wallet Init] Using default qr_timeout:', qr_timeout, 'ms (2.5 minutes)');
    } else if (qr_timeout < MIN_QR_TIMEOUT) {
      console.warn('[BenefitPay Wallet Init] qr_timeout too low:', qr_timeout, 'ms. Enforcing minimum:', MIN_QR_TIMEOUT, 'ms');
      qr_timeout = MIN_QR_TIMEOUT;
    } else if (qr_timeout > MAX_QR_TIMEOUT) {
      console.warn('[BenefitPay Wallet Init] qr_timeout too high:', qr_timeout, 'ms. Enforcing maximum:', MAX_QR_TIMEOUT, 'ms');
      qr_timeout = MAX_QR_TIMEOUT;
    }

    console.log('[BenefitPay Wallet Init] Starting initialization:', {
      sessionId,
      userId: authResult.user.id,
      qr_timeout_ms: qr_timeout,
      qr_timeout_minutes: (qr_timeout / 60000).toFixed(1),
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

    // Check if this is a retry (session already has a reference number)
    const currentAttempt = session.reference_attempt || 0;
    const isRetry = currentAttempt > 0;
    const newAttempt = currentAttempt + 1;

    // Generate unique reference number with attempt counter
    // Format: HB_<sessionId_no_dashes>_<attempt>_<timestamp>
    // This ensures uniqueness even if user retries multiple times
    const referenceNumber = `HB_${sessionId.replace(/-/g, '').substring(0, 18)}_${newAttempt}_${Date.now()}`;

    console.log('[BenefitPay Wallet Init] Reference number generation:', {
      isRetry,
      currentAttempt,
      newAttempt,
      referenceNumber,
      previousReference: session.reference_number || 'none',
    });

    // Build SDK parameters
    // CRITICAL: All values MUST be strings for correct hash calculation
    // Expected format: appId="1988588907",merchantId="3186",referenceNumber="HB_xxx",transactionAmount="2.000",transactionCurrency="BHD"
    const sdkParams: Record<string, string> = {
      merchantId: String(credentials.merchantId).trim(),
      appId: String(credentials.appId).trim(),
      transactionAmount: Number(session.total).toFixed(3), // BHD format with exactly 3 decimals
      transactionCurrency: 'BHD', // Must be exactly "BHD" (uppercase)
      referenceNumber: String(referenceNumber).trim(),
      showResult: showResult ? '1' : '0', // Must be string "1" or "0", not boolean
      hideMobileQR: hideMobileQR ? '1' : '0', // Must be string "1" or "0", not boolean
      qr_timeout: String(qr_timeout), // Must be string, not number
    };

    // Validate all parameters are strings and not empty
    const invalidParams: string[] = [];
    Object.entries(sdkParams).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        invalidParams.push(`${key} is not a string (type: ${typeof value})`);
      } else if (value.trim() === '') {
        invalidParams.push(`${key} is empty`);
      }
    });

    if (invalidParams.length > 0) {
      const errorMsg = `SDK parameter validation failed: ${invalidParams.join(', ')}`;
      console.error('[BenefitPay Wallet Init] ERROR:', errorMsg);
      throw new Error(errorMsg);
    }

    // Comprehensive parameter logging and validation
    console.log('[BenefitPay Wallet Init] SDK parameters (validated, ready for hash):');
    console.log('[BenefitPay Wallet Init] - merchantId:', sdkParams.merchantId, '(type:', typeof sdkParams.merchantId, ')');
    console.log('[BenefitPay Wallet Init] - appId:', sdkParams.appId, '(type:', typeof sdkParams.appId, ')');
    console.log('[BenefitPay Wallet Init] - transactionAmount:', sdkParams.transactionAmount, '(type:', typeof sdkParams.transactionAmount, ')');
    console.log('[BenefitPay Wallet Init] - transactionCurrency:', sdkParams.transactionCurrency, '(type:', typeof sdkParams.transactionCurrency, ')');
    console.log('[BenefitPay Wallet Init] - referenceNumber:', sdkParams.referenceNumber, '(type:', typeof sdkParams.referenceNumber, ')');
    console.log('[BenefitPay Wallet Init] - showResult:', sdkParams.showResult, '(type:', typeof sdkParams.showResult, ')');
    console.log('[BenefitPay Wallet Init] - hideMobileQR:', sdkParams.hideMobileQR, '(type:', typeof sdkParams.hideMobileQR, ')');
    console.log('[BenefitPay Wallet Init] - qr_timeout:', sdkParams.qr_timeout, '(type:', typeof sdkParams.qr_timeout, ')');
    
    // Critical value validations
    if (sdkParams.merchantId !== '3186') {
      console.error('[BenefitPay Wallet Init] CRITICAL: merchantId is', sdkParams.merchantId, 'but MUST be "3186"');
      throw new Error(`Invalid merchantId: ${sdkParams.merchantId}. Expected: "3186"`);
    }
    if (sdkParams.appId !== '1988588907') {
      console.error('[BenefitPay Wallet Init] CRITICAL: appId is', sdkParams.appId, 'but MUST be "1988588907"');
      throw new Error(`Invalid appId: ${sdkParams.appId}. Expected: "1988588907"`);
    }
    if (sdkParams.transactionCurrency !== 'BHD') {
      console.error('[BenefitPay Wallet Init] CRITICAL: transactionCurrency is', sdkParams.transactionCurrency, 'but MUST be "BHD"');
      throw new Error(`Invalid transactionCurrency: ${sdkParams.transactionCurrency}. Expected: "BHD"`);
    }
    if (!/^\d+\.\d{3}$/.test(sdkParams.transactionAmount)) {
      console.error('[BenefitPay Wallet Init] CRITICAL: transactionAmount format is invalid:', sdkParams.transactionAmount);
      throw new Error(`Invalid transactionAmount format: ${sdkParams.transactionAmount}. Expected: "X.XXX" (3 decimals)`);
    }

    console.log('[BenefitPay Wallet Init] ✓ All SDK parameters validated successfully');

    // Generate secure hash server-side using centralized signing utility
    // The hash calculation will exclude 'secure_hash', 'lang', and 'hashedString' from the calculation
    const secureHash = generateSecureHashForSdk(sdkParams, credentials.secretKey);

    // Add hash to parameters (secure_hash is NOT included in hash calculation itself)
    // Explicitly type to ensure TypeScript recognizes all properties
    const signedParams: Record<string, string> = {
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

    // Store reference number and attempt counter in checkout session for later verification
    const { error: updateError } = await getSupabase()
      .from('checkout_sessions')
      .update({
        benefit_track_id: referenceNumber, // Legacy field for backward compatibility
        reference_number: referenceNumber, // New field for reference tracking
        reference_attempt: newAttempt,
        last_reference_at: new Date().toISOString(),
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

