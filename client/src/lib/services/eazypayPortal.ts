import crypto from 'crypto';

/**
 * EazyPay Portal API Service
 * Implements EazyPay Portal APIs with exact HMAC-SHA256 signing as per documentation
 * Ref: EFS-EAZYPAY-20221220-V1.2, Sep 2024
 * Base URL: https://api.eazy.net/public-api/merchant
 */

const PORTAL_BASE_URL = 'https://api.eazy.net/public-api/merchant';

/**
 * Generate timestamp in milliseconds as string
 */
export function nowTimestampMs(): string {
  return Date.now().toString();
}

/**
 * Compute HMAC-SHA256 hex digest
 */
export function hmacSha256Hex(secret: string, message: string): string {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Stable JSON stringify - ensures deterministic key order
 * This is critical for HMAC signing as the exact string must match
 */
export function stableJsonStringify(obj: any): string {
  // Sort keys recursively to ensure stable output
  const sorted = (value: any): any => {
    if (value === null || typeof value !== 'object' || value instanceof Date) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(sorted);
    }
    const keys = Object.keys(value).sort();
    const result: any = {};
    for (const key of keys) {
      result[key] = sorted(value[key]);
    }
    return result;
  };
  return JSON.stringify(sorted(obj));
}

/**
 * Sign JSON request - returns headers for JSON endpoints
 */
export function signJsonRequest(bodyString: string, timestamp: string, secretKey: string): Record<string, string> {
  const message = timestamp + bodyString;
  const secretHash = hmacSha256Hex(secretKey, message);
  
  return {
    'Timestamp': timestamp,
    'Secret-Hash': secretHash,
    'content-type': 'application/json; charset=utf-8',
  };
}

/**
 * Make JSON request to Portal API
 */
async function requestJson(endpointPath: string, jsonBodyObj: any): Promise<any> {
  const apiKey = process.env.EAZYPAY_PORTAL_API_KEY;
  const secretKey = process.env.EAZYPAY_PORTAL_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('EazyPay Portal credentials not configured');
  }

  // Ensure apiKey is in the body
  const bodyWithApiKey = { apiKey, ...jsonBodyObj };
  
  // Create stable JSON string - this exact string is used for signing
  const bodyString = stableJsonStringify(bodyWithApiKey);
  const timestamp = nowTimestampMs();
  
  // Sign the request
  const headers = signJsonRequest(bodyString, timestamp, secretKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${PORTAL_BASE_URL}${endpointPath}`, {
      method: 'POST',
      headers,
      body: bodyString, // Use the exact string used for signing
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`EazyPay Portal API error (${endpointPath}):`, response.status, errorText);
      throw new Error(`EazyPay Portal API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('EazyPay Portal API request timeout');
    }
    throw error;
  }
}

/**
 * Sign multipart request for Create Dispute
 * Secret-Hash = HMAC-SHA256(secretKey, timestamp + submitterName + terminalId + cardNo + transactionDate + transactionAmount + claimAmount + refundTo + msg)
 */
function signCreateDisputeRequest(
  timestamp: string,
  submitterName: string,
  terminalId: string,
  cardNo: string,
  transactionDate: string,
  transactionAmount: string,
  claimAmount: string,
  refundTo: string,
  msg: string,
  secretKey: string
): string {
  const message = timestamp + submitterName + terminalId + cardNo + transactionDate + transactionAmount + claimAmount + refundTo + msg;
  return hmacSha256Hex(secretKey, message);
}

/**
 * Sign multipart request for Reply Dispute
 * Secret-Hash = HMAC-SHA256(secretKey, timestamp + caseId + msg)
 */
function signReplyDisputeRequest(timestamp: string, caseId: string, msg: string, secretKey: string): string {
  const message = timestamp + caseId + msg;
  return hmacSha256Hex(secretKey, message);
}

/**
 * Make multipart/form-data request to Portal API
 * Note: This function expects formFields to contain string values and File objects
 * For Node.js, we'll use FormData which is available in Node.js 18+
 */
async function requestMultipart(
  endpointPath: string,
  formFields: Record<string, string | File | Blob>,
  secretKey: string
): Promise<any> {
  const timestamp = nowTimestampMs();
  let secretHash: string;

  // Compute signature based on endpoint
  if (endpointPath === '/createDispute') {
    const submitterName = String(formFields.submitterName || '');
    const terminalId = String(formFields.terminalId || '');
    const cardNo = String(formFields.cardNo || '');
    const transactionDate = String(formFields.transactionDate || '');
    const transactionAmount = String(formFields.transactionAmount || '');
    const claimAmount = String(formFields.claimAmount || '');
    const refundTo = String(formFields.refundTo || '');
    const msg = String(formFields.msg || '');
    
    secretHash = signCreateDisputeRequest(
      timestamp,
      submitterName,
      terminalId,
      cardNo,
      transactionDate,
      transactionAmount,
      claimAmount,
      refundTo,
      msg,
      secretKey
    );
  } else if (endpointPath === '/replyDispute') {
    const caseId = String(formFields.caseId || '');
    const msg = String(formFields.msg || '');
    
    secretHash = signReplyDisputeRequest(timestamp, caseId, msg, secretKey);
  } else {
    throw new Error(`Unknown multipart endpoint: ${endpointPath}`);
  }

  // Build FormData - Node.js 18+ has FormData support
  const formData = new FormData();
  for (const [key, value] of Object.entries(formFields)) {
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for file uploads

  try {
    const response = await fetch(`${PORTAL_BASE_URL}${endpointPath}`, {
      method: 'POST',
      headers: {
        'Timestamp': timestamp,
        'Secret-Hash': secretHash,
        // Don't set Content-Type - fetch will set it with boundary for FormData
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`EazyPay Portal API error (${endpointPath}):`, response.status, errorText);
      throw new Error(`EazyPay Portal API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('EazyPay Portal API request timeout');
    }
    throw error;
  }
}

// Portal API Methods

export async function getLiveTransactions(params: {
  page?: string;
  size?: string;
  id?: string;
  terminalId?: string;
  cardNo?: string;
  terminalName?: string;
}) {
  // Validate size max 50
  if (params.size && parseInt(params.size) > 50) {
    throw new Error('Size cannot exceed 50');
  }
  
  return requestJson('/getLiveTransactions', params);
}

export async function getSettlementReport(params: {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}) {
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(params.from) || !dateRegex.test(params.to)) {
    throw new Error('Date format must be YYYY-MM-DD');
  }
  
  return requestJson('/getSettlementReport', params);
}

export async function getVatReport(params: {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}) {
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(params.from) || !dateRegex.test(params.to)) {
    throw new Error('Date format must be YYYY-MM-DD');
  }
  
  return requestJson('/getVatReport', params);
}

export async function disputeList(params: {
  page?: string;
  size?: string;
  caseId?: string;
  dateFlag?: 'E' | 'D' | null;
  dateFrom?: string;
  dateTo?: string;
}) {
  // Validate size max 50
  if (params.size && parseInt(params.size) > 50) {
    throw new Error('Size cannot exceed 50');
  }
  
  // Validate dateFlag requirements
  if (params.dateFlag && (!params.dateFrom || !params.dateTo)) {
    throw new Error('dateFrom and dateTo are required when dateFlag is set');
  }
  
  return requestJson('/disputeList', params);
}

export async function createDispute(formFields: Record<string, string | File | Blob>): Promise<any> {
  const secretKey = process.env.EAZYPAY_PORTAL_SECRET_KEY;
  if (!secretKey) {
    throw new Error('EazyPay Portal credentials not configured');
  }

  // Validate required fields
  const required = ['submitterName', 'terminalId', 'cardNo', 'transactionDate', 'transactionAmount', 'claimAmount', 'msg'];
  for (const field of required) {
    if (!formFields[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Ensure apiKey is in formFields (will be added by endpoint, but ensure it's here for signing)
  const apiKey = process.env.EAZYPAY_PORTAL_API_KEY;
  if (apiKey && !formFields.apiKey) {
    formFields.apiKey = apiKey;
  }

  return requestMultipart('/createDispute', formFields, secretKey);
}

export async function replyDispute(formFields: Record<string, string | File | Blob>): Promise<any> {
  const secretKey = process.env.EAZYPAY_PORTAL_SECRET_KEY;
  if (!secretKey) {
    throw new Error('EazyPay Portal credentials not configured');
  }

  // Validate required fields
  if (!formFields.caseId || !formFields.msg) {
    throw new Error('Missing required fields: caseId, msg');
  }

  // Ensure apiKey is in formFields
  const apiKey = process.env.EAZYPAY_PORTAL_API_KEY;
  if (apiKey && !formFields.apiKey) {
    formFields.apiKey = apiKey;
  }

  return requestMultipart('/replyDispute', formFields, secretKey);
}

export async function viewMerchantSettlementsReport(params: {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  storePublicId: string;
  reportFileType: 'pdf' | 'csv';
}) {
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(params.from) || !dateRegex.test(params.to)) {
    throw new Error('Date format must be YYYY-MM-DD');
  }
  
  if (params.reportFileType !== 'pdf' && params.reportFileType !== 'csv') {
    throw new Error('reportFileType must be "pdf" or "csv"');
  }
  
  return requestJson('/viewMerchantSettlementsReport', params);
}

export async function getTransactionDetails(params: {
  rrn: string;
  authCode: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}) {
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(params.from) || !dateRegex.test(params.to)) {
    throw new Error('Date format must be YYYY-MM-DD');
  }
  
  if (!params.rrn || !params.authCode) {
    throw new Error('rrn and authCode are required');
  }
  
  return requestJson('/getTransactionDetails', params);
}
