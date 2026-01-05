import crypto from 'crypto';

/**
 * BENEFIT Payment Gateway - AES Encryption/Decryption Module
 * 
 * Implements AES-256-CBC encryption/decryption as per BENEFIT specifications:
 * - IV: Fixed value "PGKEYENCDECIVSPC" (16 bytes ASCII)
 * - Mode: AES-256-CBC
 * - Padding: PKCS7 (Node.js default)
 * - Output: Uppercase hex string
 * - URL encoding: Before encrypt, after decrypt
 */

// Fixed IV as per BENEFIT specification
const BENEFIT_IV = 'PGKEYENCDECIVSPC';

/**
 * Encrypt plain trandata for BENEFIT gateway
 * 
 * @param plain - Plain text trandata (JSON string)
 * @param resourceKey - 32-character resource key from BENEFIT
 * @returns Uppercase hex string of encrypted data
 * 
 * Process:
 * 1. URL encode the plain text
 * 2. Encrypt using AES-256-CBC with fixed IV
 * 3. Convert to uppercase hex string
 */
export function encryptTrandata(plain: string, resourceKey: string): string {
  try {
    // Validate resource key length (must be 32 characters for AES-256)
    if (resourceKey.length !== 32) {
      throw new Error(`Resource key must be exactly 32 characters, got ${resourceKey.length}`);
    }

    // Step 1: URL encode the plain text
    const urlEncoded = encodeURIComponent(plain);

    // Step 2: Create cipher with AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', resourceKey, BENEFIT_IV);

    // Step 3: Encrypt the data
    let encrypted = cipher.update(urlEncoded, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Step 4: Convert to uppercase (BENEFIT requirement)
    return encrypted.toUpperCase();
  } catch (error: any) {
    console.error('[BENEFIT Crypto] Encryption error:', error.message);
    throw new Error(`Failed to encrypt trandata: ${error.message}`);
  }
}

/**
 * Decrypt encrypted trandata from BENEFIT gateway
 * 
 * @param encryptedHex - Uppercase hex string from BENEFIT
 * @param resourceKey - 32-character resource key from BENEFIT
 * @returns Decrypted and URL-decoded plain text
 * 
 * Process:
 * 1. Convert hex string to buffer
 * 2. Decrypt using AES-256-CBC with fixed IV
 * 3. URL decode the decrypted text
 */
export function decryptTrandata(encryptedHex: string, resourceKey: string): string {
  try {
    // Validate resource key length
    if (resourceKey.length !== 32) {
      throw new Error(`Resource key must be exactly 32 characters, got ${resourceKey.length}`);
    }

    // Step 1: Create decipher with AES-256-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', resourceKey, BENEFIT_IV);

    // Step 2: Decrypt the hex string
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Step 3: URL decode the decrypted text
    const urlDecoded = decodeURIComponent(decrypted);

    return urlDecoded;
  } catch (error: any) {
    console.error('[BENEFIT Crypto] Decryption error:', error.message);
    throw new Error(`Failed to decrypt trandata: ${error.message}`);
  }
}

/**
 * Validate resource key format
 * 
 * @param resourceKey - Resource key to validate
 * @returns true if valid, throws error if invalid
 */
export function validateResourceKey(resourceKey: string): boolean {
  if (!resourceKey) {
    throw new Error('Resource key is required');
  }

  if (resourceKey.length !== 32) {
    throw new Error(`Resource key must be exactly 32 characters for AES-256, got ${resourceKey.length}`);
  }

  // Check if it's printable ASCII (optional, but recommended)
  const isPrintableASCII = /^[\x20-\x7E]+$/.test(resourceKey);
  if (!isPrintableASCII) {
    console.warn('[BENEFIT Crypto] Warning: Resource key contains non-printable characters');
  }

  return true;
}

/**
 * Test encryption/decryption with a sample message
 * Used for debugging and verification
 * 
 * @param resourceKey - Resource key to test with
 * @returns true if test passes, false otherwise
 */
export function testEncryptionDecryption(resourceKey: string): boolean {
  try {
    const testMessage = 'Test message for BENEFIT encryption';
    const encrypted = encryptTrandata(testMessage, resourceKey);
    const decrypted = decryptTrandata(encrypted, resourceKey);

    const success = decrypted === testMessage;

    if (process.env.NODE_ENV === 'development') {
      console.log('[BENEFIT Crypto Test]', {
        success,
        originalLength: testMessage.length,
        encryptedLength: encrypted.length,
        decryptedLength: decrypted.length,
        match: success,
      });
    }

    return success;
  } catch (error: any) {
    console.error('[BENEFIT Crypto Test] Failed:', error.message);
    return false;
  }
}


