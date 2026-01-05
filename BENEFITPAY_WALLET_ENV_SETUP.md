# BenefitPay Wallet - Environment Variables Setup Guide

## Quick Start

Add these variables to your `.env.local` file:

```env
# BenefitPay Wallet Credentials (REQUIRED - no fallbacks)
BENEFITPAY_WALLET_MERCHANT_ID=3186
BENEFITPAY_WALLET_APP_ID=1988588907
BENEFITPAY_WALLET_SECRET_KEY=z2sd680omqyp0pw9qsini7p8jpoh2fmbg84k3ucc1zfut

# BenefitPay Wallet Optional Settings
BENEFITPAY_WALLET_CHECK_STATUS_URL=https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status
BENEFITPAY_WALLET_CLIENT_ID=
BENEFITPAY_DEBUG=false
```

## Required Variables

### `BENEFITPAY_WALLET_MERCHANT_ID`
- **Value:** `3186`
- **Purpose:** Merchant identifier for BenefitPay Wallet
- **Critical:** Must be exactly "3186" (as string)

### `BENEFITPAY_WALLET_APP_ID`
- **Value:** `1988588907`
- **Purpose:** Application identifier for BenefitPay Wallet
- **Critical:** Must be exactly "1988588907" (as string)

### `BENEFITPAY_WALLET_SECRET_KEY`
- **Value:** `z2sd680omqyp0pw9qsini7p8jpoh2fmbg84k3ucc1zfut`
- **Purpose:** Secret key for HMAC-SHA256 signature generation
- **Critical:** Must be 45 characters long
- **Security:** Never commit this value to git

## Optional Variables

### `BENEFITPAY_WALLET_CHECK_STATUS_URL`
- **Default:** `https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status`
- **Purpose:** API endpoint for checking payment status
- **When to set:** If using a different environment (production URL)

### `BENEFITPAY_WALLET_CLIENT_ID`
- **Default:** Not set (optional)
- **Purpose:** Client ID for X-CLIENT-ID header (if required by BenefitPay)
- **When to set:** Only if BenefitPay provides this credential

### `BENEFITPAY_DEBUG`
- **Default:** `false`
- **Purpose:** Enable detailed logging for hash/signature generation
- **Values:** `true` or `false`
- **Use:** Set to `true` for debugging, `false` for production

## Important Notes

### ⚠️ No Fallbacks
The new implementation **does NOT** fall back to:
- `BENEFIT_TRANPORTAL_*` variables
- `BENEFIT_RESOURCE_KEY`
- `EAZYPAY_MERCHANT_ID`
- `EAZYPAY_CHECKOUT_APP_ID`

This prevents accidental mixing of Payment Gateway and Wallet credentials.

### ✅ Validation
On startup, the system will:
1. Check if all required variables are set
2. Validate merchantId is "3186"
3. Validate appId is "1988588907"
4. Validate secret key length is 45 characters
5. Log which credentials are being used

### ❌ Error Handling
If any required variable is missing, you'll see:
```
BenefitPay Wallet credentials are missing or invalid: BENEFITPAY_WALLET_MERCHANT_ID, BENEFITPAY_WALLET_APP_ID, BENEFITPAY_WALLET_SECRET_KEY.
Please set the following environment variables in .env.local:
  BENEFITPAY_WALLET_MERCHANT_ID=3186
  BENEFITPAY_WALLET_APP_ID=1988588907
  BENEFITPAY_WALLET_SECRET_KEY=<your_wallet_secret>
```

## Verifying Setup

### 1. Restart Development Server
```bash
npm run dev
```

### 2. Check Logs
Look for:
```
[BenefitPay Wallet Config] Credential check:
  merchantId: 3186
  appId: 1988588907
  secretKey: SET
```

### 3. Test Payment
1. Add item to cart
2. Go to checkout
3. Select "BenefitPay" payment method
4. Click "Confirm & Place Order"
5. SDK should open without errors

### 4. Common Log Messages

**✅ Success:**
```
[BenefitPay Wallet Config] ✓ All required credentials present
[BenefitPay Wallet Config] ✓ merchantId: 3186
[BenefitPay Wallet Config] ✓ appId: 1988588907
```

**❌ Missing Credentials:**
```
[BenefitPay Wallet Config] ERROR: BenefitPay Wallet credentials are missing...
```

**⚠️ Wrong Values:**
```
[BenefitPay Wallet Config] WARNING: Unexpected Merchant ID: 30021462 (expected: 3186)
[BenefitPay Wallet Config] WARNING: Unexpected App ID: 30021462 (expected: 1988588907)
```

## Production Setup

For production deployment (Vercel/other):

1. Add all three required variables to your deployment platform
2. Use production URLs if different from test
3. Never set `BENEFITPAY_DEBUG=true` in production
4. Keep secret keys secure (use platform secrets management)

## Troubleshooting

### "Merchant does not support payment"
- Check merchantId is "3186"
- Check appId is "1988588907"
- Both must be exact strings

### "BenefitPay Wallet credentials are missing"
- Verify all three required variables are set in `.env.local`
- Restart development server after adding variables
- Check for typos in variable names

### "Transaction Has Been Discarded"
- Usually means wrong credentials or hash mismatch
- Enable `BENEFITPAY_DEBUG=true` to see hash calculation details
- Verify secret key is correct (45 chars)

## Migration from Old Setup

If you previously used:
- `EAZYPAY_MERCHANT_ID`
- `EAZYPAY_CHECKOUT_APP_ID`
- `BENEFIT_TRANPORTAL_ID`
- `BENEFIT_TRANPORTAL_PASSWORD`
- `BENEFIT_RESOURCE_KEY`

**You must now set:**
- `BENEFITPAY_WALLET_MERCHANT_ID=3186`
- `BENEFITPAY_WALLET_APP_ID=1988588907`
- `BENEFITPAY_WALLET_SECRET_KEY=<your_secret>`

The old variables are still used by Payment Gateway (card payments), but NOT by Wallet.

## Support

If you encounter issues:
1. Check logs for exact error message
2. Verify all required variables are set
3. Confirm values match exactly (3186, 1988588907)
4. Enable debug mode (`BENEFITPAY_DEBUG=true`)
5. Review `BENEFITPAY_WALLET_HARDENING_SUMMARY.md` for details

