# How Benefit Pay Token Generation and Storage Works

## Complete Token Flow Explained

### Step 1: User Initiates Payment with "Save Card" Checked

**Frontend (`/checkout/payment`):**
1. User selects "Credit / Debit Card" payment method
2. User checks "Save card for faster checkout" checkbox
3. Frontend sends request to backend:
   ```javascript
   POST /api/payments/benefit/init
   {
     sessionId: "...",
     amount: 5.000,
     currency: "BHD",
     saveCard: true  // ← This flag requests tokenization
   }
   ```

**Backend (`/api/payments/benefit/init`):**
1. Receives `saveCard: true` parameter
2. Builds payment request with `udf8="FC"` flag:
   ```json
   {
     "amt": "5.000",
     "trackId": "1234567890",
     "udf8": "FC",  // ← Requests tokenization from Benefit Pay
     "responseURL": "...",
     "errorURL": "..."
   }
   ```
3. Encrypts and sends to Benefit Pay gateway
4. Returns payment URL to frontend

### Step 2: User Completes Payment on Benefit Pay Gateway

**Benefit Pay Gateway:**
1. Shows payment page with card form
2. User enters card details and PIN
3. User checks "Save your card details for future payments" checkbox (on Benefit Pay page)
4. Benefit Pay processes payment
5. **If payment successful AND user checked save box:**
   - Benefit Pay generates a **token ID** (e.g., `8678335532564`)
   - Token is stored in Benefit Pay's secure system
   - Token ID is included in payment response

### Step 3: Benefit Pay Returns Payment Response

**Benefit Pay sends response in two ways:**

#### A. Webhook Notification (Server-to-Server)
- **Endpoint:** `/api/payments/benefit/notify`
- **Method:** POST (from Benefit Pay servers)
- **Data:** Encrypted `trandata` containing:
  ```json
  {
    "result": "CAPTURED",
    "paymentId": "100202101126099171",
    "trackId": "1234567890",
    "udf7": "8678335532564",  // ← TOKEN ID HERE
    "udf8": "FC",
    "amt": "5.000",
    "authRespCode": "00"
  }
  ```

#### B. Browser Redirect (User Return)
- **Endpoint:** `/pay/benefit/response?trandata=...`
- **Method:** GET (browser redirect)
- **Data:** Same encrypted `trandata` in URL parameter

### Step 4: Backend Extracts Token from Response

**In `/api/payments/benefit/notify` or `/api/payments/benefit/process-response`:**

1. **Decrypts trandata** using `BENEFIT_RESOURCE_KEY`
2. **Parses response** to get `responseData` object
3. **Extracts token** from `udf7` field:
   ```javascript
   const token = responseData.udf7 || 
                 responseData.token || 
                 responseData.paymentToken || 
                 // ... other fallback fields
   ```
4. **Checks if feature is enabled:**
   ```javascript
   if (process.env.BENEFIT_FASTER_CHECKOUT_ENABLED === 'true' && 
       isSuccessful && 
       session.user_id) {
     // Process token...
   }
   ```

### Step 5: Backend Stores Token in Database

**In `storePaymentToken()` function:**

1. **Encrypts token** using AES-256-GCM:
   ```javascript
   const encryptedToken = encryptToken(token, BENEFIT_TOKEN_ENCRYPTION_KEY);
   ```

2. **Extracts card metadata** from response:
   - `card_alias`: "Visa ****1234"
   - `last_4_digits`: "1234"
   - `card_type`: "VISA"

3. **Stores in database:**
   ```sql
   INSERT INTO benefit_payment_tokens (
     user_id,
     token,           -- Encrypted token
     token_hash,      -- SHA-256 hash for duplicate detection
     card_alias,
     last_4_digits,
     card_type,
     is_default,
     payment_id,
     order_id,
     status
   ) VALUES (...)
   ```

### Step 6: Token is Now Available for Future Payments

**On next checkout:**
1. Frontend fetches saved tokens: `GET /api/payments/benefit/tokens`
2. Shows dropdown with saved cards
3. User selects saved card
4. Frontend sends: `POST /api/payments/benefit/init-with-token` with `tokenId`
5. Backend decrypts token and includes in payment request:
   ```json
   {
     "udf7": "8678335532564",  // Token ID
     "udf8": "FC"              // Faster Checkout flag
   }
   ```
6. Benefit Pay shows pre-filled card (user only enters PIN)

---

## Why Tokens Might Not Be Saving

### Issue 1: Feature Flag Not Enabled in Production ⚠️ MOST COMMON

**Symptom:** No token extraction logs in Vercel

**Check:**
- Vercel Dashboard → Settings → Environment Variables
- `BENEFIT_FASTER_CHECKOUT_ENABLED=true` must be set

**Fix:**
1. Add variable to Vercel
2. Redeploy application

### Issue 2: Benefit Pay Not Returning Token ⚠️ SECOND MOST COMMON

**Symptom:** Logs show `udf7: 'not present'` or `udf7: null`

**This means:**
- Benefit Pay gateway is NOT generating/returning the token
- Tokenization feature not enabled for your merchant account
- OR you didn't include `udf8="FC"` in the payment request

**Check logs for:**
```
[BENEFIT Notify] ResponseData sample: { udf7: null, ... }
```

**Fix:**
1. Contact Benefit Pay support
2. Request Faster Checkout/Tokenization activation
3. Verify merchant account has feature enabled
4. Confirm they return token in `udf7` field

### Issue 3: saveCard Flag Not Passed

**Symptom:** `udf8="FC"` not in payment request

**Check:**
- Did user check "Save card for faster checkout" checkbox?
- Is frontend passing `saveCard: true` to API?

**Fix:**
- Code already fixed to pass `saveCard` flag
- Ensure checkbox is visible and checked

### Issue 4: Database Table Missing

**Symptom:** Error: `relation "benefit_payment_tokens" does not exist`

**Fix:**
- Run `ADD_BENEFIT_FASTER_CHECKOUT.sql` in Supabase

### Issue 5: Encryption Key Missing

**Symptom:** Error: `Token encryption key not configured`

**Fix:**
- Set `BENEFIT_TOKEN_ENCRYPTION_KEY` in Vercel

---

## How to Verify Token Generation

### Check 1: Verify saveCard Flag is Sent

**In browser console (before payment):**
- Check network tab for `/api/payments/benefit/init`
- Request body should include: `saveCard: true`

### Check 2: Verify udf8="FC" in Payment Request

**In Vercel logs (when payment initiated):**
- Look for: `[BENEFIT Init] Plain trandata:`
- Should contain: `"udf8": "FC"`

### Check 3: Verify Token in Response

**In Vercel logs (after payment):**
- Look for: `[BENEFIT Notify] ResponseData sample:`
- Check `udf7` value:
  - ✅ If present: Token was returned
  - ❌ If null: Token NOT returned (contact Benefit Pay)

### Check 4: Verify Token Storage

**In Vercel logs:**
- Look for: `[BENEFIT Notify] Token storage completed successfully`
- OR: `[BENEFIT Notify] Token storage failed: [error]`

**In Supabase:**
```sql
SELECT * FROM benefit_payment_tokens 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## Token Generation Requirements

For Benefit Pay to generate and return a token:

1. ✅ **Merchant account must have Faster Checkout enabled**
   - Contact Benefit Pay support to activate

2. ✅ **Payment request must include `udf8="FC"`**
   - Code already does this when `saveCard=true`

3. ✅ **User must check "Save card" on Benefit Pay page**
   - This is on Benefit Pay's payment page (not your site)

4. ✅ **Payment must be successful**
   - Failed payments don't generate tokens

---

## Summary

**Token Flow:**
```
User checks "Save card" 
  → Frontend sends saveCard=true 
  → Backend includes udf8="FC" 
  → Benefit Pay processes payment 
  → Benefit Pay generates token 
  → Benefit Pay returns token in udf7 
  → Backend extracts udf7 
  → Backend encrypts and stores token 
  → Token available for future payments
```

**Most Common Issue:**
Benefit Pay is not returning the token because:
- Tokenization not enabled for merchant account
- OR feature flag not set in production

**Next Steps:**
1. Check Vercel logs for `udf7` value
2. If `udf7` is null → Contact Benefit Pay
3. If `udf7` has value but not saving → Check database/encryption key

