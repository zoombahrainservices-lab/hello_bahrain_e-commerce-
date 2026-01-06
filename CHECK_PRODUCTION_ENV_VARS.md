# Check Production Environment Variables

## ⚠️ CRITICAL: Tokens Not Saving

If tokens are not being saved, the #1 most likely issue is that **environment variables are not set in production (Vercel)**.

## How to Check Production Environment Variables

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your project: `helloonebahrain` or similar
3. Go to **Settings** → **Environment Variables**

### Step 2: Verify These Variables Exist

**Required Variables:**
```
BENEFIT_FASTER_CHECKOUT_ENABLED=true
NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true
BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
```

**Important:**
- All three must be set
- Values must be exactly `true` (not `True` or `TRUE`)
- Encryption key must be the same as local (32+ characters)
- Set for **Production**, **Preview**, and **Development** environments

### Step 3: Redeploy After Adding Variables

After adding/updating environment variables:
1. Go to **Deployments** tab
2. Click **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

## How to Check Production Logs

### Step 1: Go to Vercel Logs
1. Vercel Dashboard → Your Project
2. Click **"Logs"** tab
3. Filter by: `BENEFIT` or `Token`

### Step 2: Look for These Log Messages

**After making a payment, you should see:**

#### ✅ Good Signs:
```
[BENEFIT Notify] Faster Checkout check: { enabled: true, isSuccessful: true, ... }
[BENEFIT Notify] Token received (udf7 or legacy field): 8678335532...
[BENEFIT Notify] Token storage completed successfully
```

#### ⚠️ Warning Signs:
```
[BENEFIT Notify] Faster Checkout check: { enabled: false, ... }
```
→ Feature flag not enabled!

```
[BENEFIT Notify] Faster Checkout fields: { udf7: 'not present', ... }
```
→ Benefit Pay not returning token!

#### ❌ Error Signs:
```
[BENEFIT Token Storage] Error: Token encryption key not configured
```
→ Encryption key missing!

```
[BENEFIT Token Storage] Error: relation "benefit_payment_tokens" does not exist
```
→ Database table doesn't exist!

## Quick Diagnostic Checklist

- [ ] Environment variables set in Vercel
- [ ] Variables set for Production environment
- [ ] `BENEFIT_FASTER_CHECKOUT_ENABLED=true` (exact value)
- [ ] `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true` (exact value)
- [ ] `BENEFIT_TOKEN_ENCRYPTION_KEY` is set (32+ characters)
- [ ] Application redeployed after setting variables
- [ ] Checked Vercel logs after payment
- [ ] Database table exists (verified in Supabase)

## Most Common Issues

### Issue 1: Variables Not Set in Production
**Symptom:** Logs show `enabled: false`

**Fix:**
1. Add variables to Vercel
2. Redeploy application

### Issue 2: Benefit Pay Not Returning Token
**Symptom:** Logs show `udf7: 'not present'`

**Fix:**
1. Contact Benefit Pay support
2. Request Faster Checkout/Tokenization activation
3. Verify merchant account has feature enabled

### Issue 3: Database Table Missing
**Symptom:** Error about table not existing

**Fix:**
1. Run `ADD_BENEFIT_FASTER_CHECKOUT.sql` in Supabase
2. Verify table was created

## Next Steps

1. **Check Vercel environment variables** (most likely issue!)
2. **Check Vercel logs** after making a test payment
3. **Look for the log messages** listed above
4. **Share the logs** if tokens still not saving

