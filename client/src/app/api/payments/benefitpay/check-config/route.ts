/**
 * BenefitPay Wallet - Configuration Check
 * 
 * This endpoint checks if BenefitPay Wallet is properly configured.
 * It's safe to call from the client as it doesn't expose sensitive credentials.
 * 
 * Returns:
 * - configured: boolean - whether wallet is ready to use
 * - missing: string[] - list of missing environment variables (if not configured)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cors } from '@/lib/cors';
import { isWalletConfigured, validateWalletCredentials } from '@/lib/services/benefitpay_wallet/config';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * GET /api/payments/benefitpay/check-config
 * 
 * Returns the configuration status of BenefitPay Wallet.
 * Does not require authentication - this is a public endpoint.
 */
export async function GET(request: NextRequest) {
  try {
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    console.log('[BenefitPay Config Check] Checking wallet configuration...');

    // Check if wallet is configured
    const configured = isWalletConfigured();

    if (configured) {
      console.log('[BenefitPay Config Check] ✓ Wallet is configured');
      return cors.addHeaders(
        NextResponse.json({
          configured: true,
          missing: [],
        }),
        request
      );
    }

    // If not configured, try to get the missing variables
    const missing: string[] = [];
    try {
      validateWalletCredentials();
    } catch (error: any) {
      // Parse missing env vars from error message
      const match = error.message.match(/missing or invalid: ([^.]+)/);
      if (match) {
        const vars = match[1].split(', ').map((s: string) => s.trim());
        missing.push(...vars);
      }
      
      console.log('[BenefitPay Config Check] ✗ Wallet not configured. Missing:', missing);
    }

    return cors.addHeaders(
      NextResponse.json({
        configured: false,
        missing: missing.length > 0 ? missing : ['Unknown configuration error'],
      }),
      request
    );
  } catch (error: any) {
    console.error('[BenefitPay Config Check] Unexpected error:', error);
    return cors.addHeaders(
      NextResponse.json({
        configured: false,
        missing: ['Error checking configuration'],
        error: error.message,
      }, { status: 500 }),
      request
    );
  }
}


