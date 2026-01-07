# Final Token Setup Checklist - Why Tokens Still Not Saving

## ✅ Fixed: "Save card" Checkbox Position

**Issue:** Checkbox was appearing below wallet option instead of card option.

**Fix:** Moved the Faster Checkout UI to be directly under the "Credit / Debit Card" radio button.

**Status:** ✅ Fixed and committed

---

## ⚠️ CRITICAL: Tokens Still Not Saving

### The #1 Reason: Environment Variables Not Set in Vercel Production

**You MUST add these to Vercel:**

1. Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add these 3 variables:

   ```
   BENEFIT_FASTER_CHECKOUT_ENABLED=true
   NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true
   BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
   ```

3. **Set for:** Production, Preview, Development (all environments)

4. **Redeploy** after adding

---

## About BENEFIT_TOKEN_ENCRYPTION_KEY

### ⚠️ You DON'T "find" this - you GENERATE it!

**What it is:**
- A secret encryption key YOU create
- Used to encrypt/decrypt payment tokens
- Must be 32+ characters

**The key I generated for you:**
```
FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
```

**This is:**
- ✅ Already in your local `.env.local` file
- ❌ **NOT in Vercel production** (this is why tokens aren't saving!)

**You MUST add this same key to Vercel!**

---

## How to Verify What's Wrong

### Step 1: Check Vercel Logs

1. Go to: **Vercel Dashboard** → Your Project → **Logs**
2. Filter by: `BENEFIT` or `Token`
3. Make a test payment
4. Look for these messages:

#### If Feature Flag Disabled:
```
[BENEFIT Notify] Faster Checkout check: { enabled: false, ... }
```
**Fix:** Add `BENEFIT_FASTER_CHECKOUT_ENABLED=true` to Vercel

#### If Token Not in Response:
```
[BENEFIT Notify] ResponseData sample: { udf7: null, ... }
```
**Fix:** Contact Benefit Pay to enable tokenization

#### If Encryption Key Missing:
```
[BENEFIT Token Storage] Error: Token encryption key not configured
```
**Fix:** Add `BENEFIT_TOKEN_ENCRYPTION_KEY` to Vercel

#### If Working:
```
[BENEFIT Notify] Faster Checkout check: { enabled: true, ... }
[BENEFIT Notify] Token received (udf7 or legacy field): 8678335532...
[BENEFIT Notify] Token storage completed successfully
```

### Step 2: Check Database

**In Supabase SQL Editor:**
```sql
SELECT * FROM benefit_payment_tokens 
ORDER BY created_at DESC 
LIMIT 10;
```

**If empty:**
- Tokens are not being saved
- Check Vercel logs to see why

---

## Complete Action Checklist

### ✅ Already Done:
- [x] Code implementation complete
- [x] Database table SQL ready
- [x] Encryption key generated: `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf`
- [x] Local `.env.local` configured
- [x] "Save card" checkbox position fixed

### ⚠️ MUST DO NOW:
- [ ] **Add `BENEFIT_FASTER_CHECKOUT_ENABLED=true` to Vercel**
- [ ] **Add `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true` to Vercel**
- [ ] **Add `BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf` to Vercel**
- [ ] **Redeploy application**
- [ ] **Verify database table exists** (run SQL if needed)
- [ ] **Make test payment**
- [ ] **Check Vercel logs**
- [ ] **Check database for token**

---

## Why It's Not Working

**Most likely (90%):**
- Environment variables not set in Vercel production
- Feature is disabled by default for safety
- Must explicitly enable in production

**Second most likely (5%):**
- Benefit Pay not returning token (`udf7` is null)
- Tokenization not enabled for merchant account
- Contact Benefit Pay support

**Third most likely (5%):**
- Database table doesn't exist
- Run `ADD_BENEFIT_FASTER_CHECKOUT.sql` in Supabase

---

## Next Steps

1. **Go to Vercel** → Settings → Environment Variables
2. **Add the 3 variables** listed above
3. **Redeploy**
4. **Test payment** with "Save card" checked
5. **Check Vercel logs** for token extraction
6. **Check database** for saved token

**The encryption key is:** `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf` (use this exact value)


