/**
 * BenefitPay Wallet - Signing Utilities
 * 
 * Centralized HMAC-SHA256 signature generation for:
 * 1. SDK initialization (secure_hash)
 * 2. Status check API calls (X-FOO-Signature)
 * 
 * Security: This file MUST only be used server-side.
 */

import crypto from 'crypto';

/**
 * Generates HMAC-SHA256 signature for BenefitPay Wallet
 * 
 * Algorithm:
 * 1. Filter out 'lang', 'hashedString', and 'secure_hash' from params
 * 2. Convert all values to strings
 * 3. Sort by key (alphabetically), then by value (alphabetically)
 * 4. Format as: key="value",key2="value2",...
 * 5. Generate HMAC-SHA256 hash using secret key
 * 6. Encode as Base64
 * 
 * @param params - Request parameters (all values will be converted to strings)
 * @param secretKey - BenefitPay secret key
 * @param debugMode - If true, log detailed hash calculation info (never logs secret)
 * @returns Base64-encoded HMAC-SHA256 signature
 */
function generateSignature(
  params: Record<string, string | number>,
  secretKey: string,
  debugMode = false
): string {
  // Step 1: Filter out excluded fields
  const excludedFields = ['lang', 'hashedString', 'secure_hash'];
  const filteredParams = Object.entries(params)
    .filter(([key]) => !excludedFields.includes(key));

  // Step 2: Convert all values to strings and trim
  const stringParams = filteredParams.map(([key, value]) => [
    key.trim(),
    String(value).trim()
  ] as [string, string]);

  // Step 3: Sort by key first, then by value
  const sortedParams = stringParams.sort((a, b) => {
    const keyCompare = a[0].localeCompare(b[0]);
    if (keyCompare !== 0) return keyCompare;
    return a[1].localeCompare(b[1]);
  });

  // Step 4: Format as key="value",key2="value2",...
  // CRITICAL: Must use double quotes, no spaces, comma-separated
  const requestString = sortedParams
    .map(([key, value]) => `${key}="${value}"`)
    .join(',');

  // Debug logging (if enabled)
  if (debugMode || process.env.BENEFITPAY_DEBUG === 'true') {
    console.log('[BenefitPay Signing] Hash calculation:');
    console.log('[BenefitPay Signing] - Original params count:', Object.keys(params).length);
    console.log('[BenefitPay Signing] - After filtering:', sortedParams.length);
    console.log('[BenefitPay Signing] - Sorted keys:', sortedParams.map(([key]) => key).join(', '));
    console.log('[BenefitPay Signing] - Hash input string:', requestString);
    console.log('[BenefitPay Signing] - Hash input length:', requestString.length);
    console.log('[BenefitPay Signing] - Secret key length:', secretKey.length);
    // NEVER log the actual secret key
  }

  // Step 5 & 6: Generate HMAC-SHA256 and encode as Base64
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(requestString);
  const hash = hmac.digest('base64');

  if (debugMode || process.env.BENEFITPAY_DEBUG === 'true') {
    console.log('[BenefitPay Signing] - Generated hash length:', hash.length);
    console.log('[BenefitPay Signing] - Generated hash (first 20 chars):', hash.substring(0, 20) + '...');
  }

  return hash;
}

/**
 * Generates secure_hash for BenefitPay Wallet SDK initialization
 * 
 * Use this for the InApp.open() SDK call.
 * 
 * @param sdkParams - SDK parameters (merchantId, appId, transactionAmount, etc.)
 * @param secretKey - BenefitPay wallet secret key
 * @returns Base64-encoded secure_hash
 */
export function generateSecureHashForSdk(
  sdkParams: Record<string, string | number>,
  secretKey: string
): string {
  console.log('[BenefitPay Wallet SDK] Generating secure_hash for SDK parameters');
  
  // Validate required fields
  const requiredFields = ['merchantId', 'appId', 'transactionAmount', 'transactionCurrency', 'referenceNumber'];
  const missingFields = requiredFields.filter(field => !sdkParams[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required SDK parameters: ${missingFields.join(', ')}`);
  }

  const hash = generateSignature(sdkParams, secretKey, true);
  console.log('[BenefitPay Wallet SDK] ✓ secure_hash generated successfully');
  
  return hash;
}

/**
 * Generates X-FOO-Signature for BenefitPay check-status API calls
 * 
 * Use this for the check-status API request header.
 * 
 * @param statusParams - Status check parameters (merchant_id, reference_id)
 * @param secretKey - BenefitPay wallet secret key
 * @returns Base64-encoded X-FOO-Signature
 */
export function generateSignatureForStatus(
  statusParams: Record<string, string | number>,
  secretKey: string
): string {
  console.log('[BenefitPay Wallet Status] Generating X-FOO-Signature for status check');
  
  // Validate required fields
  const requiredFields = ['merchant_id', 'reference_id'];
  const missingFields = requiredFields.filter(field => !statusParams[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required status check parameters: ${missingFields.join(', ')}`);
  }

  const signature = generateSignature(statusParams, secretKey, true);
  console.log('[BenefitPay Wallet Status] ✓ X-FOO-Signature generated successfully');
  
  return signature;
}

/**
 * Validates signature format
 * @param signature - Base64 signature to validate
 * @returns true if valid Base64 format
 */
export function isValidSignature(signature: string): boolean {
  // Base64 pattern (with optional padding)
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Pattern.test(signature) && signature.length > 0;
}

