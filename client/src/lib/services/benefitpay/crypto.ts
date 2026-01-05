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
 * Uses the same BENEFIT credentials as the Payment Gateway
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
  // Use the same BENEFIT credentials as Payment Gateway
  // Map PG credentials to wallet format:
  // - TRANPORTAL_ID -> merchantId
  // - TRANPORTAL_PASSWORD -> appId (or use TRANPORTAL_ID if appId not available)
  // - RESOURCE_KEY -> secretKey
  const tranportalId = process.env.BENEFIT_TRANPORTAL_ID;
  const tranportalPassword = process.env.BENEFIT_TRANPORTAL_PASSWORD;
  const resourceKey = process.env.BENEFIT_RESOURCE_KEY;
  const benefitEndpoint = process.env.BENEFIT_ENDPOINT;
  
  // Try wallet-specific credentials first, fallback to PG credentials
  const merchantId = process.env.BENEFITPAY_WALLET_MERCHANT_ID || tranportalId;
  const appId = process.env.BENEFITPAY_WALLET_APP_ID || tranportalPassword || tranportalId;
  const secretKey = process.env.BENEFITPAY_WALLET_SECRET_KEY || resourceKey;
  const clientId = process.env.BENEFITPAY_WALLET_CLIENT_ID; // Optional
  const checkStatusUrl = process.env.BENEFITPAY_WALLET_CHECK_STATUS_URL || 
    (benefitEndpoint ? `${benefitEndpoint.replace('/web/v1/merchant/transaction/init', '')}/web/v1/merchant/transaction/check-status` : undefined);

  if (!merchantId || !appId || !secretKey) {
    const missing = [];
    if (!merchantId) missing.push('BENEFITPAY_WALLET_MERCHANT_ID or BENEFIT_TRANPORTAL_ID');
    if (!appId) missing.push('BENEFITPAY_WALLET_APP_ID or BENEFIT_TRANPORTAL_PASSWORD');
    if (!secretKey) missing.push('BENEFITPAY_WALLET_SECRET_KEY or BENEFIT_RESOURCE_KEY');
    
    throw new Error(
      `Missing required BenefitPay Wallet credentials: ${missing.join(', ')}. ` +
      'Please set BENEFIT_TRANPORTAL_ID, BENEFIT_TRANPORTAL_PASSWORD, and BENEFIT_RESOURCE_KEY, ' +
      'or set wallet-specific credentials (BENEFITPAY_WALLET_*).'
    );
  }

  // Default check-status URL if not provided
  const defaultCheckStatusUrl = checkStatusUrl || 'https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status';

  return {
    merchantId,
    appId,
    secretKey,
    clientId,
    checkStatusUrl: defaultCheckStatusUrl,
  };
}

