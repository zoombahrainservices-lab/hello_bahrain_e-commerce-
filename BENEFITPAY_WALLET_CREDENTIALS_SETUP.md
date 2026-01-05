# BenefitPay Wallet Credentials Setup

## Required Environment Variables

The BenefitPay Wallet integration uses the same credentials as the Payment Gateway, but **the App ID is different from the Merchant ID**.

### In your `.env.local` file, make sure you have:

```env
# Merchant ID (same for both PG and Wallet)
BENEFIT_TRANPORTAL_ID=30021462

# App ID (DIFFERENT from Merchant ID - this is 1988588907)
BENEFIT_TRANPORTAL_PASSWORD=1988588907

# Secret Key (same for both PG and Wallet)
BENEFIT_RESOURCE_KEY=your_secret_key_here
```

## Important Notes

1. **Merchant ID** (`BENEFIT_TRANPORTAL_ID`) = `30021462` (used for merchant identification)
2. **App ID** (`BENEFIT_TRANPORTAL_PASSWORD`) = `1988588907` (used for wallet SDK - DIFFERENT from Merchant ID!)
3. **Secret Key** (`BENEFIT_RESOURCE_KEY`) = Your secret key for signing requests

## Why This Matters

The wallet SDK requires:
- `merchantId`: Your merchant ID (`30021462`)
- `appId`: Your app ID (`1988588907`) - **This is NOT the same as merchant ID!**

If `BENEFIT_TRANPORTAL_PASSWORD` is not set, the system will try to use the merchant ID for both, which will cause authentication failures.

## Verification

After setting the credentials, restart your development server and check the logs. You should see:

```
[BenefitPay Wallet] Credentials source: {
  merchantId: '30021462',
  appId: '1988588907',  // Should be different from merchantId!
  ...
}
```

If you see the same value for both, check that `BENEFIT_TRANPORTAL_PASSWORD=1988588907` is set in your `.env.local` file.

