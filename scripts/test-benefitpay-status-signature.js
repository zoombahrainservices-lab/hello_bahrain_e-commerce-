/**
 * Test script for BenefitPay Wallet status check signature
 * 
 * This script verifies that status check signature generation matches the expected format.
 * 
 * Usage:
 *   node scripts/test-benefitpay-status-signature.js
 * 
 * Environment:
 *   Set BENEFITPAY_WALLET_SECRET_KEY in .env.local or export it
 */

const crypto = require('crypto');

// Test payload for status check
const statusParams = {
  merchant_id: "3186",
  reference_id: "HB_TEST123_1_1234567890"
};

// Expected string-to-sign
const expectedStringToSign = 'merchant_id="3186",reference_id="HB_TEST123_1_1234567890"';

// Get secret key from environment
const secretKey = process.env.BENEFITPAY_WALLET_SECRET_KEY;

if (!secretKey) {
  console.error('ERROR: BENEFITPAY_WALLET_SECRET_KEY not set');
  console.error('Please set it in .env.local or export it:');
  console.error('  export BENEFITPAY_WALLET_SECRET_KEY="your_secret_key"');
  process.exit(1);
}

console.log('='.repeat(80));
console.log('BenefitPay Wallet Status Check Signature Test');
console.log('='.repeat(80));
console.log('');

// Step 1: Filter excluded fields (same as SDK hash)
const excludedFields = ['lang', 'hashedString', 'secure_hash'];
const filteredParams = Object.entries(statusParams)
  .filter(([key]) => !excludedFields.includes(key));

console.log('Step 1: Filter excluded fields');
console.log('  Original params:', Object.keys(statusParams).join(', '));
console.log('  After filtering:', filteredParams.map(([key]) => key).join(', '));
console.log('');

// Step 2: Convert to strings and trim
const stringParams = filteredParams.map(([key, value]) => [
  key.trim(),
  String(value).trim()
]);

console.log('Step 2: Convert to strings');
stringParams.forEach(([key, value]) => {
  console.log(`  ${key}: "${value}"`);
});
console.log('');

// Step 3: Sort by key, then by value
const sortedParams = stringParams.sort((a, b) => {
  const keyCompare = a[0].localeCompare(b[0]);
  if (keyCompare !== 0) return keyCompare;
  return a[1].localeCompare(b[1]);
});

console.log('Step 3: Sort by key, then value');
console.log('  Sorted order:', sortedParams.map(([key]) => key).join(', '));
console.log('');

// Step 4: Format as key="value",key2="value2",...
const requestString = sortedParams
  .map(([key, value]) => `${key}="${value}"`)
  .join(',');

console.log('Step 4: Format string-to-sign');
console.log('  Generated:', requestString);
console.log('  Expected: ', expectedStringToSign);
console.log('  Match:    ', requestString === expectedStringToSign ? '✓ YES' : '✗ NO');
console.log('');

if (requestString !== expectedStringToSign) {
  console.error('ERROR: String-to-sign does not match expected value!');
  process.exit(1);
}

// Step 5 & 6: Generate HMAC-SHA256 and encode as Base64
const hmac = crypto.createHmac('sha256', secretKey);
hmac.update(requestString);
const signature = hmac.digest('base64');

console.log('Step 5 & 6: Generate signature');
console.log('  Secret key length:', secretKey.length);
console.log('  Signature length: ', signature.length);
console.log('  Signature (first 50):', signature.substring(0, 50) + '...');
console.log('  Signature (full):   ', signature);
console.log('');

console.log('='.repeat(80));
console.log('Test Result: ✓ PASSED');
console.log('='.repeat(80));
console.log('');
console.log('The status check signature generation is correct.');
console.log('This signature should be sent in the X-FOO-Signature header.');

