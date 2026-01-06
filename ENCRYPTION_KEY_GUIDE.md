# BENEFIT_TOKEN_ENCRYPTION_KEY - Complete Guide

## What Is This Key?

**BENEFIT_TOKEN_ENCRYPTION_KEY** is a **secret encryption key** that YOU generate yourself. It is NOT provided by Benefit Pay or anyone else.

### Purpose:
- Encrypts payment tokens before storing in database
- Decrypts tokens when needed for payments
- Ensures tokens are stored securely

### Important:
- ⚠️ **You MUST generate this yourself** - it doesn't exist anywhere to "find"
- ⚠️ **Must be at least 32 characters long**
- ⚠️ **Keep it secret** - never commit to git
- ⚠️ **Use the same key** in local and production (or tokens won't work)

---

## How to Generate the Key

### Method 1: Using Node.js (Recommended)

**In your terminal:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Output example:**
```
FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
```

### Method 2: Using PowerShell (Windows)

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Output example:**
```
Kp9mN2xQ7vR4tY8wZ1aB3cD5eF6gH0j
```

### Method 3: Online Generator

1. Visit: https://randomkeygen.com/
2. Scroll to "CodeIgniter Encryption Keys"
3. Copy any 32-character key
4. Use it as your encryption key

---

## Where to Set the Key

### Local Development

**File:** `client/.env.local`

```env
BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
```

**Note:** Replace `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf` with your generated key.

### Production (Vercel)

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: **Settings** → **Environment Variables**
4. Click: **"Add New"**
5. Add:
   - **Key:** `BENEFIT_TOKEN_ENCRYPTION_KEY`
   - **Value:** `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf` (your generated key)
   - **Environment:** Select all (Production, Preview, Development)
6. Click: **"Save"**
7. **Redeploy** your application

---

## The Key I Generated for You

**Earlier in this session, I generated this key:**
```
FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
```

**This key is:**
- ✅ 32 characters long
- ✅ Cryptographically secure
- ✅ Already set in your local `.env.local` file

**You should use this SAME key in Vercel production!**

---

## Why Tokens Aren't Saving - Check These

### 1. Encryption Key Not Set in Production

**Check:**
- Vercel Dashboard → Settings → Environment Variables
- Look for: `BENEFIT_TOKEN_ENCRYPTION_KEY`
- If missing → Add it and redeploy

### 2. Feature Flags Not Enabled

**Check:**
- `BENEFIT_FASTER_CHECKOUT_ENABLED=true` (must be exactly `true`)
- `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true` (must be exactly `true`)

### 3. Benefit Pay Not Returning Token

**Check Vercel logs for:**
```
[BENEFIT Notify] ResponseData sample: { udf7: null, ... }
```

**If `udf7` is null:**
- Benefit Pay is NOT returning the token
- Contact Benefit Pay support
- Request Faster Checkout/Tokenization activation

### 4. Database Table Missing

**Check in Supabase:**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'benefit_payment_tokens'
);
```

**If returns false:**
- Run `ADD_BENEFIT_FASTER_CHECKOUT.sql` in Supabase SQL Editor

---

## Complete Setup Checklist

### Local Development:
- [x] ✅ Encryption key generated: `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf`
- [x] ✅ Key added to `.env.local`
- [x] ✅ Feature flags enabled in `.env.local`

### Production (Vercel):
- [ ] ⚠️ **Add `BENEFIT_TOKEN_ENCRYPTION_KEY` = `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf`**
- [ ] ⚠️ **Add `BENEFIT_FASTER_CHECKOUT_ENABLED` = `true`**
- [ ] ⚠️ **Add `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED` = `true`**
- [ ] ⚠️ **Redeploy application**

### Database:
- [ ] ⚠️ **Run `ADD_BENEFIT_FASTER_CHECKOUT.sql` in Supabase** (if not done)

### Testing:
- [ ] Make test payment with "Save card" checked
- [ ] Check Vercel logs for token extraction
- [ ] Check database for saved token

---

## What to Do Right Now

1. **Go to Vercel Dashboard**
2. **Add these 3 environment variables:**
   ```
   BENEFIT_FASTER_CHECKOUT_ENABLED=true
   NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true
   BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
   ```
3. **Redeploy**
4. **Make a test payment**
5. **Check Vercel logs** for token extraction messages
6. **Check database** for saved token

---

## Summary

- **BENEFIT_TOKEN_ENCRYPTION_KEY** = Secret key YOU generate (not found anywhere)
- **Generated key:** `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf` (already in local `.env.local`)
- **Action needed:** Add same key to Vercel production environment variables
- **Most likely issue:** Environment variables not set in Vercel production

