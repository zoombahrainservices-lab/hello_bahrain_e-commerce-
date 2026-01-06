# ⚠️ IMMEDIATE ACTION REQUIRED - Tokens Not Saving

## The Problem

Tokens are not being saved in the database because **environment variables are not set in Vercel production**.

## What You Need to Do RIGHT NOW

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Select your project: `helloonebahrain` or similar
3. Click: **Settings** → **Environment Variables**

### Step 2: Add These 3 Variables

Click **"Add New"** and add each of these:

**Variable 1:**
- **Key:** `BENEFIT_FASTER_CHECKOUT_ENABLED`
- **Value:** `true` (must be exactly `true`, not `True` or `TRUE`)
- **Environment:** Select all (Production, Preview, Development)

**Variable 2:**
- **Key:** `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED`
- **Value:** `true` (must be exactly `true`)
- **Environment:** Select all

**Variable 3:**
- **Key:** `BENEFIT_TOKEN_ENCRYPTION_KEY`
- **Value:** `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf`
- **Environment:** Select all

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 4: Test

1. Make a test payment with "Save card" checked
2. Go to **Logs** tab in Vercel
3. Filter by: `BENEFIT` or `Token`
4. Look for:
   ```
   [BENEFIT Notify] Faster Checkout check: { enabled: true, ... }
   [BENEFIT Notify] ResponseData sample: { udf7: '...', ... }
   ```

---

## About BENEFIT_TOKEN_ENCRYPTION_KEY

### ⚠️ IMPORTANT: This is NOT something you "find" - you MUST generate it!

**What it is:**
- A secret key YOU create to encrypt/decrypt tokens
- Must be at least 32 characters
- Not provided by Benefit Pay

**The key I generated for you:**
```
FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
```

**This is already in your local `.env.local` file.**
**You need to add the SAME key to Vercel production.**

**How to generate a new one (if needed):**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## Why Tokens Aren't Saving

### Most Likely (90%): Environment Variables Not Set

**Symptom:** No token extraction logs in Vercel

**Fix:** Add the 3 variables above to Vercel and redeploy

### Second Most Likely (5%): Benefit Pay Not Returning Token

**Symptom:** Logs show `udf7: null` or `udf7: 'not present'`

**Check Vercel logs for:**
```
[BENEFIT Notify] ResponseData sample: { udf7: null, ... }
```

**Fix:** Contact Benefit Pay support to enable Faster Checkout/Tokenization

### Third Most Likely (5%): Database Table Missing

**Symptom:** Error: `relation "benefit_payment_tokens" does not exist`

**Fix:** Run `ADD_BENEFIT_FASTER_CHECKOUT.sql` in Supabase SQL Editor

---

## Font Errors (404) - Not Critical

The font files are missing, but this doesn't break the site. The browser will use system fonts as fallback.

**To fix font errors:**
- Add BRHendrix font files to `client/public/fonts/` directory
- OR remove `@font-face` declarations from `globals.css`

**This is cosmetic only - doesn't affect functionality.**

---

## Complete Checklist

### ✅ Already Done:
- [x] Encryption key generated: `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf`
- [x] Key added to local `.env.local`
- [x] Feature flags enabled locally
- [x] Code implementation complete
- [x] Database table SQL ready

### ⚠️ ACTION REQUIRED:
- [ ] **Add `BENEFIT_FASTER_CHECKOUT_ENABLED=true` to Vercel**
- [ ] **Add `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true` to Vercel**
- [ ] **Add `BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf` to Vercel**
- [ ] **Redeploy application**
- [ ] **Verify database table exists** (run SQL if needed)
- [ ] **Make test payment**
- [ ] **Check Vercel logs for token extraction**
- [ ] **Check database for saved token**

---

## After Adding Variables

1. **Redeploy** (critical!)
2. **Make a test payment** with "Save card" checked
3. **Check Vercel logs** immediately after payment
4. **Look for these messages:**
   - `[BENEFIT Notify] Faster Checkout check: { enabled: true, ... }` ✅
   - `[BENEFIT Notify] ResponseData sample: { udf7: '...', ... }` ✅
   - `[BENEFIT Notify] Token storage completed successfully` ✅

**If you see `enabled: false`** → Variables not set correctly
**If you see `udf7: null`** → Benefit Pay not returning token (contact them)
**If you see storage errors** → Check database table or encryption key

---

## Summary

**The encryption key:** `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf` (already generated, use this)

**What to do:** Add 3 environment variables to Vercel and redeploy

**Most likely issue:** Environment variables not set in production

**Next step:** Go to Vercel → Settings → Environment Variables → Add the 3 variables → Redeploy

