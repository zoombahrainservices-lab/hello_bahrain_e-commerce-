/**
 * BenefitPay Wallet Configuration
 * 
 * This module handles wallet-specific configuration independently from Payment Gateway.
 * NEVER mix wallet credentials with PG credentials.
 */

export interface WalletCredentials {
  merchantId: string;
  appId: string;
  secretKey: string;
  clientId?: string;
  checkStatusUrl: string;
}

/**
 * Validates and returns BenefitPay Wallet credentials.
 * 
 * STRICT MODE: Only accepts BENEFITPAY_WALLET_* environment variables.
 * No fallbacks to BENEFIT_TRANPORTAL_*, BENEFIT_RESOURCE_KEY, or EAZYPAY_* variables.
 * 
 * @throws Error if any required wallet credential is missing
 * @returns WalletCredentials object with all required fields
 */
export function validateWalletCredentials(): WalletCredentials {
  const merchantId = process.env.BENEFITPAY_WALLET_MERCHANT_ID;
  const appId = process.env.BENEFITPAY_WALLET_APP_ID;
  const secretKey = process.env.BENEFITPAY_WALLET_SECRET_KEY;
  const clientId = process.env.BENEFITPAY_WALLET_CLIENT_ID; // Optional
  const checkStatusUrl = process.env.BENEFITPAY_WALLET_CHECK_STATUS_URL || 
    'https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status';

  // Log credential sources (for debugging)
  console.log('[BenefitPay Wallet Config] Credential check:', {
    merchantId: merchantId || 'MISSING',
    appId: appId || 'MISSING',
    secretKey: secretKey ? 'SET' : 'MISSING',
    clientId: clientId || 'NOT SET (optional)',
    checkStatusUrl,
    source: 'BENEFITPAY_WALLET_* environment variables only',
  });

  // Strict validation - no fallbacks allowed
  const missing: string[] = [];
  if (!merchantId) missing.push('BENEFITPAY_WALLET_MERCHANT_ID');
  if (!appId) missing.push('BENEFITPAY_WALLET_APP_ID');
  if (!secretKey) missing.push('BENEFITPAY_WALLET_SECRET_KEY');

  if (missing.length > 0) {
    const errorMsg = `BenefitPay Wallet credentials are missing or invalid: ${missing.join(', ')}. ` +
      'Please set the following environment variables in .env.local:\n' +
      '  BENEFITPAY_WALLET_MERCHANT_ID=3186\n' +
      '  BENEFITPAY_WALLET_APP_ID=1988588907\n' +
      '  BENEFITPAY_WALLET_SECRET_KEY=<your_wallet_secret>\n' +
      '  BENEFITPAY_WALLET_CHECK_STATUS_URL=https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status (optional)\n' +
      '  BENEFITPAY_WALLET_CLIENT_ID=<your_client_id> (optional)';
    
    console.error('[BenefitPay Wallet Config] ERROR:', errorMsg);
    throw new Error(errorMsg);
  }

  // Validate expected values
  if (merchantId !== '3186') {
    console.warn('[BenefitPay Wallet Config] WARNING: Unexpected Merchant ID:', merchantId, '(expected: 3186)');
  }
  if (appId !== '1988588907') {
    console.warn('[BenefitPay Wallet Config] WARNING: Unexpected App ID:', appId, '(expected: 1988588907)');
  }
  if (secretKey.length !== 45) {
    console.warn('[BenefitPay Wallet Config] WARNING: Secret key length is', secretKey.length, '(expected: 45 chars)');
  }

  console.log('[BenefitPay Wallet Config] ✓ All required credentials present');
  console.log('[BenefitPay Wallet Config] ✓ merchantId:', merchantId);
  console.log('[BenefitPay Wallet Config] ✓ appId:', appId);
  console.log('[BenefitPay Wallet Config] ✓ secretKey: SET (length:', secretKey.length, ')');
  console.log('[BenefitPay Wallet Config] ✓ checkStatusUrl:', checkStatusUrl);

  return {
    merchantId,
    appId,
    secretKey,
    clientId,
    checkStatusUrl,
  };
}

/**
 * Returns whether wallet credentials are properly configured.
 * Useful for conditional feature enabling.
 */
export function isWalletConfigured(): boolean {
  try {
    validateWalletCredentials();
    return true;
  } catch (error) {
    return false;
  }
}

