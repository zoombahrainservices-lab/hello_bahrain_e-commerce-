# EazyPay Payment Gateway - Quick Reference

## 🔑 Critical Implementation Details

### 1. Return URL Format

**EazyPay automatically appends `globalTransactionsId` to your returnUrl:**

```
Your returnUrl:  /pay/complete?orderId=123
EazyPay sends:   /pay/complete?orderId=123&globalTransactionsId=abc...
```

**Your code handles this:**
- ✅ Return page reads `globalTransactionsId` from URL
- ✅ Query endpoint accepts `globalTransactionsId` (preferred) or `orderId` (fallback)
- ✅ Security: Verifies `globalTransactionsId` belongs to user's order

---

### 2. HMAC Hash Computation

#### Create Invoice Hash

**Formula:**
```
HMAC-SHA256(secretKey, timestamp + currency + amount + appId)
```

**Example:**
```
timestamp:  "1704067200000"
currency:    "BHD"
amount:      "80.000"  (MUST be 3 decimals)
appId:       "50002754"

Message:     "1704067200000" + "BHD" + "80.000" + "50002754"
           = "1704067200000BHD80.00050002754"

Hash:        HMAC-SHA256(secretKey, "1704067200000BHD80.00050002754")
```

**Critical:**
- ✅ Amount MUST be formatted to 3 decimals: `parseFloat(amount).toFixed(3)`
- ✅ Same formatted amount used in hash AND request body
- ✅ No separators, no spaces in concatenation

#### Query Hash

**Formula:**
```
HMAC-SHA256(secretKey, timestamp + appId)
```

**Example:**
```
timestamp:  "1704067200000"
appId:      "50002754"

Message:   "1704067200000" + "50002754"
         = "170406720000050002754"

Hash:      HMAC-SHA256(secretKey, "170406720000050002754")
```

**Critical:**
- ✅ No separators, no spaces
- ✅ Exact string concatenation

#### Webhook Signature Verification

**Formula:**
```
HMAC-SHA256(secretKey, timestamp + nonce + globalTransactionsId + isPaid)
```

**Example:**
```
timestamp:            "1704067200000"
nonce:               "unique-nonce-123"
globalTransactionsId: "abc123xyz"
isPaid:              "true"  (or "false" as string)

Message:   "1704067200000" + "unique-nonce-123" + "abc123xyz" + "true"
         = "1704067200000unique-nonce-123abc123xyztrue"

Hash:      HMAC-SHA256(secretKey, "1704067200000unique-nonce-123abc123xyztrue")
```

**Critical:**
- ✅ `isPaid` converted to string: `String(isPaid)`
- ✅ No separators, no spaces

---

### 3. Amount Formatting

**CRITICAL:** Amount must be formatted to 3 decimal places

```typescript
// ❌ WRONG
amount: "80"
amount: "80.0"
amount: 80

// ✅ CORRECT
amount: "80.000"
```

**Implementation:**
```typescript
const amountFormatted = parseFloat(amount.toString()).toFixed(3);
// Result: "80.000"
```

**Why:**
- EazyPay expects 3 decimal places
- Hash computation must match request body exactly
- Mismatch causes signature verification to fail

---

### 4. Payment Flow

```
1. Customer clicks "Pay Now"
   → POST /api/payments/eazypay/create-invoice
   → Returns: { paymentUrl, globalTransactionsId }

2. Redirect to paymentUrl
   → Customer pays on EazyPay

3. EazyPay redirects back
   → /pay/complete?orderId=123&globalTransactionsId=abc...
   → EazyPay appends globalTransactionsId automatically

4. Return page queries payment
   → POST /api/payments/eazypay/query
   → Body: { globalTransactionsId: "abc..." }  (from URL)
   → Verifies payment with EazyPay
   → Updates order if PAID

5. Webhook confirms (async)
   → POST /api/payments/eazypay/webhook
   → Verifies signature
   → Updates order idempotently
   → Returns 200 quickly
```

---

### 5. Status Handling

#### PENDING Status

**When:** Payment is processing (not yet finalized)

**Handling:**
1. Query returns `status: "PENDING"`
2. Show "Processing..." to user
3. Poll query endpoint (up to 3 times, every 3 seconds)
4. If still PENDING, wait for webhook
5. Webhook will finalize when ready

**Code:**
```typescript
if (data.status === 'PENDING') {
  // Poll query endpoint
  // Show "Processing..." message
  // Wait for webhook
}
```

#### PAID Status

**When:** Payment confirmed

**Handling:**
1. Query returns `isPaid: true`
2. Update order status to "paid"
3. Show success message
4. Redirect to order details

#### CANCELED Status

**When:** Payment cancelled

**Handling:**
1. Query returns `status: "CANCELED"`
2. Show failure message
3. Allow retry

---

### 6. Security Checklist

- ✅ All API calls server-side only
- ✅ No secrets in frontend
- ✅ Webhook signature verified
- ✅ Order ownership verified
- ✅ Idempotent updates
- ✅ Amount formatting exact
- ✅ Hash computation exact

---

### 7. Environment Variables

```env
# Required
EAZYPAY_CHECKOUT_APP_ID=your_app_id
EAZYPAY_CHECKOUT_SECRET_KEY=your_secret_key
CLIENT_URL=https://helloonebahrain.com

# Optional (for Portal APIs)
EAZYPAY_PORTAL_API_KEY=your_portal_key
EAZYPAY_PORTAL_SECRET_KEY=your_portal_secret
```

---

### 8. Debugging Hash Issues

**If signature verification fails:**

1. **Check amount formatting:**
   ```typescript
   console.log('Amount:', parseFloat(amount).toFixed(3));
   // Should be: "80.000" not "80" or "80.0"
   ```

2. **Check hash message:**
   ```typescript
   // Create Invoice
   const message = timestamp + currency + amount + appId;
   console.log('Hash message:', message);
   // Should be: "1704067200000BHD80.00050002754"
   ```

3. **Check request body:**
   ```typescript
   console.log('Request body:', {
     appId,
     currency,
     amount,  // Must match hash
   });
   ```

4. **Enable debug logging:**
   - Set `NODE_ENV=development`
   - Check console for hash debug logs

---

### 9. Common Issues

#### Issue: Signature verification fails

**Cause:** Amount format mismatch or hash message incorrect

**Fix:**
- Ensure amount is 3 decimals: `parseFloat(amount).toFixed(3)`
- Use same formatted amount in hash and request body
- Check no separators in hash message

#### Issue: globalTransactionsId not found

**Cause:** Return URL doesn't have globalTransactionsId

**Fix:**
- EazyPay appends it automatically
- Check URL parameters in return page
- Fallback to orderId lookup if needed

#### Issue: Webhook not received

**Cause:** Webhook URL not configured or not accessible

**Fix:**
- Set webhook URL in EazyPay dashboard
- Ensure URL is publicly accessible
- Check webhook logs

---

### 10. Testing Checklist

- [ ] Create invoice with correct amount format
- [ ] Verify hash computation matches EazyPay
- [ ] Test return URL with globalTransactionsId
- [ ] Test query with globalTransactionsId
- [ ] Test query with orderId (fallback)
- [ ] Test webhook signature verification
- [ ] Test PENDING status handling
- [ ] Test idempotent updates
- [ ] Test error scenarios

---

## ✅ Quick Verification

**To verify your implementation is correct:**

1. **Check amount formatting:**
   ```typescript
   const amount = parseFloat("80").toFixed(3);
   // Should be: "80.000"
   ```

2. **Check hash message:**
   ```typescript
   const message = timestamp + currency + amount + appId;
   // Should be: "1704067200000BHD80.00050002754"
   // No separators, no spaces
   ```

3. **Check return URL handling:**
   ```typescript
   // URL: /pay/complete?orderId=123&globalTransactionsId=abc...
   const globalTransactionsId = searchParams.get('globalTransactionsId');
   // Should extract: "abc..."
   ```

4. **Check webhook signature:**
   ```typescript
   const message = timestamp + nonce + globalTransactionsId + String(isPaid);
   // Should match EazyPay's signature
   ```

---

**Status:** ✅ All critical details documented

