# EazyPay Credentials Checklist

## 📋 Credentials You Need to Provide

Please provide the following credentials from **Eazy Financial Services** to complete the EazyPay setup:

---

## ✅ Required for Payment Processing (Card & BenefitPay)

### 1. **EAZYPAY_MERCHANT_ID**
```
Example: 20043843
```
- Your EazyPay/MPGS Merchant ID
- Usually a numeric string

### 2. **EAZYPAY_API_PASSWORD**
```
Example: Abc123Xyz789
```
- Your EazyPay/MPGS API Password
- Used for Basic Authentication

### 3. **EAZYPAY_API_BASE_URL**
```
Example (Test): https://test-gateway.mastercard.com/api/rest/version/61/merchant/20043843
Example (Production): https://ap-gateway.mastercard.com/api/rest/version/61/merchant/20043843
```
- The base URL for EazyPay/MPGS API
- Should include version number and merchant ID
- Ask Eazy if you're not sure about the exact URL format

### 4. **NEXT_PUBLIC_EAZYPAY_CHECKOUT_JS**
```
Example (Test): https://test-gateway.mastercard.com/checkout/version/61/checkout.js
Example (Production): https://ap-gateway.mastercard.com/checkout/version/61/checkout.js
```
- URL to the Checkout.js library
- Used to load the payment form in the browser
- Should include version number

---

## 📊 Optional: Portal APIs (For Reporting & Admin Features)

These are only needed if you want to build admin features for viewing transactions, disputes, or settlement reports.

### 5. **EAZYPAY_API_KEY** (Optional)
```
Example: 6fcb6ca8-8a11-4ef4-9b5a-f5f0a0b9d46a
```
- API Key for Portal APIs
- UUID format

### 6. **EAZYPAY_SECRET_KEY** (Optional)
```
Example: YourSecretKey123
```
- Secret Key for Portal APIs
- Used for HMAC-SHA256 signature generation

---

## 🔍 What to Ask Eazy Financial Services

When contacting Eazy, ask for:

1. ✅ **MPGS Merchant ID** (for payment processing)
2. ✅ **MPGS API Password** (for payment processing)
3. ✅ **MPGS API Base URL** (with version number)
4. ✅ **Checkout.js Script URL** (with version number)
5. ✅ **Test vs Production credentials** (which environment you're getting)
6. ⚠️ **Portal API Key** (if you need reporting features)
7. ⚠️ **Portal Secret Key** (if you need reporting features)

---

## 📝 Notes

- **Test Environment**: URLs usually contain `test-gateway.mastercard.com`
- **Production Environment**: URLs usually contain `ap-gateway.mastercard.com`
- **Version Numbers**: API version (e.g., 61, 62) should be included in URLs
- **BenefitPay**: Automatically supported - no additional configuration needed

---

## ✅ Once You Have the Credentials

1. Open `client/.env.local`
2. Replace the placeholder values:
   - `your_merchant_id_here` → Your actual Merchant ID
   - `your_api_password_here` → Your actual API Password
   - `https://your_eazypay_api_base_url_here` → Your actual API Base URL
   - `https://your_eazypay_checkout_js_url_here` → Your actual Checkout.js URL
3. Save the file
4. Restart your development server: `npm run dev`
5. Test the payment flow

---

## 🚀 For Production (Vercel)

After testing locally, add the same credentials to:
- **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
- Make sure to set them for **Production** environment

---

## 📞 Need Help?

- Check `EAZYPAY_SETUP.md` for detailed setup instructions
- Contact Eazy Financial Services support
- Review the EazyPay integration documentation





