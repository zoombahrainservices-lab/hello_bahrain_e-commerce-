# EazyPay Payment Gateway Setup Guide

## Overview

This application uses **EazyPay/MPGS (Mastercard Payment Gateway Services)** for processing card payments and BenefitPay transactions. The integration supports:
- ✅ Credit/Debit Cards (Visa, Mastercard, etc.)
- ✅ BenefitPay (Bahrain's mobile payment app)
- ✅ Cash on Delivery (COD)

---

## Required Credentials for Payment Processing

You need to obtain these credentials from **Eazy Financial Services** after completing merchant onboarding:

### 1. **EAZYPAY_MERCHANT_ID** (Required)
- **What it is**: Your EazyPay/MPGS Merchant ID
- **Format**: Usually a numeric string (e.g., `20043843`)
- **Where to get it**: Provided by Eazy during merchant onboarding
- **Used for**: Creating payment sessions and checking payment status

### 2. **EAZYPAY_API_PASSWORD** (Required)
- **What it is**: Your EazyPay/MPGS API Password
- **Format**: Alphanumeric string
- **Where to get it**: Provided by Eazy during merchant onboarding
- **Used for**: Basic Authentication with MPGS API
- **Security**: Keep this secret! Never commit to version control.

### 3. **EAZYPAY_API_BASE_URL** (Required)
- **What it is**: The base URL for EazyPay/MPGS API
- **Format**: Usually one of:
  - **Test/Sandbox**: `https://test-gateway.mastercard.com/api/rest/version/{version}/merchant/{merchantId}`
  - **Production**: `https://ap-gateway.mastercard.com/api/rest/version/{version}/merchant/{merchantId}`
- **Where to get it**: Provided by Eazy - ask for the correct API endpoint URL
- **Note**: Replace `{version}` with API version (e.g., `61`, `62`) and `{merchantId}` with your merchant ID

### 4. **EAZYPAY_RETURN_URL** (Required)
- **What it is**: URL where customers are redirected after successful payment
- **Format**: Full URL (e.g., `https://helloonebahrain.com/payment/eazypay/return`)
- **Current value**: `https://helloonebahrain.com/payment/eazypay/return`
- **Used for**: Payment success callback

### 5. **EAZYPAY_CANCEL_URL** (Required)
- **What it is**: URL where customers are redirected if they cancel payment
- **Format**: Full URL (e.g., `https://helloonebahrain.com/payment/eazypay/cancel`)
- **Current value**: `https://helloonebahrain.com/payment/eazypay/cancel`
- **Used for**: Payment cancellation callback

### 6. **NEXT_PUBLIC_EAZYPAY_CHECKOUT_JS** (Required)
- **What it is**: URL to EazyPay Checkout.js library (frontend payment form)
- **Format**: Full URL to JavaScript file (e.g., `https://test-gateway.mastercard.com/checkout/version/{version}/checkout.js`)
- **Where to get it**: Provided by Eazy - ask for the Checkout.js script URL
- **Note**: Replace `{version}` with the version number
- **Used for**: Loading the payment form in the browser

---

## Optional: Portal APIs Credentials (For Reporting & Admin)

The document you provided is for **EazyPay Portal APIs** which are used for:
- Viewing transaction reports
- Managing disputes
- Settlement reports
- VAT reports

These are **optional** and only needed if you want to build admin features for viewing transactions/reports.

### 7. **EAZYPAY_API_KEY** (Optional - Portal APIs)
- **What it is**: API Key for Portal APIs
- **Format**: UUID string (e.g., `6fcb6ca8-8a11-4ef4-9b5a-f5f0a0b9d46a`)
- **Where to get it**: Provided by Eazy upon onboarding completion
- **Used for**: Portal API authentication

### 8. **EAZYPAY_SECRET_KEY** (Optional - Portal APIs)
- **What it is**: Secret Key for Portal APIs (used for HMAC-SHA256 signature)
- **Format**: Alphanumeric string
- **Where to get it**: Provided by Eazy upon onboarding completion
- **Used for**: Generating HMAC signatures for Portal API requests
- **Security**: Keep this secret! Never commit to version control.

---

## How to Get Your Credentials

1. **Contact Eazy Financial Services**:
   - Email: (Check your onboarding documents)
   - Phone: (Check your onboarding documents)
   - Portal: https://portal.eazy.net (if you have access)

2. **Request the following**:
   - MPGS Merchant ID
   - MPGS API Password
   - MPGS API Base URL (with version)
   - Checkout.js Script URL (with version)
   - Portal API Key (if needed for reporting)
   - Portal Secret Key (if needed for reporting)

3. **Verify Environment**:
   - Ask if you're getting **Test/Sandbox** or **Production** credentials
   - Test credentials should use `test-gateway.mastercard.com`
   - Production credentials should use `ap-gateway.mastercard.com`

---

## Current Configuration Status

✅ **Environment file created**: `client/.env.local`

### Already Configured:
- ✅ `EAZYPAY_RETURN_URL` = `https://helloonebahrain.com/payment/eazypay/return`
- ✅ `EAZYPAY_CANCEL_URL` = `https://helloonebahrain.com/payment/eazypay/cancel`

### Need to Fill In:
- ⚠️ `EAZYPAY_MERCHANT_ID` = `your_merchant_id_here`
- ⚠️ `EAZYPAY_API_PASSWORD` = `your_api_password_here`
- ⚠️ `EAZYPAY_API_BASE_URL` = `https://your_eazypay_api_base_url_here`
- ⚠️ `NEXT_PUBLIC_EAZYPAY_CHECKOUT_JS` = `https://your_eazypay_checkout_js_url_here`

---

## Testing Checklist

Once you have the credentials:

1. ✅ Add credentials to `client/.env.local`
2. ✅ Restart the development server (`npm run dev`)
3. ✅ Test payment flow:
   - Add items to cart
   - Go to checkout
   - Select "Credit/Debit Card" or "BenefitPay"
   - Complete test payment
   - Verify redirect to success page

---

## Important Notes

1. **Two Different API Systems**:
   - **Payment Processing**: Uses MPGS API (Basic Auth with Merchant ID + Password)
   - **Portal APIs**: Uses Portal API (HMAC-SHA256 with API Key + Secret Key)
   - These are **separate** and use different authentication methods

2. **Environment Variables**:
   - For **local development**: Use test/sandbox credentials
   - For **production (Vercel)**: Add the same variables in Vercel Dashboard → Settings → Environment Variables

3. **Security**:
   - Never commit `.env.local` to Git (it's already in `.gitignore`)
   - Use different credentials for test and production
   - Rotate credentials if compromised

4. **BenefitPay Support**:
   - BenefitPay is automatically supported through EazyPay/MPGS
   - No additional configuration needed
   - Customers will see BenefitPay option in the payment form

---

## Support

If you need help:
1. Contact Eazy Financial Services support
2. Check EazyPay documentation
3. Review MPGS integration guides

---

## Next Steps

1. **Get credentials from Eazy**
2. **Update `client/.env.local`** with your credentials
3. **Test the payment flow** in development
4. **Add credentials to Vercel** for production deployment
5. **Test in production** before going live



