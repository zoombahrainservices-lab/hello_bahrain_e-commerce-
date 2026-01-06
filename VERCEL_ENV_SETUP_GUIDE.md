# Vercel Environment Variables Setup Guide

This guide will help you set up the BenefitPay Wallet environment variables in Vercel to fix the 500 error on the `/api/payments/benefitpay/init` endpoint.

## Prerequisites

- Access to your Vercel dashboard
- BenefitPay Wallet credentials (Merchant ID, App ID, Secret Key)
- Your project deployed on Vercel

---

## Step 1: Access Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and log in
2. Navigate to your project (hello_bahrain_e-commerce)
3. Click on the project to open its dashboard

---

## Step 2: Navigate to Environment Variables

1. In your project dashboard, click on **"Settings"** in the top navigation bar
2. In the left sidebar, click on **"Environment Variables"**

---

## Step 3: Add BenefitPay Wallet Environment Variables

You need to add **three required** environment variables and **two optional** ones:

### Required Variables

#### 1. BENEFITPAY_WALLET_MERCHANT_ID

- **Key:** `BENEFITPAY_WALLET_MERCHANT_ID`
- **Value:** `3186`
- **Environment:** Select all environments (Production, Preview, Development)
- Click **"Add"**

#### 2. BENEFITPAY_WALLET_APP_ID

- **Key:** `BENEFITPAY_WALLET_APP_ID`
- **Value:** `1988588907`
- **Environment:** Select all environments (Production, Preview, Development)
- Click **"Add"**

#### 3. BENEFITPAY_WALLET_SECRET_KEY

- **Key:** `BENEFITPAY_WALLET_SECRET_KEY`
- **Value:** `[Your 45-character secret key from BenefitPay]`
  - This should be the Tranportal Password for App ID 1988588907
  - Should be exactly 45 characters long
- **Environment:** Select all environments (Production, Preview, Development)
- Click **"Add"**

> ⚠️ **IMPORTANT:** Never commit this secret key to Git or share it publicly. Only add it in Vercel's secure environment variables.

### Optional Variables

#### 4. BENEFITPAY_WALLET_CLIENT_ID (Optional)

- **Key:** `BENEFITPAY_WALLET_CLIENT_ID`
- **Value:** `[Your Client ID from BenefitPay]` (if provided by BenefitPay)
- **Environment:** Select all environments (Production, Preview, Development)
- Click **"Add"**

> 📝 **Note:** This is optional and may not be required for all merchants.

#### 5. BENEFITPAY_WALLET_CHECK_STATUS_URL (Optional)

- **Key:** `BENEFITPAY_WALLET_CHECK_STATUS_URL`
- **Value:** `https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status`
- **Environment:** Select all environments (Production, Preview, Development)
- Click **"Add"**

> 📝 **Note:** This defaults to the test environment URL. Change to production URL when ready for production.

---

## Step 4: Redeploy Your Application

After adding all environment variables, you need to redeploy for the changes to take effect:

### Option A: Trigger a New Deployment

1. Go to the **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. Confirm the redeployment

### Option B: Push a New Commit

1. Make any small change to your code (or create an empty commit)
2. Push to your Git repository
3. Vercel will automatically deploy

---

## Step 5: Verify the Setup

After deployment completes:

### 1. Check Deployment Logs

1. Go to the **"Deployments"** tab
2. Click on the latest deployment
3. Check the **"Build Logs"** for any errors
4. Check the **"Function Logs"** for runtime errors

### 2. Test in Browser

1. Open your deployed website
2. Go to the checkout payment page
3. Select "BenefitPay" as the payment method
4. Click "Confirm & Place Order"

**Expected Results:**
- ✅ If configured correctly: The BenefitPay SDK should open
- ❌ If still failing: Check the browser console and server logs for specific errors

### 3. Check Configuration Endpoint

You can verify the configuration by visiting:
```
https://your-vercel-domain.vercel.app/api/payments/benefitpay/check-config
```

**Expected Response (Configured):**
```json
{
  "configured": true,
  "missing": []
}
```

**Expected Response (Not Configured):**
```json
{
  "configured": false,
  "missing": ["BENEFITPAY_WALLET_MERCHANT_ID", "BENEFITPAY_WALLET_APP_ID", ...]
}
```

---

## Troubleshooting

### Issue 1: Still Getting 500 Error

**Possible Causes:**
1. Environment variables not saved correctly
2. Application not redeployed after adding variables
3. Typo in environment variable names

**Solution:**
1. Double-check all variable names (they are case-sensitive)
2. Ensure all three required variables are added
3. Redeploy the application
4. Check the Function Logs in Vercel for specific error messages

### Issue 2: "BenefitPay Wallet is not properly configured"

**Possible Causes:**
1. One or more required environment variables are missing
2. Variables are set for wrong environments (e.g., only Preview, not Production)

**Solution:**
1. Go back to Settings > Environment Variables
2. Verify all three required variables exist
3. Click on each variable and ensure all environments are selected:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Redeploy

### Issue 3: Secret Key Invalid

**Possible Causes:**
1. Secret key has extra spaces or line breaks
2. Wrong secret key used (using PG secret instead of Wallet secret)
3. Secret key not exactly 45 characters

**Solution:**
1. Copy the secret key directly from your `.env.local` file
2. Ensure there are no extra spaces, quotes, or line breaks
3. The secret key should be exactly 45 characters
4. Verify it's the Tranportal Password for App ID 1988588907, not a different credential

### Issue 4: Wallet Option Still Disabled

**Possible Causes:**
1. Frontend is checking `/api/payments/benefitpay/check-config` and it's returning `configured: false`
2. Cache issue in browser

**Solution:**
1. Clear browser cache and hard reload (Ctrl+Shift+R or Cmd+Shift+R)
2. Open browser DevTools > Network tab
3. Go to checkout page
4. Look for the request to `/api/payments/benefitpay/check-config`
5. Check its response - it should show `configured: true`
6. If it shows `configured: false`, check the `missing` array to see which variables are missing

---

## Environment Variable Names Reference

Copy these exact names (case-sensitive):

```bash
# Required
BENEFITPAY_WALLET_MERCHANT_ID=3186
BENEFITPAY_WALLET_APP_ID=1988588907
BENEFITPAY_WALLET_SECRET_KEY=<your_45_char_secret_key>

# Optional
BENEFITPAY_WALLET_CLIENT_ID=<your_client_id>
BENEFITPAY_WALLET_CHECK_STATUS_URL=https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status
```

---

## Security Best Practices

1. **Never commit credentials to Git**
   - Environment variables should only be in Vercel dashboard and local `.env.local`
   - `.env.local` is already in `.gitignore`

2. **Use different credentials for different environments**
   - Test credentials for Preview/Development
   - Production credentials for Production

3. **Rotate credentials regularly**
   - If you suspect credentials are compromised, regenerate them immediately
   - Update them in both Vercel and local `.env.local`

4. **Limit access**
   - Only give Vercel dashboard access to team members who need it
   - Use Vercel's team permissions to control who can view/edit environment variables

---

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [BenefitPay Wallet Documentation](https://your-benefitpay-docs-url)
- Project-specific guides:
  - `BENEFITPAY_WALLET_ENV_SETUP.md` - Detailed credential setup
  - `BENEFITPAY_WALLET_HARDENING_SUMMARY.md` - Security and robustness features
  - `BENEFITPAY_FOO003_ERROR_GUIDE.md` - Merchant activation issues

---

## Support

If you continue to experience issues after following this guide:

1. Check the Vercel Function Logs for detailed error messages
2. Check the browser console for client-side errors
3. Review the `BENEFITPAY_WALLET_HARDENING_SUMMARY.md` for technical details
4. Contact BenefitPay support if the issue is related to account activation or credentials

---

## Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Added `BENEFITPAY_WALLET_MERCHANT_ID` with value `3186`
- [ ] Added `BENEFITPAY_WALLET_APP_ID` with value `1988588907`
- [ ] Added `BENEFITPAY_WALLET_SECRET_KEY` (45 characters)
- [ ] All variables are set for all environments (Production, Preview, Development)
- [ ] Redeployed the application
- [ ] Verified deployment completed successfully
- [ ] Tested `/api/payments/benefitpay/check-config` returns `configured: true`
- [ ] Tested payment flow on the deployed site
- [ ] BenefitPay option is enabled and clickable on checkout page
- [ ] No 500 errors in browser console or Vercel logs

---

**Last Updated:** January 2026


