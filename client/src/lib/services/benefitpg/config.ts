/**
 * BenefitPay Payment Gateway (PG) Configuration
 * 
 * This module handles PG-specific configuration independently from Wallet.
 * NEVER mix PG credentials with wallet credentials.
 */

export interface PGCredentials {
  tranportalId: string;
  tranportalPassword: string;
  resourceKey: string;
  endpoint: string;
}

/**
 * Validates and returns BenefitPay Payment Gateway credentials.
 * 
 * Only accepts BENEFIT_TRANPORTAL_* and BENEFIT_RESOURCE_KEY environment variables.
 * 
 * @throws Error if any required PG credential is missing
 * @returns PGCredentials object with all required fields
 */
export function validatePGCredentials(): PGCredentials {
  const tranportalId = process.env.BENEFIT_TRANPORTAL_ID;
  const tranportalPassword = process.env.BENEFIT_TRANPORTAL_PASSWORD;
  const resourceKey = process.env.BENEFIT_RESOURCE_KEY;
  const endpoint = process.env.BENEFIT_ENDPOINT || 'https://test.benefit-gateway.bh/payment/API/hosted.htm';

  // Log credential sources (for debugging)
  console.log('[BenefitPay PG Config] Credential check:', {
    tranportalId: tranportalId || 'MISSING',
    tranportalPassword: tranportalPassword ? 'SET' : 'MISSING',
    resourceKey: resourceKey ? 'SET' : 'MISSING',
    endpoint,
    source: 'BENEFIT_* environment variables only',
  });

  // Strict validation - no fallbacks
  const missing: string[] = [];
  if (!tranportalId) missing.push('BENEFIT_TRANPORTAL_ID');
  if (!tranportalPassword) missing.push('BENEFIT_TRANPORTAL_PASSWORD');
  if (!resourceKey) missing.push('BENEFIT_RESOURCE_KEY');

  if (missing.length > 0) {
    const errorMsg = `BenefitPay Payment Gateway credentials are missing or invalid: ${missing.join(', ')}. ` +
      'Please set the following environment variables in .env.local:\n' +
      '  BENEFIT_TRANPORTAL_ID=<your_tranportal_id>\n' +
      '  BENEFIT_TRANPORTAL_PASSWORD=<your_tranportal_password>\n' +
      '  BENEFIT_RESOURCE_KEY=<your_resource_key>\n' +
      '  BENEFIT_ENDPOINT=https://test.benefit-gateway.bh/payment/API/hosted.htm (optional)';
    
    console.error('[BenefitPay PG Config] ERROR:', errorMsg);
    throw new Error(errorMsg);
  }

  // At this point, TypeScript knows all values are defined, but we need to assert for type narrowing
  // We've already validated above, so these are guaranteed to be strings
  const validatedTranportalId = tranportalId as string;
  const validatedTranportalPassword = tranportalPassword as string;
  const validatedResourceKey = resourceKey as string;

  console.log('[BenefitPay PG Config] ✓ All required credentials present');
  console.log('[BenefitPay PG Config] ✓ tranportalId:', validatedTranportalId);
  console.log('[BenefitPay PG Config] ✓ tranportalPassword: SET');
  console.log('[BenefitPay PG Config] ✓ resourceKey: SET (length:', validatedResourceKey.length, ')');
  console.log('[BenefitPay PG Config] ✓ endpoint:', endpoint);

  return {
    tranportalId: validatedTranportalId,
    tranportalPassword: validatedTranportalPassword,
    resourceKey: validatedResourceKey,
    endpoint,
  };
}

/**
 * Returns whether PG credentials are properly configured.
 * Useful for conditional feature enabling.
 */
export function isPGConfigured(): boolean {
  try {
    validatePGCredentials();
    return true;
  } catch (error) {
    return false;
  }
}

