# Debug Token Storage - Why Tokens Aren't Being Saved

## Quick Diagnostic Checklist

### Step 1: Check if Database Table Exists

**Run in Supabase SQL Editor:**
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'benefit_payment_tokens'
);

-- If returns false, table doesn't exist - run the migration!
```

**If table doesn't exist:**
- Run `ADD_BENEFIT_FASTER_CHECKOUT.sql` in Supabase SQL Editor
- This is the #1 reason tokens aren't being saved!

### Step 2: Check Environment Variables

**Local Development:**
```bash
cd client
cat .env.local | grep BENEFIT_FASTER_CHECKOUT
```

**Should show:**
```
BENEFIT_FASTER_CHECKOUT_ENABLED=true
NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true
BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf
```

**Production (Vercel):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all three variables are set to `true` and key is present

### Step 3: Check Server Logs After Payment

**Local Development:**
After making a payment, check your terminal where `npm run dev` is running.

**Look for these log messages:**

#### ✅ Good Signs (Token Received):
```
[BENEFIT Notify] Token received (udf7 or legacy field): 8678335532...
[BENEFIT Notify] Faster Checkout fields: { udf7: '8678335532...', udf8: 'FC', udf9: 'not present' }
```

#### ⚠️ Warning Signs (Token Not Received):
```
[BENEFIT Notify] No token found in response data. Available fields: [...]
[BENEFIT Notify] udf7: undefined, udf8: undefined, udf9: undefined
```

#### ❌ Error Signs (Storage Failed):
```
[BENEFIT Notify] Token storage failed (non-blocking): [error message]
[BENEFIT Token Storage] Error: [error details]
```

**Production (Vercel):**
1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by: `[BENEFIT Notify]` or `[BENEFIT Token Storage]`
3. Look for the same messages above

### Step 4: Check Database for Tokens

**Run in Supabase SQL Editor:**
```sql
-- Check all tokens
SELECT 
  id,
  user_id,
  card_alias,
  last_4_digits,
  card_type,
  is_default,
  status,
  payment_id,
  created_at
FROM benefit_payment_tokens
ORDER BY created_at DESC
LIMIT 10;

-- Check tokens for specific user (replace with your user_id)
SELECT 
  id,
  card_alias,
  last_4_digits,
  card_type,
  is_default,
  status,
  created_at
FROM benefit_payment_tokens
WHERE user_id = 'your-user-id-here'
ORDER BY created_at DESC;
```

**If no rows returned:**
- Tokens are not being saved
- Continue to Step 5 to find the reason

### Step 5: Verify Token is in Payment Response

**The most common issue:** Benefit Pay is not returning the token.

**Check logs for:**
```
[BENEFIT Notify] Faster Checkout fields: { udf7: 'not present', ... }
```

**If `udf7` is "not present":**
- Benefit Pay is NOT returning the token
- This means:
  1. Tokenization not enabled for your merchant account
  2. You didn't include `udf8="FC"` in the payment request
  3. Benefit Pay gateway doesn't support tokenization for your account

**Solution:**
1. Contact Benefit Pay support
2. Request Faster Checkout/Tokenization feature activation
3. Verify your merchant account has this feature enabled
4. Confirm they return token in `udf7` field

### Step 6: Check if saveCard Flag Was Sent

**Check payment request logs:**
Look for when payment was initiated:
```
[BENEFIT Init] Plain trandata: {...}
```

**Should include:**
```json
{
  "udf8": "FC"
}
```

**If `udf8` is missing:**
- The `saveCard` flag wasn't passed
- Check that you checked the "Save card for faster checkout" checkbox
- Verify frontend is passing `saveCard: true` to API

## Common Issues and Solutions

### Issue 1: Table Doesn't Exist

**Error in logs:**
```
[BENEFIT Token Storage] Error: relation "benefit_payment_tokens" does not exist
```

**Solution:**
1. Go to Supabase SQL Editor
2. Run `ADD_BENEFIT_FASTER_CHECKOUT.sql`
3. Verify table created:
   ```sql
   SELECT * FROM benefit_payment_tokens LIMIT 1;
   ```

### Issue 2: Feature Flag Disabled

**Check logs:**
- No `[BENEFIT Notify] Faster Checkout fields:` message
- No token extraction attempts

**Solution:**
- Set `BENEFIT_FASTER_CHECKOUT_ENABLED=true` in environment
- Restart server (local) or redeploy (production)

### Issue 3: Encryption Key Missing

**Error in logs:**
```
[BENEFIT Token Storage] Error: Token encryption key not configured
```

**Solution:**
- Set `BENEFIT_TOKEN_ENCRYPTION_KEY` in environment variables
- Must be at least 32 characters

### Issue 4: Token Not in Response

**Logs show:**
```
[BENEFIT Notify] Faster Checkout fields: { udf7: 'not present', ... }
```

**This means:**
- Benefit Pay is NOT returning the token
- Most likely: Tokenization not enabled for merchant account

**Solution:**
1. Contact Benefit Pay support
2. Request Faster Checkout feature activation
3. Verify merchant account settings
4. Test with a new payment after activation

### Issue 5: Database Connection Error

**Error in logs:**
```
[BENEFIT Token Storage] Error: [database connection error]
```

**Solution:**
- Check Supabase credentials in environment variables
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is active

## Production Debugging Steps

### 1. Check Vercel Logs

**Steps:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by: `BENEFIT` or `Token`
5. Look for payment-related logs

**What to look for:**
- `[BENEFIT Notify]` messages
- `[BENEFIT Token Storage]` errors
- `Faster Checkout fields:` logs

### 2. Check Production Database

**In Supabase (Production):**
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'benefit_payment_tokens'
);

-- Check recent tokens
SELECT 
  id,
  user_id,
  card_alias,
  last_4_digits,
  status,
  created_at
FROM benefit_payment_tokens
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### 3. Check Production Environment Variables

**In Vercel:**
1. Settings → Environment Variables
2. Verify:
   - `BENEFIT_FASTER_CHECKOUT_ENABLED=true`
   - `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true`
   - `BENEFIT_TOKEN_ENCRYPTION_KEY` is set

### 4. Test Production Payment

1. Make a test payment on production site
2. Check Vercel logs immediately after
3. Look for token extraction messages
4. Check database for new token

## SQL Queries for Debugging

### Check Table Structure
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'benefit_payment_tokens'
ORDER BY ordinal_position;
```

### Check Recent Payments Without Tokens
```sql
-- Find orders that should have tokens but don't
SELECT 
  o.id as order_id,
  o.user_id,
  o.created_at as order_date,
  o.payment_method,
  cs.benefit_payment_id,
  CASE 
    WHEN bpt.id IS NULL THEN 'NO TOKEN'
    ELSE 'HAS TOKEN'
  END as token_status
FROM orders o
LEFT JOIN checkout_sessions cs ON cs.id = o.checkout_session_id
LEFT JOIN benefit_payment_tokens bpt ON bpt.order_id = o.id
WHERE o.payment_method = 'card'
  AND o.created_at > NOW() - INTERVAL '7 days'
ORDER BY o.created_at DESC;
```

### Check Token Storage Errors
```sql
-- If you have a logs table, check for errors
-- Otherwise, check Vercel logs
```

### Count Tokens by User
```sql
SELECT 
  user_id,
  COUNT(*) as token_count,
  MAX(created_at) as latest_token
FROM benefit_payment_tokens
WHERE status = 'active'
GROUP BY user_id
ORDER BY latest_token DESC;
```

## Enhanced Logging (To Add)

To get better visibility, we should add more detailed logging. The current code logs errors but we can improve it.

## Next Steps

1. **Run Step 1** - Verify table exists (most common issue!)
2. **Run Step 2** - Check environment variables
3. **Run Step 3** - Check server logs after a test payment
4. **Run Step 4** - Check database for tokens
5. **Run Step 5** - Verify token is in payment response

**Most likely issue:** Either table doesn't exist OR Benefit Pay is not returning the token.


