/**
 * BENEFIT Payment Gateway - Trandata Builder Module
 * 
 * Builds the plain trandata JSON structure as per BENEFIT specifications
 */

export interface BuildTrandataParams {
  amt: string | number;              // Amount (e.g., "5.000" for BHD)
  trackId: string;                   // Order reference (numeric preferred)
  responseURL: string;               // Success callback URL
  errorURL: string;                  // Error callback URL
  tranportalId: string;              // Tranportal ID from environment
  tranportalPassword: string;        // Tranportal password from environment
  udf1?: string;                     // User defined field 1 (keep empty per docs)
  udf2?: string;                     // User defined field 2 (optional)
  udf3?: string;                     // User defined field 3 (optional)
  udf4?: string;                     // User defined field 4 (optional)
  udf5?: string;                     // User defined field 5 (optional)
}

/**
 * Build plain trandata JSON string for BENEFIT gateway
 * 
 * @param params - Transaction parameters
 * @returns JSON stringified array: [{ ...fields... }]
 * 
 * Format per BENEFIT specification:
 * - Must be a JSON array with single object
 * - Field order may matter (follow documentation)
 * - udf1 should be empty string (per recommendation)
 * - currencycode = "048" for BHD
 * - action = "1" for purchase
 */
export function buildPlainTrandata(params: BuildTrandataParams): string {
  // Format amount to 3 decimal places for BHD
  const formattedAmount = typeof params.amt === 'number' 
    ? params.amt.toFixed(3) 
    : parseFloat(params.amt).toFixed(3);

  // Build trandata object per BENEFIT specification
  const trandataObject = {
    id: params.tranportalId,           // Tranportal ID
    password: params.tranportalPassword, // Tranportal password
    action: "1",                       // Action: 1 = Purchase
    amt: formattedAmount,              // Amount with 3 decimals
    currencycode: "048",               // Currency code: 048 = BHD (Bahraini Dinar)
    trackId: params.trackId,           // Order reference/tracking ID
    udf1: params.udf1 || "",           // User defined field 1 (keep empty per docs)
    udf2: params.udf2 || "",           // User defined field 2
    udf3: params.udf3 || "",           // User defined field 3
    udf4: params.udf4 || "",           // User defined field 4
    udf5: params.udf5 || "",           // User defined field 5
    responseURL: params.responseURL,   // Success callback URL
    errorURL: params.errorURL,         // Error callback URL
  };

  // Return as JSON array with single object (BENEFIT requirement)
  const trandataArray = [trandataObject];

  return JSON.stringify(trandataArray);
}

/**
 * Validate trandata parameters before building
 * 
 * @param params - Parameters to validate
 * @returns true if valid, throws error if invalid
 */
export function validateTrandataParams(params: BuildTrandataParams): boolean {
  // Validate required fields
  if (!params.amt || parseFloat(params.amt.toString()) <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (!params.trackId || params.trackId.trim() === '') {
    throw new Error('trackId is required');
  }

  if (!params.responseURL || !isValidUrl(params.responseURL)) {
    throw new Error('Valid responseURL is required');
  }

  if (!params.errorURL || !isValidUrl(params.errorURL)) {
    throw new Error('Valid errorURL is required');
  }

  if (!params.tranportalId || params.tranportalId.trim() === '') {
    throw new Error('Tranportal ID is required');
  }

  if (!params.tranportalPassword || params.tranportalPassword.trim() === '') {
    throw new Error('Tranportal password is required');
  }

  // Validate URL lengths (BENEFIT requirement: ≤254 characters)
  if (params.responseURL.length > 254) {
    throw new Error(`responseURL too long (${params.responseURL.length} chars, max 254)`);
  }

  if (params.errorURL.length > 254) {
    throw new Error(`errorURL too long (${params.errorURL.length} chars, max 254)`);
  }

  // Warn if trackId is not numeric (recommended by BENEFIT)
  if (!/^\d+$/.test(params.trackId)) {
    console.warn('[BENEFIT Trandata] Warning: trackId is not numeric. Numeric IDs are recommended.');
  }

  return true;
}

/**
 * Helper: Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be http or https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // Must be absolute URL (has hostname)
    if (!parsed.hostname) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse response trandata from BENEFIT gateway
 * 
 * @param trandataJson - JSON string from BENEFIT (decrypted)
 * @returns Parsed trandata object
 */
export interface BenefitResponseData {
  result?: string;              // Transaction result (e.g., "CAPTURED")
  amt?: string;                 // Amount
  trackId?: string;             // Order reference
  paymentId?: string;           // Payment ID from BENEFIT
  transId?: string;             // Transaction ID
  ref?: string;                 // Reference number
  authRespCode?: string;        // Authorization response code (00 = approved)
  postdate?: string;            // Post date
  tranid?: string;              // Transaction ID (alternative field)
  auth?: string;                // Authorization code
  avr?: string;                 // AVR code
  udf1?: string;                // User defined field 1
  udf2?: string;                // User defined field 2
  udf3?: string;                // User defined field 3
  udf4?: string;                // User defined field 4
  udf5?: string;                // User defined field 5
  [key: string]: any;           // Allow other fields
}

/**
 * Parse response trandata JSON
 * 
 * @param trandataJson - Decrypted trandata JSON string
 * @returns Parsed response data object
 */
export function parseResponseTrandata(trandataJson: string): BenefitResponseData {
  try {
    const parsed = JSON.parse(trandataJson);

    // BENEFIT returns array with single object
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0] as BenefitResponseData;
    }

    // Fallback: if it's already an object
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as BenefitResponseData;
    }

    throw new Error('Invalid trandata format: expected array or object');
  } catch (error: any) {
    console.error('[BENEFIT Trandata] Parse error:', error.message);
    throw new Error(`Failed to parse response trandata: ${error.message}`);
  }
}

/**
 * Check if transaction was successful
 * 
 * @param responseData - Parsed response data
 * @returns true if successful, false otherwise
 */
export function isTransactionSuccessful(responseData: BenefitResponseData): boolean {
  // Check result field (common success values: "CAPTURED", "SUCCESS", "APPROVED")
  const result = responseData.result?.toUpperCase();
  if (result === 'CAPTURED' || result === 'SUCCESS' || result === 'APPROVED') {
    return true;
  }

  // Check authRespCode (00 = approved)
  if (responseData.authRespCode === '00') {
    return true;
  }

  return false;
}

/**
 * Get error message from response data
 * 
 * @param responseData - Parsed response data
 * @returns Error message or default message
 */
export function getErrorMessage(responseData: BenefitResponseData): string {
  if (responseData.result) {
    return `Transaction ${responseData.result}`;
  }

  if (responseData.authRespCode && responseData.authRespCode !== '00') {
    return `Authorization failed (Code: ${responseData.authRespCode})`;
  }

  return 'Transaction failed';
}

