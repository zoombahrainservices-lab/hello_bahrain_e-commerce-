# Why Tokens Are Not Saving - Diagnostic Guide

## 🔍 Immediate Steps to Diagnose

### Step 1: Check Production Environment Variables ⚠️ MOST LIKELY ISSUE

**This is the #1 reason tokens aren't saving!**

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify these three variables exist:
   ```
   BENEFIT_FASTER_CHECKOUT_ENABLED=true
   NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true
   BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
   ```
3. **Important:**
   - Must be set for **Production** environment
   - Values must be exactly `true` (case-sensitive)
   - Must **redeploy** after adding variables

### Step 2: Check Vercel Logs After Payment

1. Go to **Vercel Dashboard** → Your Project → **Logs** tab
2. Filter by: `BENEFIT` or `Token`
3. Make a test payment
4. Look for these log messages:

#### ✅ If Feature is Working:
```
[BENEFIT Notify] Faster Checkout check: { enabled: true, isSuccessful: true, ... }
[BENEFIT Notify] Token received (udf7 or legacy field): 8678335532...
[BENEFIT Notify] Token storage completed successfully
```

#### ❌ If Feature Flag Disabled:
```
[BENEFIT Notify] Faster Checkout check: { enabled: false, ... }
```
**Fix:** Set `BENEFIT_FASTER_CHECKOUT_ENABLED=true` in Vercel

#### ⚠️ If Token Not in Response:
```
[BENEFIT Notify] Faster Checkout fields: { udf7: 'not present', ... }
[BENEFIT Notify] ResponseData sample: { udf7: null, ... }
```
**This means:** Benefit Pay is NOT returning the token
**Fix:** Contact Benefit Pay support to enable tokenization

#### ❌ If Storage Fails:
```
[BENEFIT Token Storage] Error: Token encryption key not configured
[BENEFIT Token Storage] Error: relation "benefit_payment_tokens" does not exist
```
**Fix:** Set encryption key or create database table

### Step 3: Check What Benefit Pay is Returning

The new logging will show you **exactly** what Benefit Pay is sending:

```
[BENEFIT Notify] Full responseData keys: ['result', 'paymentId', 'trackId', 'udf7', ...]
[BENEFIT Notify] ResponseData sample: { udf7: '8678335532564...', udf8: 'FC', ... }
```

**If `udf7` is `null` or missing:**
- Benefit Pay is not returning the token
- Contact Benefit Pay support
- Request Faster Checkout/Tokenization activation

## 📊 Common Issues and Solutions

### Issue 1: Environment Variables Not Set in Production

**Symptom:** Logs show `enabled: false`

**Solution:**
1. Add to Vercel: `BENEFIT_FASTER_CHECKOUT_ENABLED=true`
2. Add to Vercel: `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true`
3. Add to Vercel: `BENEFIT_TOKEN_ENCRYPTION_KEY=your_key`
4. **Redeploy** application

### Issue 2: Benefit Pay Not Returning Token

**Symptom:** Logs show `udf7: 'not present'` or `udf7: null`

**This is the #2 most common issue!**

**Solution:**
1. Contact Benefit Pay support
2. Request Faster Checkout/Tokenization feature activation
3. Verify your merchant account has this feature enabled
4. Confirm they return token in `udf7` field
5. Test with a new payment after activation

### Issue 3: Database Table Doesn't Exist

**Symptom:** Error: `relation "benefit_payment_tokens" does not exist`

**Solution:**
1. Go to Supabase SQL Editor
2. Run `ADD_BENEFIT_FASTER_CHECKOUT.sql`
3. Verify table created

### Issue 4: Encryption Key Missing

**Symptom:** Error: `Token encryption key not configured`

**Solution:**
1. Set `BENEFIT_TOKEN_ENCRYPTION_KEY` in Vercel
2. Must be 32+ characters
3. Redeploy

## 🔍 What the New Logging Shows

After deploying the latest changes, you'll see detailed logs showing:

1. **Feature flag status:**
   ```
   [BENEFIT Notify] Faster Checkout check: { enabled: true/false, ... }
   ```

2. **All response fields:**
   ```
   [BENEFIT Notify] Full responseData keys: [...]
   ```

3. **Token field values:**
   ```
   [BENEFIT Notify] ResponseData sample: { udf7: '...', udf8: '...', ... }
   ```

4. **Storage result:**
   ```
   [BENEFIT Notify] Token storage completed successfully
   OR
   [BENEFIT Notify] Token storage failed: [error]
   ```

## 📝 Action Items

1. ✅ **Check Vercel environment variables** (most likely issue!)
2. ✅ **Check Vercel logs** after next payment
3. ✅ **Look for the new detailed log messages**
4. ✅ **Share the logs** if tokens still not saving

## 🎯 Expected Log Flow (When Working)

```
1. [BENEFIT Notify] Faster Checkout check: { enabled: true, isSuccessful: true, ... }
2. [BENEFIT Notify] Faster Checkout fields: { udf7: '8678335532...', udf8: 'FC', ... }
3. [BENEFIT Notify] Token received (udf7 or legacy field): 8678335532...
4. [BENEFIT Notify] Attempting to store token for user: abc12345...
5. [BENEFIT Token Storage] Token stored successfully: { cardAlias: '...', ... }
6. [BENEFIT Notify] Token storage completed successfully
```

If you don't see step 1 with `enabled: true`, the feature flag is not set.
If you don't see step 2 with `udf7` value, Benefit Pay is not returning the token.


