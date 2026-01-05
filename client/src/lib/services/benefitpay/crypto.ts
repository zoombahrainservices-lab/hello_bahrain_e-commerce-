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
  // Filter out 'lang', 'hashedString', and 'secure_hash' per documentation
  // secure_hash should NOT be included in the hash calculation itself
  const filteredParams = Object.entries(params)
    .filter(([key]) => key !== 'lang' && key !== 'hashedString' && key !== 'secure_hash');

  // Convert all values to strings for consistent hashing
  const stringParams = filteredParams.map(([key, value]) => [key, String(value)] as [string, string]);

  // Sort by key first, then by value (alphabetically)
  const sortedParams = stringParams.sort((a, b) => {
    const keyCompare = a[0].localeCompare(b[0]);
    if (keyCompare !== 0) return keyCompare;
    return a[1].localeCompare(b[1]);
  });

  // Format as key="value",key2="value2",...
  // Expected format: appId="1988588907",merchantId="30021462",referenceNumber="HB_xxx",transactionAmount="2.000",transactionCurrency="BHD"
  const requestString = sortedParams
    .map(([key, value]) => `${key}="${value}"`)
    .join(',');

  // Detailed logging for debugging
  console.log('[BenefitPay Crypto] Hash calculation details:');
  console.log('[BenefitPay Crypto] - Parameters (before filtering):', Object.keys(params));
  console.log('[BenefitPay Crypto] - Parameters (after filtering):', sortedParams.map(([key]) => key));
  console.log('[BenefitPay Crypto] - Exact hash input string:', requestString);
  console.log('[BenefitPay Crypto] - Hash input length:', requestString.length);
  console.log('[BenefitPay Crypto] - Secret key length:', secretKey.length);
  console.log('[BenefitPay Crypto] - Parameter values:', sortedParams.map(([key, value]) => `${key}=${value}`).join(', '));

  // Generate HMAC-SHA256 hash
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(requestString);
  const hash = hmac.digest('base64');

  console.log('[BenefitPay Crypto] - Generated hash (first 50 chars):', hash.substring(0, 50) + '...');
  console.log('[BenefitPay Crypto] - Full hash length:', hash.length);

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
 * DEPRECATED: Use validateWalletCredentials from @/lib/services/benefitpay_wallet/config instead.
 * This function is kept for backward compatibility only.
 * 
 * @throws Error if any required variable is missing
 * @deprecated
 */
export function validateWalletCredentials(): {
  merchantId: string;
  appId: string;
  secretKey: string;
  clientId?: string;
  checkStatusUrl: string;
} {
  // Import the new config module
  const { validateWalletCredentials: validateNew } = require('@/lib/services/benefitpay_wallet/config');
  return validateNew();
}

