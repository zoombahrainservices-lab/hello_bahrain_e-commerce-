# BenefitPay Wallet Integration - Environment Variables

## Overview

This document provides setup instructions for the BenefitPay Wallet direct SDK integration. This is separate from the BENEFIT Payment Gateway integration for credit/debit cards.

## Required Credentials

You need to obtain these credentials from BenefitPay for the Wallet SDK integration:

1. **Merchant ID** - Your merchant identifier
2. **App ID** - Your application identifier  
3. **Secret Key** - Used for HMAC-SHA256 signature generation
4. **X-CLIENT-ID** - Client identifier (may be optional, verify with BenefitPay)

## Environment Variables

### Local Development

Create or update `client/.env.local` with:

```env
# BenefitPay Wallet SDK Credentials
BENEFITPAY_WALLET_MERCHANT_ID=your_merchant_id
BENEFITPAY_WALLET_APP_ID=your_app_id
BENEFITPAY_WALLET_SECRET_KEY=your_secret_key
BENEFITPAY_WALLET_CLIENT_ID=your_client_id  # Optional, verify if needed

# BenefitPay Wallet API Endpoints
# Test environment:
BENEFITPAY_WALLET_CHECK_STATUS_URL=https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status
# Production environment (when ready):
# BENEFITPAY_WALLET_CHECK_STATUS_URL=https://api.benefitpay.bh/web/v1/merchant/transaction/check-status
```

### Vercel/Production Deployment

Set these same variables in Vercel Dashboard:

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
2. Add each variable:
   - `BENEFITPAY_WALLET_MERCHANT_ID` = (your merchant ID)
   - `BENEFITPAY_WALLET_APP_ID` = (your app ID)
   - `BENEFITPAY_WALLET_SECRET_KEY` = (your secret key)
   - `BENEFITPAY_WALLET_CLIENT_ID` = (your client ID, if required)
   - `BENEFITPAY_WALLET_CHECK_STATUS_URL` = `https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status`
3. Select **Production**, **Preview**, and **Development** for each variable
4. **Redeploy** after adding variables

## Difference from BENEFIT Payment Gateway

### BENEFIT Payment Gateway (Credit/Debit Cards)
- Uses existing integration
- Environment variables: `BENEFIT_TRANPORTAL_ID`, `BENEFIT_TRANPORTAL_PASSWORD`, etc.
- Hosted payment page
- Supports cards + BenefitPay wallet (as an option on the gateway)

### BenefitPay Wallet SDK (New Integration)
- Direct SDK integration
- Environment variables: `BENEFITPAY_WALLET_*`
- In-app SDK modal
- Only supports BenefitPay wallet app

## Security Notes

1. **Secret Key Protection**: Never expose the secret key in client-side code
2. **Server-Side Hash**: Always generate `secure_hash` on the server
3. **Status Verification**: Always verify payment status via check-status API, never trust SDK callbacks alone

## Testing

### Test Environment
- Use test credentials provided by BenefitPay
- Download TBenefitPay test app
- Use test cards provided in BenefitPay documentation

### Verification Checklist
- [ ] All environment variables set in `.env.local`
- [ ] All environment variables set in Vercel
- [ ] Vercel redeployed after adding variables
- [ ] Test with TBenefitPay app
- [ ] Success flow works (order created, cart cleared)
- [ ] Failure flow works (no order, cart intact)
- [ ] Cancel flow works (no order, cart intact)

## Obtaining Credentials

If you don't have the wallet credentials yet:

1. Contact your BenefitPay account manager
2. Request **Web Checkout SDK** credentials (not Payment Gateway)
3. Specify you need:
   - Merchant ID
   - App ID
   - Secret Key
   - X-CLIENT-ID (if applicable)
   - Test environment access (TBenefitPay app)

## Support

For issues or questions about wallet integration:
- Contact BenefitPay support
- Reference: Web Checkout SDK integration
- Provide your Merchant ID when contacting support


