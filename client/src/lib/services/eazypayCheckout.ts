import crypto from 'crypto';

/**
 * EazyPay Checkout API Service
 * Handles invoice creation and transaction queries
 * Base URL: https://api.eazy.net/merchant/checkout
 */

const CHECKOUT_BASE_URL = 'https://api.eazy.net/merchant/checkout';

// Signature formula testing mode
// Options: 'all_fields', 'documented', 'alphabetical', 'body_order', 'documented_with_invoice', 'timestamp_only'
const SIGNATURE_FORMULA = process.env.EAZYPAY_SIGNATURE_FORMULA || 'timestamp_only';

/**
 * Enhanced logging function for signature computation
 */
function logSignatureDetails(formula: string, message: string, fields: string[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[EazyPay Signature Debug]', {
      formula,
      messageLength: message.length,
      fieldCount: fields.length,
      fields,
      messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    });
  }
}

interface CreateInvoicePayload {
  currency: string;
  amount: string;
  appId: string;
  invoiceId: string; // Required: Your order/invoice ID
  paymentMethod: string; // Required: e.g., "BENEFITGATEWAY,CREDITCARD,APPLEPAY"
  returnUrl: string; // Required
  webhookUrl?: string; // Optional per API spec
  userToken?: string; // Optional per API spec
  firstName?: string; // Optional: Customer first name
  lastName?: string; // Optional: Customer last name
  customerEmail?: string; // Optional: Customer email
  customerCountryCode?: string; // Optional: Customer country code
  customerMobile?: string; // Optional: Customer mobile number
  description?: string; // Not in API spec, kept for backward compatibility
  cancelUrl?: string; // Not in API spec, kept for backward compatibility
}

interface CreateInvoiceResponse {
  paymentUrl: string;
  globalTransactionsId: string;
  userToken?: string;
  [key: string]: any;
}

interface QueryTransactionResponse {
  globalTransactionsId: string;
  isPaid: boolean;
  paidOn?: string;
  paymentMethod?: string;
  dccUptake?: string;
  dccReceiptText?: string;
  [key: string]: any;
}

/**
 * Generate timestamp in milliseconds
 */
export function generateTimestamp(): string {
  return Date.now().toString();
}

/**
 * Compute Secret-Hash for createInvoice
 * Supports multiple signature formulas for testing
 * 
 * CRITICAL: All strings must match exactly as sent in request body
 * - No separators, no spaces
 * - Amount must be formatted consistently (e.g., "80.000")
 * - appId must be exact string (e.g., "50002754")
 */
export function computeCreateInvoiceHash(
  timestamp: string,
  appId: string,
  invoiceId: string,
  currency: string,
  amount: string,
  paymentMethod: string,
  returnUrl: string,
  secret: string
): string {
  let message: string;
  let fields: string[];
  let formula: string;

  // Select signature formula based on environment variable or default
  switch (SIGNATURE_FORMULA) {
    case 'all_fields':
      // Formula 1: Include all required body fields
      // timestamp + appId + invoiceId + currency + amount + paymentMethod + returnUrl
      message = timestamp + appId + invoiceId + currency + amount + paymentMethod + returnUrl;
      fields = ['timestamp', 'appId', 'invoiceId', 'currency', 'amount', 'paymentMethod', 'returnUrl'];
      formula = 'all_fields (timestamp + appId + invoiceId + currency + amount + paymentMethod + returnUrl)';
      break;

    case 'alphabetical':
      // Formula 3a: Alphabetical order
      // timestamp + amount + appId + currency + invoiceId + paymentMethod + returnUrl
      message = timestamp + amount + appId + currency + invoiceId + paymentMethod + returnUrl;
      fields = ['timestamp', 'amount', 'appId', 'currency', 'invoiceId', 'paymentMethod', 'returnUrl'];
      formula = 'alphabetical (timestamp + amount + appId + currency + invoiceId + paymentMethod + returnUrl)';
      break;

    case 'body_order':
      // Formula 3b: Body field order
      // timestamp + appId + invoiceId + currency + amount + paymentMethod + returnUrl
      message = timestamp + appId + invoiceId + currency + amount + paymentMethod + returnUrl;
      fields = ['timestamp', 'appId', 'invoiceId', 'currency', 'amount', 'paymentMethod', 'returnUrl'];
      formula = 'body_order (timestamp + appId + invoiceId + currency + amount + paymentMethod + returnUrl)';
      break;

    case 'documented_with_invoice':
      // Formula 3c: Documented order with invoiceId
      // timestamp + invoiceId + currency + amount + appId + paymentMethod + returnUrl
      message = timestamp + invoiceId + currency + amount + appId + paymentMethod + returnUrl;
      fields = ['timestamp', 'invoiceId', 'currency', 'amount', 'appId', 'paymentMethod', 'returnUrl'];
      formula = 'documented_with_invoice (timestamp + invoiceId + currency + amount + appId + paymentMethod + returnUrl)';
      break;

    case 'timestamp_only':
      // Formula 4: Timestamp only (some gateways use this)
      // timestamp
      message = timestamp;
      fields = ['timestamp'];
      formula = 'timestamp_only (timestamp)';
      break;

    case 'documented':
    default:
      // Original documented formula (4 fields only)
      // timestamp + currency + amount + appId
      message = timestamp + currency + amount + appId;
      fields = ['timestamp', 'currency', 'amount', 'appId'];
      formula = 'documented (timestamp + currency + amount + appId)';
      break;
  }

  // Enhanced logging
  logSignatureDetails(formula, message, fields);
  
  // Debug logging (only in development, never log secret)
  if (process.env.NODE_ENV === 'development') {
    console.log('[EazyPay Hash Debug] Create Invoice:', {
      formula,
      messageLength: message.length,
      fieldCount: fields.length,
      fields,
      hashLength: crypto.createHmac('sha256', secret).update(message).digest('hex').length,
    });
  }
  
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Compute Secret-Hash for query
 * HMAC-SHA256(secret, timestamp + appId)
 * 
 * CRITICAL: Exact string concatenation - no separators
 */
export function computeQueryHash(timestamp: string, appId: string, secret: string): string {
  // CRITICAL: Exact string concatenation - no separators
  const message = timestamp + appId;
  
  // Debug logging (only in development, never log secret)
  if (process.env.NODE_ENV === 'development') {
    console.log('[EazyPay Hash Debug] Query:', {
      messageLength: message.length,
      timestamp,
      appId,
      hashLength: crypto.createHmac('sha256', secret).update(message).digest('hex').length,
    });
  }
  
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Create invoice (payment request)
 */
export async function createInvoice(
  payload: CreateInvoicePayload
): Promise<CreateInvoiceResponse> {
  const appId = process.env.EAZYPAY_CHECKOUT_APP_ID;
  let secretKey = process.env.EAZYPAY_CHECKOUT_SECRET_KEY;

  // PHASE 1: Trim and validate secret key (remove hidden characters)
  if (secretKey) {
    secretKey = secretKey.trim();
  }

  if (!appId || !secretKey) {
    throw new Error('EazyPay Checkout credentials not configured');
  }

  // Log secret key validation (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('[EazyPay Secret Key Validation]', {
      originalLength: (process.env.EAZYPAY_CHECKOUT_SECRET_KEY || '').length,
      trimmedLength: secretKey.length,
      hasWhitespace: /^\s|\s$/.test(process.env.EAZYPAY_CHECKOUT_SECRET_KEY || ''),
      secretKeyPrefix: secretKey.substring(0, 10) + '...',
    });
  }

  const timestamp = generateTimestamp();
  const { currency, amount } = payload;

  // CRITICAL: Format amount as string exactly as it will be sent
  // Ensure consistent formatting (e.g., "80.000" not "80" or "80.0")
  // Parse and format to 3 decimal places to match EazyPay expectations
  const amountStr = parseFloat(amount.toString()).toFixed(3);

  // PHASE 2: Compute signature with all required fields
  // Updated to include all 6 required body fields: appId, invoiceId, currency, amount, paymentMethod, returnUrl
  const secretHash = computeCreateInvoiceHash(
    timestamp,
    appId,
    payload.invoiceId,
    currency,
    amountStr,
    payload.paymentMethod,
    payload.returnUrl,
    secretKey
  );

  // FIXED: Using correct Checkout API format per EazyPay support
  // - camelCase field names (appId, returnUrl, invoiceId, paymentMethod)
  // - Required fields: appId, invoiceId, currency, amount, paymentMethod, returnUrl
  // - Optional: webhookUrl
  // - DO NOT include terminal_id (it's derived from API key)
  
  const requestBody: any = {
    appId, // camelCase - numeric App ID (not UUID)
    invoiceId: payload.invoiceId, // Required: Your order ID
    currency,
    amount: amountStr,
    paymentMethod: payload.paymentMethod, // Required: e.g., "BENEFITGATEWAY,CREDITCARD,APPLEPAY"
    returnUrl: payload.returnUrl, // Required: camelCase
  };

  // Optional: webhookUrl
  // NOTE: If you get "Invalid number of inputs", try removing webhookUrl
  // Some EazyPay accounts may not have webhook configured
  if (payload.webhookUrl) {
    requestBody.webhookUrl = payload.webhookUrl; // camelCase
  }
  
  // Debug: Log which credentials are being used (development only, never log full secrets)
  if (process.env.NODE_ENV === 'development') {
    console.log('[EazyPay Checkout] Using credentials:', {
      appId,
      secretKeyPrefix: secretKey.substring(0, 10) + '...',
      secretKeyLength: secretKey.length,
    });
  }

  // Debug: Log request body and signature computation (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('[EazyPay Request] createInvoice body:', JSON.stringify(requestBody, null, 2));
    console.log('[EazyPay Request] Total fields:', Object.keys(requestBody).length);
    console.log('[EazyPay Request] Field names:', Object.keys(requestBody).join(', '));
    console.log('[EazyPay Request] Signature computation:');
    console.log('  - Formula mode:', SIGNATURE_FORMULA);
    console.log('  - Timestamp:', timestamp);
    console.log('  - App ID:', appId);
    console.log('  - Invoice ID:', payload.invoiceId);
    console.log('  - Currency:', currency);
    console.log('  - Amount:', amountStr, '(formatted to 3 decimals)');
    console.log('  - Payment Method:', payload.paymentMethod);
    console.log('  - Return URL:', payload.returnUrl);
    console.log('  - Using Secret Key (first 10 chars):', secretKey.substring(0, 10) + '...');
    console.log('  - Secret Key length:', secretKey.length);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    // Try adding appId as header instead of body
    // Some APIs use appId in headers for identification
    const response = await fetch(`${CHECKOUT_BASE_URL}/createInvoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8', // Per API spec
        'Timestamp': timestamp,
        'Secret-Hash': secretHash,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EazyPay createInvoice error:', response.status, errorText);
      throw new Error(`EazyPay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Debug: Log the actual response from EazyPay
    if (process.env.NODE_ENV === 'development') {
      console.log('[EazyPay Response] createInvoice:', JSON.stringify(data, null, 2));
    }
    
    // Handle error responses from EazyPay
    if (data.result && data.result.isSuccess === false) {
      const errorMsg = data.result.description || data.result.title || 'EazyPay API error';
      const errorCode = data.result.code || 'UNKNOWN';
      console.error('[EazyPay] API Error:', errorCode, errorMsg);
      throw new Error(`EazyPay error (${errorCode}): ${errorMsg}`);
    }
    
    // Handle different response structures
    // EazyPay might return: { paymentUrl, globalTransactionsId } or { data: { paymentUrl, ... } } or { result: { ... } }
    if (data.paymentUrl) {
      return data;
    } else if (data.data && data.data.paymentUrl) {
      return data.data;
    } else if (data.result && data.result.paymentUrl) {
      return data.result;
    } else {
      // Log the actual structure for debugging
      console.error('[EazyPay] Unexpected response structure:', JSON.stringify(data, null, 2));
      throw new Error('EazyPay response missing paymentUrl. Response: ' + JSON.stringify(data));
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('EazyPay API request timeout');
    }
    throw error;
  }
}

/**
 * Query transaction status
 * POST https://api.eazy.net/merchant/checkout/query
 */
export async function queryTransaction(
  globalTransactionsId: string
): Promise<QueryTransactionResponse> {
  const appId = process.env.EAZYPAY_CHECKOUT_APP_ID;
  const secretKey = process.env.EAZYPAY_CHECKOUT_SECRET_KEY;

  if (!appId || !secretKey) {
    throw new Error('EazyPay Checkout credentials not configured');
  }

  const timestamp = generateTimestamp();
  const secretHash = computeQueryHash(timestamp, appId, secretKey);

  const requestBody = {
    appId,
    globalTransactionsId,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${CHECKOUT_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8', // Per API spec
        'Timestamp': timestamp,
        'Secret-Hash': secretHash,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EazyPay queryTransaction error:', response.status, errorText);
      throw new Error(`EazyPay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('EazyPay API request timeout');
    }
    throw error;
  }
}

