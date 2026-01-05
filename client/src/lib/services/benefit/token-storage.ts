import { getSupabase } from '@/lib/db';
import crypto from 'crypto';

interface StoreTokenParams {
  userId: string;
  token: string;
  paymentId?: string;
  orderId?: string;
  responseData?: any;
}

/**
 * Store payment token securely
 * - Encrypts token at rest
 * - Ensures idempotency (won't create duplicates)
 * - Extracts card details if available
 */
export async function storePaymentToken(params: StoreTokenParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, token, paymentId, orderId, responseData } = params;
    
    // Generate hash for duplicate detection
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Check if token already exists (idempotency)
    const { data: existing } = await getSupabase()
      .from('benefit_payment_tokens')
      .select('id')
      .eq('token_hash', tokenHash)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (existing) {
      // Token already stored - idempotent success
      return { success: true };
    }
    
    // Also check by payment_id for idempotency (if payment_id provided)
    if (paymentId) {
      const { data: existingByPayment } = await getSupabase()
        .from('benefit_payment_tokens')
        .select('id')
        .eq('payment_id', paymentId)
        .eq('user_id', userId)
        .single();
      
      if (existingByPayment) {
        // Token already stored for this payment - idempotent success
        return { success: true };
      }
    }
    
    // Encrypt token (use environment encryption key)
    const encryptionKey = process.env.BENEFIT_TOKEN_ENCRYPTION_KEY || process.env.BENEFIT_RESOURCE_KEY;
    if (!encryptionKey) {
      throw new Error('Token encryption key not configured');
    }
    
    const encryptedToken = encryptToken(token, encryptionKey);
    
    // Extract card details from responseData if available
    const cardAlias = extractCardAlias(responseData);
    const last4Digits = extractLast4Digits(responseData);
    const cardType = extractCardType(responseData);
    
    // Determine if this should be default (first token for user)
    const { data: existingTokens } = await getSupabase()
      .from('benefit_payment_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1);
    
    const isDefault = !existingTokens || existingTokens.length === 0;
    
    // Insert token
    const { error } = await getSupabase()
      .from('benefit_payment_tokens')
      .insert({
        user_id: userId,
        token: encryptedToken, // Encrypted
        token_hash: tokenHash,
        card_alias: cardAlias,
        last_4_digits: last4Digits,
        card_type: cardType,
        is_default: isDefault,
        payment_id: paymentId,
        order_id: orderId,
        status: 'active',
      });
    
    if (error) {
      // Handle unique constraint violations (idempotency)
      if (error.code === '23505') { // Unique violation
        return { success: true }; // Already exists
      }
      throw error;
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('[BENEFIT Token Storage] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Encrypt token using AES-256-GCM
 * Uses the same encryption method as Benefit Pay trandata encryption
 */
function encryptToken(token: string, key: string): string {
  try {
    // Derive a 32-byte key from the provided key using SHA-256
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    
    // Generate a random 12-byte IV for GCM
    const iv = crypto.randomBytes(12);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    
    // Encrypt the token
    let encrypted = cipher.update(token, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get the auth tag (required for GCM)
    const authTag = cipher.getAuthTag();
    
    // Combine IV, authTag, and encrypted data
    // Format: base64(iv:authTag:encrypted)
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64')
    ]);
    
    return combined.toString('base64');
  } catch (error: any) {
    console.error('[BENEFIT Token Encryption] Error:', error);
    throw new Error(`Token encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt token using AES-256-GCM
 */
export function decryptToken(encryptedToken: string, key: string): string {
  try {
    // Derive a 32-byte key from the provided key using SHA-256
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    
    // Decode the combined data
    const combined = Buffer.from(encryptedToken, 'base64');
    
    // Extract IV (first 12 bytes)
    const iv = combined.subarray(0, 12);
    
    // Extract auth tag (next 16 bytes)
    const authTag = combined.subarray(12, 28);
    
    // Extract encrypted data (remaining bytes)
    const encrypted = combined.subarray(28);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error: any) {
    console.error('[BENEFIT Token Decryption] Error:', error);
    throw new Error(`Token decryption failed: ${error.message}`);
  }
}

/**
 * Extract card alias from response data
 * Format: "Visa ****1234" or similar
 */
function extractCardAlias(responseData: any): string | null {
  if (!responseData) return null;
  
  // Check various possible field names from Benefit Pay response
  const cardNumber = responseData.cardNumber || responseData.card || responseData.cardNo || responseData.pan;
  const cardType = responseData.cardType || responseData.cardBrand || responseData.brand;
  
  if (cardNumber) {
    // Extract last 4 digits
    const last4 = cardNumber.slice(-4);
    const type = cardType || 'Card';
    return `${type} ****${last4}`;
  }
  
  // If we have last 4 digits separately
  if (responseData.last4 || responseData.lastFour) {
    const last4 = responseData.last4 || responseData.lastFour;
    const type = cardType || 'Card';
    return `${type} ****${last4}`;
  }
  
  return null;
}

/**
 * Extract last 4 digits from response data
 */
function extractLast4Digits(responseData: any): string | null {
  if (!responseData) return null;
  
  // Check various possible field names
  const cardNumber = responseData.cardNumber || responseData.card || responseData.cardNo || responseData.pan;
  
  if (cardNumber && cardNumber.length >= 4) {
    return cardNumber.slice(-4);
  }
  
  // Check if last 4 is provided directly
  if (responseData.last4 || responseData.lastFour) {
    return String(responseData.last4 || responseData.lastFour).slice(-4);
  }
  
  return null;
}

/**
 * Extract card type from response data
 */
function extractCardType(responseData: any): string | null {
  if (!responseData) return null;
  
  // Check various possible field names
  const cardType = responseData.cardType || 
                   responseData.cardBrand || 
                   responseData.brand || 
                   responseData.cardTypeName;
  
  if (cardType) {
    // Normalize to uppercase
    return cardType.toUpperCase();
  }
  
  // Try to infer from card number if available
  const cardNumber = responseData.cardNumber || responseData.card || responseData.cardNo || responseData.pan;
  if (cardNumber) {
    const firstDigit = cardNumber[0];
    if (firstDigit === '4') return 'VISA';
    if (firstDigit === '5') return 'MASTERCARD';
    if (firstDigit === '3') return 'AMEX';
  }
  
  return null;
}

/**
 * Get user's saved tokens (metadata only, no encrypted tokens)
 */
export async function getUserTokens(userId: string): Promise<Array<{
  id: string;
  card_alias: string | null;
  last_4_digits: string | null;
  card_type: string | null;
  is_default: boolean;
  created_at: string;
}>> {
  try {
    const { data, error } = await getSupabase()
      .from('benefit_payment_tokens')
      .select('id, card_alias, last_4_digits, card_type, is_default, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error('[BENEFIT Token Storage] Error fetching user tokens:', error);
    return [];
  }
}

/**
 * Get token by ID and verify it belongs to user
 */
export async function getTokenForUser(tokenId: string, userId: string): Promise<{
  token: string | null;
  error?: string;
}> {
  try {
    const { data, error } = await getSupabase()
      .from('benefit_payment_tokens')
      .select('token')
      .eq('id', tokenId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error || !data) {
      return { token: null, error: 'Token not found or access denied' };
    }
    
    // Decrypt token
    const encryptionKey = process.env.BENEFIT_TOKEN_ENCRYPTION_KEY || process.env.BENEFIT_RESOURCE_KEY;
    if (!encryptionKey) {
      return { token: null, error: 'Token decryption key not configured' };
    }
    
    try {
      const decryptedToken = decryptToken(data.token, encryptionKey);
      return { token: decryptedToken };
    } catch (decryptError: any) {
      return { token: null, error: `Token decryption failed: ${decryptError.message}` };
    }
  } catch (error: any) {
    console.error('[BENEFIT Token Storage] Error fetching token:', error);
    return { token: null, error: error.message };
  }
}

