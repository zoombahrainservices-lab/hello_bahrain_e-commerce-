# BenefitPay Wallet Integration - Critical Fixes Applied

## Date: January 5, 2026

## Issues Fixed

### 1. Wrong App ID Source (CRITICAL)
**Problem:** App ID was using `BENEFIT_TRANPORTAL_PASSWORD=30021462` instead of correct value `1988588907`

**Root Cause:** Environment variable priority was incorrect

**Fix Applied:**
- Updated `client/src/lib/services/benefitpay/crypto.ts` to use `EAZYPAY_CHECKOUT_APP_ID` with highest priority
- New priority order:
  1. `BENEFITPAY_WALLET_APP_ID` (wallet-specific, if set)
  2. `EAZYPAY_CHECKOUT_APP_ID` (1988588907) ← **NEW**
  3. `BENEFIT_TRANPORTAL_PASSWORD` (fallback)
  4. Hardcoded `1988588907` (last resort)

### 2. SDK Error "Merchant does not support payment"
**Problem:** Invalid merchant ID (3186) + app ID (30021462) combination

**Root Cause:** App ID was wrong (see issue #1)

**Fix:** Resolved by fixing app ID to `1988588907`

### 3. Wrong Check-Status URL
**Problem:** URL was `https://test.benefit-gateway.bh/payment/API/hosted.htm/web/v1/merchant/transaction/check-status`
- Returns HTML instead of JSON
- Causes parse errors

**Fix Applied:**
- Updated default check-status URL to: `https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status`
- Added HTML response detection in `client/src/app/api/payments/benefitpay/check-status/route.ts`
- Better error messages when API returns HTML

### 4. Enhanced Validation and Logging
**Added:**
- Critical validation: App ID must be `1988588907`
- Critical validation: Merchant ID should be `3186`
- Detailed logging showing which credential sources are used
- Logging for `EAZYPAY_CHECKOUT_APP_ID` environment variable

## Files Modified

1. **`client/src/lib/services/benefitpay/crypto.ts`**
   - Updated app ID priority to use `EAZYPAY_CHECKOUT_APP_ID` first
   - Fixed check-status URL to use correct endpoint
   - Enhanced validation and logging
   - Fixed return statement bug (was referencing undefined `defaultCheckStatusUrl`)

2. **`client/src/app/api/payments/benefitpay/check-status/route.ts`**
   - Added HTML response detection
   - Better error messages for incorrect URLs
   - Improved error handling

## Required Environment Variables

Add to your `.env.local`:

```env
# BenefitPay Wallet Credentials
EAZYPAY_MERCHANT_ID=3186
EAZYPAY_CHECKOUT_APP_ID=1988588907
BENEFIT_RESOURCE_KEY=<your_secret_key>
```

## Expected Results After Restart

When you restart your development server and test BenefitPay Wallet payment:

1. ✅ App ID will be `1988588907` (from `EAZYPAY_CHECKOUT_APP_ID`)
2. ✅ Merchant ID will be `3186` (from `EAZYPAY_MERCHANT_ID`)
3. ✅ Hash string will be: `appId="1988588907",merchantId="3186",...`
4. ✅ Check-status URL will be correct: `https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status`
5. ✅ SDK will accept the request (no "Merchant does not support payment" error)
6. ✅ Payment flow will complete successfully

## Testing Checklist

After restarting the server, verify in the logs:

- [ ] `EAZYPAY_CHECKOUT_APP_ID` shows as `1988588907` or "NOT SET (SHOULD BE 1988588907!)"
- [ ] `usingEazyPayCredentials.appId: true` (if using EAZYPAY_CHECKOUT_APP_ID)
- [ ] Hash string shows: `appId="1988588907",merchantId="3186"`
- [ ] Check-status URL is: `https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status`
- [ ] No "Merchant does not support payment" error in browser console
- [ ] Payment completes successfully

## Next Steps

1. **Add the environment variable:**
   ```bash
   # In your .env.local file
   EAZYPAY_CHECKOUT_APP_ID=1988588907
   ```

2. **Restart the development server:**
   ```bash
   npm run dev
   ```

3. **Test the payment flow:**
   - Select BenefitPay payment method
   - Complete checkout
   - Check the terminal logs for correct credentials
   - Verify SDK opens without errors
   - Complete payment and verify order creation

## Technical Details

### Hash Calculation
The hash is calculated using HMAC-SHA256 with the following parameters (sorted):
```
appId="1988588907",hideMobileQR="0",merchantId="3186",qr_timeout="300",referenceNumber="HB_xxx",showResult="1",transactionAmount="2.000",transactionCurrency="BHD"
```

### SDK Parameters
The SDK receives:
```javascript
{
  merchantId: "3186",
  appId: "1988588907",
  transactionAmount: "2.000",
  transactionCurrency: "BHD",
  referenceNumber: "HB_xxx",
  secure_hash: "<calculated_hash>",
  paymentType: "web",
  showResult: "1",
  hideMobileQR: "0",
  qr_timeout: "300"
}
```

### Check-Status API Call
```javascript
POST https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status
Headers:
  Content-Type: application/json
  X-FOO-Signature: <calculated_signature>
  X-FOO-Signature-Type: KEYVAL
Body:
  { merchant_id: "3186", reference_id: "HB_xxx" }
```

## Troubleshooting

If you still see issues:

1. **App ID is still 30021462:**
   - Make sure you added `EAZYPAY_CHECKOUT_APP_ID=1988588907` to `.env.local`
   - Restart the dev server completely
   - Check the logs for "EAZYPAY_CHECKOUT_APP_ID" value

2. **"Merchant does not support payment" error:**
   - Verify merchant ID is `3186` in logs
   - Verify app ID is `1988588907` in logs
   - Check that hash string shows both correct values
   - Ensure secret key is correct

3. **Check-status returns HTML:**
   - The fix should prevent this, but if it happens:
   - Verify URL in logs is: `https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status`
   - Check if you have `BENEFITPAY_WALLET_CHECK_STATUS_URL` set incorrectly

## Support

If issues persist after applying these fixes and restarting:
1. Check the terminal logs for the "[BenefitPay Wallet] Credentials source" log entry
2. Verify all credentials match the expected values
3. Check browser console for SDK errors
4. Review the hash calculation logs to ensure parameters are correct

