/**
 * BenefitPay Wallet - Cryptographic utilities for secure hash generation
 * 
 * Security Note: This file MUST only be used server-side.
 * Never import or use these functions in client-side code.
 */

import crypto from 'crypto';

/**
 * Generates HMAC-SHA256 signature for BenefitPay Wallet SDK requests
 * 
 * Per BenefitPay documentation:
 * 1. Sort all parameters (except 'lang' and 'hashedString') by key and value
 * 2. Format as: key="value",key2="value2",...
 * 3. Generate HMAC-SHA256 hash using secret key
 * 4. Encode result as Base64
 * 
 * @param params - Object containing all request parameters
 * @param secretKey - BenefitPay secret key (from environment variables)
 * @returns Base64-encoded HMAC-SHA256 signature
 */
export function generateSecureHash(
  params: Record<string, string | number>,
  secretKey: string
): string {
  // Filter out 'lang' and 'hashedString' per documentation
  const filteredParams = Object.entries(params)
    .filter(([key]) => key !== 'lang' && key !== 'hashedString');

  // Sort by key first, then by value
  const sortedParams = filteredParams.sort((a, b) => {
    const keyCompare = a[0].localeCompare(b[0]);
    if (keyCompare !== 0) return keyCompare;
    return String(a[1]).localeCompare(String(b[1]));
  });

  // Format as key="value",key2="value2",...
  const requestString = sortedParams
    .map(([key, value]) => `${key}="${value}"`)
    .join(',');

  console.log('[BenefitPay Crypto] Request string for hashing:', requestString);

  // Generate HMAC-SHA256 hash
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(requestString);
  const hash = hmac.digest('base64');

  console.log('[BenefitPay Crypto] Generated hash:', hash.substring(0, 20) + '...');

  return hash;
}

/**
 * Generates signature for BenefitPay check-status API request
 * Uses the same algorithm as generateSecureHash
 * 
 * @param params - Parameters for check-status request
 * @param secretKey - BenefitPay secret key
 * @returns Base64-encoded HMAC-SHA256 signature
 */
export function generateStatusCheckSignature(
  params: Record<string, string | number>,
  secretKey: string
): string {
  return generateSecureHash(params, secretKey);
}

/**
 * Validates that all required environment variables are present
 * 
 * @throws Error if any required variable is missing
 */
export function validateWalletCredentials(): {
  merchantId: string;
  appId: string;
  secretKey: string;
  clientId?: string;
  checkStatusUrl: string;
} {
  const merchantId = process.env.BENEFITPAY_WALLET_MERCHANT_ID;
  const appId = process.env.BENEFITPAY_WALLET_APP_ID;
  const secretKey = process.env.BENEFITPAY_WALLET_SECRET_KEY;
  const clientId = process.env.BENEFITPAY_WALLET_CLIENT_ID; // Optional
  const checkStatusUrl = process.env.BENEFITPAY_WALLET_CHECK_STATUS_URL;

  if (!merchantId || !appId || !secretKey || !checkStatusUrl) {
    const missing = [];
    if (!merchantId) missing.push('BENEFITPAY_WALLET_MERCHANT_ID');
    if (!appId) missing.push('BENEFITPAY_WALLET_APP_ID');
    if (!secretKey) missing.push('BENEFITPAY_WALLET_SECRET_KEY');
    if (!checkStatusUrl) missing.push('BENEFITPAY_WALLET_CHECK_STATUS_URL');
    
    throw new Error(
      `Missing required BenefitPay Wallet credentials: ${missing.join(', ')}. ` +
      'Please set these in your environment variables.'
    );
  }

  return {
    merchantId,
    appId,
    secretKey,
    clientId,
    checkStatusUrl,
  };
}

