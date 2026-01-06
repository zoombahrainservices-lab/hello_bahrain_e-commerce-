# Faster Checkout Diagnostic Guide

This guide helps you diagnose why Faster Checkout is not working and provides step-by-step solutions.

## Quick Diagnostic Checklist

Run through this checklist to identify the issue:

### 1. Feature Flags ✅/❌
- [ ] `BENEFIT_FASTER_CHECKOUT_ENABLED=true` in environment (backend)
- [ ] `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true` in environment (frontend)
- [ ] `BENEFIT_TOKEN_ENCRYPTION_KEY` is set (32 characters minimum)

**How to check:**
```bash
# In your terminal (local development)
cd client
cat .env.local | grep BENEFIT_FASTER_CHECKOUT

# For production (Vercel)
# Check in Vercel Dashboard > Project Settings > Environment Variables
```

**Fix if missing:**
- Add to `client/.env.local` for local development
- Add to Vercel project settings for production
- Generate encryption key: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`

### 2. Database Table ✅/❌
- [ ] `benefit_payment_tokens` table exists in Supabase

**How to check:**
Run this SQL in Supabase SQL Editor:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'benefit_payment_tokens'
);
```

**Fix if missing:**
- Run `ADD_BENEFIT_FASTER_CHECKOUT.sql` in Supabase SQL Editor
- File location: `hello_bahrain_e-commerce-/ADD_BENEFIT_FASTER_CHECKOUT.sql`

### 3. Payment Method ✅/❌
- [ ] User selects "Credit / Debit Card" (not BenefitPay Wallet)
- [ ] Payment method is `'card'` in the code

**How to check:**
- Visit `/checkout/payment` page
- Select "Credit / Debit Card" option
- Faster checkout UI should appear if feature is enabled

**Fix:**
- Ensure users select the correct payment method
- Feature only works with `paymentMethod === 'card'`

### 4. Token Request Flag ✅/❌
- [ ] "Save card" checkbox is checked when making payment
- [ ] `udf8="FC"` is included in payment request when saveCard is true

**How to check:**
- Check browser network tab when submitting payment
- Look for request to `/api/payments/benefit/init`
- Request body should include `saveCard: true`

**Status:** ✅ **FIXED** - Code now passes `saveCard` flag to request tokenization

### 5. Token in Response ✅/❌
- [ ] Benefit Pay returns token in `udf7` field after successful payment

**How to check:**
Check server logs after successful payment:
```
[BENEFIT Notify] Token received (udf7 or legacy field): ...
[BENEFIT Notify] Faster Checkout fields: { udf7: '...', udf8: '...', udf9: '...' }
```

**If token not found:**
- Check logs: `[BENEFIT Notify] No token found in response data`
- Contact Benefit Pay support to enable tokenization for your merchant account
- Verify tokenization is enabled in Benefit Pay merchant portal

### 6. Token Storage ✅/❌
- [ ] Tokens are stored in database after successful payment

**How to check:**
Run this SQL in Supabase:
```sql
SELECT id, user_id, card_alias, last_4_digits, card_type, is_default, created_at
FROM benefit_payment_tokens
WHERE user_id = 'your_user_id'
ORDER BY created_at DESC;
```

**If no tokens:**
- Check server logs for token storage errors
- Verify `BENEFIT_FASTER_CHECKOUT_ENABLED=true`
- Verify `BENEFIT_TOKEN_ENCRYPTION_KEY` is set
- Check if token extraction is working (Step 5)

### 7. UI Display ✅/❌
- [ ] "Use saved card" checkbox and dropdown appear
- [ ] Saved cards are listed in dropdown

**How to check:**
- Visit `/checkout/payment` page
- Select "Credit / Debit Card"
- Should see "Use saved card" option if tokens exist

**If not showing:**
- Verify `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true`
- Check browser console for errors
- Verify tokens exist in database (Step 6)
- Check network tab for `/api/payments/benefit/tokens` request

## Common Issues and Solutions

### Issue: "Faster Checkout feature is not enabled"
**Error:** API returns 403 with message "Faster Checkout feature is not enabled"

**Solution:**
1. Set `BENEFIT_FASTER_CHECKOUT_ENABLED=true` in environment
2. Restart server (if local development)
3. Redeploy (if production)

### Issue: "Token encryption key not configured"
**Error:** Server logs show "Token encryption key not configured"

**Solution:**
1. Set `BENEFIT_TOKEN_ENCRYPTION_KEY` environment variable
2. Generate a secure 32-character key
3. Restart server

### Issue: Tokens not being stored
**Symptom:** Payments succeed but no tokens in database

**Possible Causes:**
1. Feature flag disabled
2. Token not in payment response
3. Database table missing
4. Encryption key missing

**Solution:**
1. Check all diagnostic steps above
2. Review server logs for token extraction
3. Contact Benefit Pay if token not in response

### Issue: UI not showing saved cards
**Symptom:** Feature enabled but no saved cards dropdown

**Possible Causes:**
1. Frontend feature flag disabled
2. No tokens exist for user
3. API endpoint error

**Solution:**
1. Verify `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true`
2. Check if tokens exist in database
3. Check browser console for API errors
4. Verify `/api/payments/benefit/tokens` endpoint works

### Issue: Saved card payment fails
**Symptom:** Selecting saved card but payment fails

**Possible Causes:**
1. Token expired or deleted
2. Token decryption fails
3. Token doesn't belong to user

**Solution:**
1. Check server logs for token errors
2. Verify token exists and is active
3. Check encryption key is correct
4. Try saving a new card

## Testing Steps

### Test 1: Save Card
1. Enable feature flags
2. Go to checkout
3. Select "Credit / Debit Card"
4. Check "Save card for faster checkout"
5. Complete payment
6. Check database for token
7. Check server logs for token extraction

### Test 2: Use Saved Card
1. Go to checkout again
2. Select "Credit / Debit Card"
3. Should see "Use saved card" checkbox
4. Select saved card from dropdown
5. Complete payment
6. Should use token (check logs for `[BENEFIT Init With Token]`)

## Server Logs to Monitor

### Successful Token Extraction
```
[BENEFIT Notify] Token received (udf7 or legacy field): 8678335532564...
[BENEFIT Notify] Faster Checkout fields: { udf7: '8678335532564...', udf8: 'FC', udf9: 'not present' }
```

### Token Storage Success
```
[BENEFIT Token Storage] Token stored successfully
```

### Token-Based Payment
```
[BENEFIT Init With Token] Using Faster Checkout: { udf7: '8678335532564...', udf8: 'FC' }
```

### Errors to Watch For
```
[BENEFIT Notify] No token found in response data
[BENEFIT Token Storage] Error: Token encryption key not configured
[BENEFIT Init With Token] Token not found or access denied
```

## Next Steps After Diagnosis

1. **If feature flags disabled:** Enable them
2. **If database table missing:** Run migration SQL
3. **If encryption key missing:** Generate and set it
4. **If token not in response:** Contact Benefit Pay support
5. **If token storage fails:** Check logs and fix errors
6. **If UI not showing:** Verify frontend flag and tokens exist

## Support Contacts

- **Benefit Pay Support:** Contact to enable tokenization for merchant account
- **Supabase Support:** For database issues
- **Vercel Support:** For environment variable issues

