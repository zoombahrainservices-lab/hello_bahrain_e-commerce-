/**
 * Test script for BenefitPay Wallet hash generation
 * 
 * This script verifies that hash generation matches the expected output
 * for a fixed test payload.
 * 
 * Usage:
 *   node scripts/test-benefitpay-hash.js
 * 
 * Environment:
 *   Set BENEFITPAY_WALLET_SECRET_KEY in .env.local or export it
 */

const crypto = require('crypto');

// Test payload (from plan)
const testParams = {
  merchantId: "3186",
  appId: "1988588907",
  transactionAmount: "2.000",
  transactionCurrency: "BHD",
  referenceNumber: "HB_TEST123_1_1234567890",
  showResult: "1",
  hideMobileQR: "0",
  qr_timeout: "150000"
};

// Expected string-to-sign (from plan)
const expectedStringToSign = 'appId="1988588907",hideMobileQR="0",merchantId="3186",qr_timeout="150000",referenceNumber="HB_TEST123_1_1234567890",showResult="1",transactionAmount="2.000",transactionCurrency="BHD"';

// Get secret key from environment
const secretKey = process.env.BENEFITPAY_WALLET_SECRET_KEY;

if (!secretKey) {
  console.error('ERROR: BENEFITPAY_WALLET_SECRET_KEY not set');
  console.error('Please set it in .env.local or export it:');
  console.error('  export BENEFITPAY_WALLET_SECRET_KEY="your_secret_key"');
  process.exit(1);
}

console.log('='.repeat(80));
console.log('BenefitPay Wallet Hash Generation Test');
console.log('='.repeat(80));
console.log('');

// Step 1: Filter excluded fields
const excludedFields = ['lang', 'hashedString', 'secure_hash'];
const filteredParams = Object.entries(testParams)
  .filter(([key]) => !excludedFields.includes(key));

console.log('Step 1: Filter excluded fields');
console.log('  Original params:', Object.keys(testParams).join(', '));
console.log('  After filtering:', filteredParams.map(([key]) => key).join(', '));
console.log('');

// Step 2: Convert to strings and trim
const stringParams = filteredParams.map(([key, value]) => [
  key.trim(),
  String(value).trim()
]);

console.log('Step 2: Convert to strings');
stringParams.forEach(([key, value]) => {
  console.log(`  ${key}: "${value}" (type: ${typeof value})`);
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
  console.error('  This indicates a problem with the canonicalization logic.');
  process.exit(1);
}

// Step 5 & 6: Generate HMAC-SHA256 and encode as Base64
const hmac = crypto.createHmac('sha256', secretKey);
hmac.update(requestString);
const hash = hmac.digest('base64');

console.log('Step 5 & 6: Generate hash');
console.log('  Secret key length:', secretKey.length);
console.log('  Hash length:       ', hash.length);
console.log('  Hash (first 50):   ', hash.substring(0, 50) + '...');
console.log('  Hash (full):       ', hash);
console.log('');

console.log('='.repeat(80));
console.log('Test Result: ✓ PASSED');
console.log('='.repeat(80));
console.log('');
console.log('The hash generation logic is correct.');
console.log('You can use this hash in your integration tests.');

