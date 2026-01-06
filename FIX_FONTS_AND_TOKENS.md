# Fix Font Errors and Token Storage Issues

## Issue 1: Missing Font Files (404 Errors)

The font files are missing from `client/public/fonts/` directory. The CSS is trying to load them but they don't exist.

### Solution Options:

**Option A: Remove Font References (Quick Fix)**
- Remove `@font-face` declarations from `globals.css`
- Use system fonts as fallback

**Option B: Add Font Files (Proper Fix)**
- Add BRHendrix font files to `client/public/fonts/` directory
- Files needed:
  - `BRHendrix-Semibold.woff2`
  - `BRHendrix-Semibold.woff`
  - `BRHendrix-Semibold.ttf`
  - `BRHendrix-Regular.woff2`
  - `BRHendrix-Regular.woff`
  - `BRHendrix-Regular.ttf`
  - `BRHendrix-Bold.woff2`
  - `BRHendrix-Bold.woff`
  - `BRHendrix-Bold.ttf`

**Option C: Use Google Fonts or CDN**
- Host fonts externally
- Update font URLs in CSS

---

## Issue 2: BENEFIT_TOKEN_ENCRYPTION_KEY - What Is It?

### ⚠️ IMPORTANT: This is NOT something you "find" - you MUST GENERATE it!

**What it is:**
- A secret encryption key used to encrypt/decrypt payment tokens
- Must be at least 32 characters long
- You generate it yourself (it's not provided by Benefit Pay)

**Why you need it:**
- Tokens from Benefit Pay are sensitive data
- They must be encrypted before storing in database
- This key is used to encrypt/decrypt them

**How to Generate:**

**Option 1: Using Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**Option 2: Using PowerShell (Windows)**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Option 3: Online Generator**
- Visit: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" section
- Copy a 32-character key

**Example Generated Key:**
```
FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
```

**Where to Set It:**

1. **Local Development** (`client/.env.local`):
   ```env
   BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
   ```

2. **Production (Vercel)**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `BENEFIT_TOKEN_ENCRYPTION_KEY` = `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf`
   - Set for: Production, Preview, Development
   - **Redeploy** after adding

**⚠️ CRITICAL:**
- Use the SAME key in local and production
- If you change the key, all existing tokens become unusable
- Keep the key secure (never commit to git)
- The key I generated earlier was: `FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf`

---

## Issue 3: Tokens Not Saving - Diagnostic Steps

### Step 1: Check Vercel Environment Variables

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Verify these exist:**
```
BENEFIT_FASTER_CHECKOUT_ENABLED=true
NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true
BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
```

**If missing:**
1. Add them
2. Set for Production environment
3. Redeploy application

### Step 2: Check Vercel Logs After Payment

**Go to:** Vercel Dashboard → Your Project → Logs

**Filter by:** `BENEFIT` or `Token`

**After making a payment, look for:**

#### ✅ Good Signs:
```
[BENEFIT Notify] Faster Checkout check: { enabled: true, ... }
[BENEFIT Notify] Token received (udf7 or legacy field): 8678335532...
[BENEFIT Notify] Token storage completed successfully
```

#### ❌ Bad Signs:
```
[BENEFIT Notify] Faster Checkout check: { enabled: false, ... }
```
→ Feature flag not enabled!

```
[BENEFIT Notify] ResponseData sample: { udf7: null, ... }
```
→ Benefit Pay not returning token!

```
[BENEFIT Token Storage] Error: Token encryption key not configured
```
→ Encryption key missing!

### Step 3: Check Database Table

**In Supabase SQL Editor:**
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'benefit_payment_tokens'
);

-- Check for tokens
SELECT * FROM benefit_payment_tokens 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Most Likely Reasons Tokens Aren't Saving

### 1. Environment Variables Not Set in Vercel (90% of cases)
- Feature flags must be `true` in production
- Encryption key must be set
- Must redeploy after adding variables

### 2. Benefit Pay Not Returning Token (5% of cases)
- Tokenization not enabled for merchant account
- Contact Benefit Pay support
- Verify `udf7` field in logs

### 3. Database Table Missing (5% of cases)
- Run `ADD_BENEFIT_FASTER_CHECKOUT.sql` in Supabase

---

## Quick Fix Checklist

- [ ] Generate encryption key (if not done)
- [ ] Add all 3 environment variables to Vercel
- [ ] Redeploy application
- [ ] Check Vercel logs after payment
- [ ] Verify database table exists
- [ ] Contact Benefit Pay if `udf7` is null in logs

