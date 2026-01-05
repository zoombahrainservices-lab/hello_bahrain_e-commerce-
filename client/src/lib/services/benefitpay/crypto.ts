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
  // - TRANPORTAL_PASSWORD -> appId (MUST be different from merchantId)
  // - RESOURCE_KEY -> secretKey
  const tranportalId = process.env.BENEFIT_TRANPORTAL_ID;
  const tranportalPassword = process.env.BENEFIT_TRANPORTAL_PASSWORD;
  const resourceKey = process.env.BENEFIT_RESOURCE_KEY;
  const benefitEndpoint = process.env.BENEFIT_ENDPOINT;
  const eazypayMerchantId = process.env.EAZYPAY_MERCHANT_ID; // EazyPay merchant ID (3186)
  const eazypayCheckoutAppId = process.env.EAZYPAY_CHECKOUT_APP_ID; // EazyPay checkout app ID (1988588907)
  
  // Try wallet-specific credentials first, then EazyPay merchant ID, then fallback to PG credentials
  // Priority: BENEFITPAY_WALLET_MERCHANT_ID > EAZYPAY_MERCHANT_ID > BENEFIT_TRANPORTAL_ID
  const merchantId = process.env.BENEFITPAY_WALLET_MERCHANT_ID || eazypayMerchantId || tranportalId;
  
  // App ID priority: BENEFITPAY_WALLET_APP_ID > EAZYPAY_CHECKOUT_APP_ID > BENEFIT_TRANPORTAL_PASSWORD > hardcoded fallback
  // CRITICAL: Must use EAZYPAY_CHECKOUT_APP_ID=1988588907, NOT BENEFIT_TRANPORTAL_PASSWORD=30021462
  let appId = process.env.BENEFITPAY_WALLET_APP_ID || eazypayCheckoutAppId || tranportalPassword;
  // If appId is missing or same as merchantId, use the correct App ID: 1988588907
  if (!appId || appId === merchantId) {
    console.warn('[BenefitPay Wallet] App ID is missing or same as Merchant ID. Using correct App ID: 1988588907');
    appId = '1988588907';
  }
  const secretKey = process.env.BENEFITPAY_WALLET_SECRET_KEY || resourceKey;
  const clientId = process.env.BENEFITPAY_WALLET_CLIENT_ID; // Optional
  
  // Check-status URL: Use wallet-specific, or correct test URL, or construct from endpoint
  // CRITICAL: Must use https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status
  const checkStatusUrl = process.env.BENEFITPAY_WALLET_CHECK_STATUS_URL || 
    'https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status';

  // Log which credentials are being used (for debugging)
  console.log('[BenefitPay Wallet] Credentials source:', {
    merchantId: merchantId || 'MISSING',
    appId: appId || 'MISSING',
    secretKey: secretKey ? 'SET' : 'MISSING',
    checkStatusUrl: checkStatusUrl || 'MISSING',
    envVars: {
      BENEFIT_TRANPORTAL_ID: tranportalId || 'NOT SET',
      BENEFIT_TRANPORTAL_PASSWORD: tranportalPassword ? 'SET' : 'NOT SET',
      BENEFIT_RESOURCE_KEY: resourceKey ? 'SET' : 'NOT SET',
      EAZYPAY_MERCHANT_ID: eazypayMerchantId || 'NOT SET',
      EAZYPAY_CHECKOUT_APP_ID: eazypayCheckoutAppId || 'NOT SET (SHOULD BE 1988588907!)',
      BENEFITPAY_WALLET_APP_ID: process.env.BENEFITPAY_WALLET_APP_ID || 'NOT SET',
    },
    usingWalletSpecific: {
      merchantId: !!process.env.BENEFITPAY_WALLET_MERCHANT_ID,
      appId: !!process.env.BENEFITPAY_WALLET_APP_ID,
      secretKey: !!process.env.BENEFITPAY_WALLET_SECRET_KEY,
    },
    usingEazyPayCredentials: {
      merchantId: !process.env.BENEFITPAY_WALLET_MERCHANT_ID && !!eazypayMerchantId,
      appId: !process.env.BENEFITPAY_WALLET_APP_ID && !!eazypayCheckoutAppId,
    },
    usingPGFallback: {
      merchantId: !process.env.BENEFITPAY_WALLET_MERCHANT_ID && !eazypayMerchantId && !!tranportalId,
      appId: !process.env.BENEFITPAY_WALLET_APP_ID && !eazypayCheckoutAppId && !!tranportalPassword,
      secretKey: !process.env.BENEFITPAY_WALLET_SECRET_KEY && !!resourceKey,
    },
  });
  
  // Critical validation: App ID must be 1988588907
  if (appId !== '1988588907') {
    console.error('[BenefitPay Wallet] CRITICAL ERROR: App ID is', appId, 'but should be 1988588907!');
    console.error('[BenefitPay Wallet] Set EAZYPAY_CHECKOUT_APP_ID=1988588907 in .env.local');
  }
  
  // Critical validation: Merchant ID should be 3186
  if (merchantId !== '3186' && merchantId !== eazypayMerchantId) {
    console.warn('[BenefitPay Wallet] WARNING: Merchant ID is', merchantId, 'expected 3186 from EAZYPAY_MERCHANT_ID');
  }
  
  // Warn if appId is missing or same as merchantId
  if (!appId) {
    console.error('[BenefitPay Wallet] ERROR: App ID is missing!');
    console.error('[BenefitPay Wallet] Set BENEFIT_TRANPORTAL_PASSWORD=1988588907 in .env.local');
  } else if (appId === merchantId) {
    console.warn('[BenefitPay Wallet] WARNING: App ID is same as Merchant ID!');
    console.warn('[BenefitPay Wallet] App ID should be different. Set BENEFIT_TRANPORTAL_PASSWORD=1988588907 in .env.local');
  }

  if (!merchantId || !appId || !secretKey) {
    const missing = [];
    if (!merchantId) missing.push('BENEFITPAY_WALLET_MERCHANT_ID or BENEFIT_TRANPORTAL_ID');
    if (!appId) {
      missing.push('BENEFITPAY_WALLET_APP_ID or BENEFIT_TRANPORTAL_PASSWORD (App ID: 1988588907)');
      console.error('[BenefitPay Wallet] App ID is missing! Set BENEFIT_TRANPORTAL_PASSWORD=1988588907 in .env.local');
    }
    if (!secretKey) missing.push('BENEFITPAY_WALLET_SECRET_KEY or BENEFIT_RESOURCE_KEY');
    
    throw new Error(
      `Missing required BenefitPay Wallet credentials: ${missing.join(', ')}. ` +
      'Please set BENEFIT_TRANPORTAL_ID, BENEFIT_TRANPORTAL_PASSWORD (App ID: 1988588907), and BENEFIT_RESOURCE_KEY, ' +
      'or set wallet-specific credentials (BENEFITPAY_WALLET_*).'
    );
  }

  // Check-status URL is already set above
  // Using: https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status

  return {
    merchantId,
    appId,
    secretKey,
    clientId,
    checkStatusUrl,
  };
}

