# BenefitPay Wallet SDK Setup Guide

## Current Status

The BenefitPay Wallet integration is implemented, but you need to obtain the actual SDK file from BenefitPay to make it work.

## Error You're Seeing

**Error:** "BenefitPay Wallet SDK not loaded. Please refresh the page."

**Why:** The current `/public/InApp.min.js` file is just a placeholder. It prevents errors but doesn't actually provide the wallet functionality.

## How to Get the Real SDK

### Step 1: Contact BenefitPay Support

You need to contact BenefitPay to obtain the **Web Checkout SDK** file.

**Contact Information:**
- Email: Contact your BenefitPay account manager
- Phone: Check your BenefitPay merchant portal
- Support Portal: Log into your BenefitPay merchant dashboard

**What to Request:**
- "Web Checkout SDK" or "InApp.min.js"
- Documentation for Web Checkout SDK integration
- Test credentials for the wallet integration (if not already provided)

**Information to Provide:**
- Your Merchant ID: `BENEFIT_TRANPORTAL_ID` (from your .env)
- Your App ID: `BENEFIT_TRANPORTAL_PASSWORD` (from your .env)
- That you need the **Web Checkout SDK** (not Payment Gateway SDK)

### Step 2: Replace the Placeholder File

Once you receive the SDK file from BenefitPay:

1. **Download the SDK file** (usually named `InApp.min.js`)

2. **Replace the placeholder:**
   - Location: `client/public/InApp.min.js`
   - Delete or backup the current placeholder file
   - Copy the actual SDK file from BenefitPay to `client/public/InApp.min.js`

3. **Verify the file:**
   - The file should be a JavaScript file (`.js` extension)
   - It should define `window.InApp` or `InApp` object
   - It should have an `open()` method

### Step 3: Test the Integration

After replacing the SDK:

1. **Restart your dev server** (if running locally):
   ```bash
   cd client
   npm run dev
   ```

2. **Test the wallet payment:**
   - Go to checkout page
   - Select "BenefitPay" payment method
   - Click "Confirm & Place Order"
   - The SDK modal should open (not show an error)

3. **Deploy to production:**
   - Commit the new SDK file to git
   - Push to trigger Vercel deployment
   - Test in production

## Alternative: Load SDK from CDN (if available)

If BenefitPay provides a CDN URL for the SDK, you can load it dynamically instead of hosting it:

**Update `client/src/app/checkout/payment/page.tsx`:**

Find the SDK loading code (around line 70-90) and update it:

```typescript
// Load BenefitPay Wallet SDK when needed
useEffect(() => {
  if (paymentMethod === 'benefitpay_wallet' && !sdkLoaded) {
    const script = document.createElement('script');
    // Replace with actual CDN URL from BenefitPay
    script.src = 'https://cdn.benefitpay.bh/InApp.min.js'; // Example URL
    script.async = true;
    script.onload = () => {
      console.log('[Wallet SDK] SDK loaded successfully');
      setSdkLoaded(true);
    };
    script.onerror = () => {
      console.error('[Wallet SDK] Failed to load SDK');
      setError('Failed to load BenefitPay SDK. Please try again.');
    };
    document.body.appendChild(script);
    
    return () => {
      // Cleanup if component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }
}, [paymentMethod, sdkLoaded]);
```

## Current Implementation Status

✅ **Backend Integration:** Complete
- `/api/payments/benefitpay/init` - Initializes wallet payment
- `/api/payments/benefitpay/check-status` - Checks payment status
- Uses same BENEFIT credentials as Payment Gateway

✅ **Frontend Integration:** Complete
- Wallet payment flow implemented
- Status polling implemented
- Error handling in place

❌ **SDK File:** Missing
- Placeholder file in place (prevents errors)
- Need actual SDK from BenefitPay

## Testing Without SDK

Until you get the actual SDK, you can:

1. **Test the backend endpoints:**
   - The init endpoint should work (returns signed parameters)
   - The check-status endpoint should work (verifies payment)

2. **Test with Card option:**
   - "Credit / Debit Card" uses BENEFIT Payment Gateway
   - This should work without the wallet SDK

## Next Steps

1. **Contact BenefitPay** to request the Web Checkout SDK
2. **Replace** `/public/InApp.min.js` with the actual SDK
3. **Test** the wallet payment flow
4. **Deploy** to production

## Support

If you have issues:
- Check BenefitPay documentation for SDK integration
- Contact BenefitPay support with your Merchant ID
- Verify your credentials are correct in environment variables

## Environment Variables Required

Make sure these are set (same as Payment Gateway):
```env
BENEFIT_TRANPORTAL_ID=your_merchant_id
BENEFIT_TRANPORTAL_PASSWORD=your_app_id
BENEFIT_RESOURCE_KEY=your_secret_key
BENEFIT_ENDPOINT=https://api.test-benefitpay.bh/web/v1/merchant/transaction/init
```

The wallet integration uses these same credentials automatically.


