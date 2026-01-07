# Quick Debug Guide - Tokens Not Saving

## 🚨 Most Common Issues (Check These First!)

### 1. Database Table Doesn't Exist ⚠️ #1 ISSUE
**Symptom:** No tokens in database, errors in logs about table not existing

**Fix:**
```sql
-- Run in Supabase SQL Editor
-- Copy from ADD_BENEFIT_FASTER_CHECKOUT.sql
```

### 2. Benefit Pay Not Returning Token ⚠️ #2 ISSUE
**Symptom:** Logs show `udf7: 'not present'`

**Check logs:**
```
[BENEFIT Notify] Faster Checkout fields: { udf7: 'not present', ... }
```

**Fix:**
- Contact Benefit Pay support
- Request Faster Checkout/Tokenization activation
- Verify merchant account has feature enabled

### 3. Feature Flag Disabled
**Symptom:** No token extraction logs at all

**Fix:**
- Set `BENEFIT_FASTER_CHECKOUT_ENABLED=true`
- Set `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true`
- Restart server (local) or redeploy (production)

---

## 🔍 How to Check in Production

### Step 1: Check Vercel Logs
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by: `BENEFIT` or `Token`
5. Look for:
   - `[BENEFIT Notify] Faster Checkout fields:`
   - `[BENEFIT Token Storage] Error:`
   - `Token storage completed successfully`

### Step 2: Check Production Database
1. Go to Supabase Dashboard (production)
2. Open SQL Editor
3. Run:
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'benefit_payment_tokens'
);

-- Check recent tokens
SELECT id, user_id, card_alias, last_4_digits, created_at
FROM benefit_payment_tokens
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Step 3: Check Environment Variables
1. Vercel Dashboard → Settings → Environment Variables
2. Verify:
   - `BENEFIT_FASTER_CHECKOUT_ENABLED=true`
   - `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true`
   - `BENEFIT_TOKEN_ENCRYPTION_KEY` is set

---

## 📊 What Logs to Look For

### ✅ Good (Token Being Saved):
```
[BENEFIT Notify] Token received (udf7 or legacy field): 8678335532...
[BENEFIT Notify] Attempting to store token for user: abc12345...
[BENEFIT Token Storage] Token stored successfully: { cardAlias: 'Visa ****1234', ... }
[BENEFIT Notify] Token storage completed successfully
```

### ⚠️ Warning (Token Not in Response):
```
[BENEFIT Notify] Faster Checkout fields: { udf7: 'not present', udf8: 'FC', udf9: 'not present' }
[BENEFIT Notify] No token found in response data. Available fields: [...]
```

### ❌ Error (Storage Failed):
```
[BENEFIT Token Storage] Error: relation "benefit_payment_tokens" does not exist
[BENEFIT Token Storage] Error: Token encryption key not configured
[BENEFIT Notify] Token storage failed (non-blocking): [error details]
```

---

## 🔧 Quick Fixes

### Fix 1: Create Database Table
```sql
-- Run in Supabase SQL Editor
-- See ADD_BENEFIT_FASTER_CHECKOUT.sql
```

### Fix 2: Enable Feature Flags
```env
# In .env.local (local) or Vercel (production)
BENEFIT_FASTER_CHECKOUT_ENABLED=true
NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true
BENEFIT_TOKEN_ENCRYPTION_KEY=your_32_char_key_here
```

### Fix 3: Contact Benefit Pay
- Request Faster Checkout feature activation
- Verify token is returned in `udf7` field
- Test with a new payment after activation

---

## 📝 Diagnostic SQL Queries

See `DIAGNOSTIC_QUERIES.sql` for comprehensive SQL queries to:
- Check if table exists
- View all tokens
- Find orders without tokens
- Count tokens by user
- And more...

---

## 📚 Full Documentation

- **Complete Debug Guide:** `DEBUG_TOKEN_STORAGE.md`
- **Diagnostic SQL:** `DIAGNOSTIC_QUERIES.sql`
- **Setup Guide:** `SETUP_FASTER_CHECKOUT_NOW.md`

---

## 🎯 Most Likely Issue

**90% of the time, it's one of these:**
1. Database table doesn't exist → Run migration SQL
2. Benefit Pay not returning token → Contact Benefit Pay support
3. Feature flag disabled → Set environment variables


