# EazyPay Payment Gateway Flow Verification

## ✅ Flow Comparison: Guide vs Implementation

### STEP 1: Customer Clicks "Pay Now" ✅
**Guide:** Customer clicks on checkout page  
**Our Implementation:** ✅ `/checkout/payment` page - customer selects payment method and clicks "Confirm & Place Order"

---

### STEP 2: Backend Creates Payment ✅
**Guide:** 
- POST `https://api.eazy.net/merchant/checkout/createInvoice`
- Send: App ID, order ID, amount, return URL, webhook URL

**Our Implementation:**
- ✅ Endpoint: `POST /api/payments/eazypay/create-invoice`
- ✅ Calls: `POST https://api.eazy.net/merchant/checkout/createInvoice`
- ✅ Sends: appId, currency, amount, returnUrl, cancelUrl, description
- ⚠️ **MISSING:** webhookUrl parameter (optional but recommended)

**Status:** ✅ Works, but should add webhookUrl

---

### STEP 3: Redirect Customer to EazyPay ✅
**Guide:** Frontend receives paymentUrl and redirects browser

**Our Implementation:**
- ✅ Receives `paymentUrl` from backend
- ✅ Redirects: `window.location.href = paymentUrl`
- ✅ Customer pays on EazyPay's secure page

**Status:** ✅ Perfect match

---

### STEP 4: Customer Returns to Website ✅
**Guide:** eazyPay redirects to returnUrl with globalTransactionsId

**Our Implementation:**
- ✅ Return URL: `/pay/complete?orderId={orderId}`
- ✅ Page exists: `client/src/app/pay/complete/page.tsx`
- ✅ Extracts orderId from URL

**Status:** ✅ Perfect match

---

### STEP 5: Backend Confirms Payment ⚠️ NEEDS FIX
**Guide:**
- POST `https://api.eazy.net/merchant/checkout/query`
- Send: App ID, globalTransactionsId

**Our Implementation:**
- ✅ Endpoint: `POST /api/payments/eazypay/query`
- ⚠️ **ISSUE:** Uses GET instead of POST
- Current: `GET https://api.eazy.net/merchant/checkout/query?globalTransactionsId=...`
- Should be: `POST https://api.eazy.net/merchant/checkout/query` with body

**Status:** ⚠️ **NEEDS FIX** - Change query to POST method

---

### STEP 6: Webhook Receives Confirmation ✅
**Guide:**
- eazyPay sends POST to webhookUrl
- Verify Eazy-Signature
- Update order as PAID

**Our Implementation:**
- ✅ Endpoint: `POST /api/payments/eazypay/webhook`
- ✅ Verifies signature: HMAC-SHA256(secret, timestamp + nonce + globalTransactionsId + isPaid)
- ✅ Updates order idempotently
- ⚠️ **NOTE:** Webhook URL not set in createInvoice (should add)

**Status:** ✅ Works, but webhookUrl should be added to createInvoice

---

## 🔧 Issues Found & Fixes Needed

### Issue 1: Query Transaction Uses GET Instead of POST
**File:** `client/src/lib/services/eazypayCheckout.ts` (line 152)

**Current:**
```typescript
const response = await fetch(
  `${CHECKOUT_BASE_URL}/query?globalTransactionsId=${encodeURIComponent(globalTransactionsId)}`,
  {
    method: 'GET',  // ❌ Wrong
    ...
  }
);
```

**Should be:**
```typescript
const response = await fetch(`${CHECKOUT_BASE_URL}/query`, {
  method: 'POST',  // ✅ Correct
  headers: {
    'Content-Type': 'application/json',
    'Timestamp': timestamp,
    'Secret-Hash': secretHash,
  },
  body: JSON.stringify({
    appId,
    globalTransactionsId,
  }),
  ...
});
```

### Issue 2: Missing webhookUrl in Create Invoice
**File:** `client/src/app/api/payments/eazypay/create-invoice/route.ts`

**Should add:**
```typescript
const webhookUrl = `${baseUrl}/api/payments/eazypay/webhook`;

// In createInvoice call:
const invoiceResponse = await createInvoice({
  ...
  webhookUrl,  // Add this
});
```

### Issue 3: Query Hash May Need Update
If query changes to POST, the hash computation might need to include the request body.

---

## ✅ What's Correct

1. ✅ Base URL: `https://api.eazy.net/merchant/checkout`
2. ✅ Create Invoice endpoint: `/createInvoice`
3. ✅ HMAC signing for createInvoice
4. ✅ Frontend redirect flow
5. ✅ Return page implementation
6. ✅ Webhook signature verification
7. ✅ Order status updates
8. ✅ Server-side only (no browser calls to EazyPay)

---

## 📋 Summary

**Matches Guide:** ✅ 5/6 steps  
**Needs Fix:** ⚠️ 1 step (Query Transaction method)

**Quick Fix Required:**
1. Change query transaction from GET to POST
2. Add webhookUrl to createInvoice (optional but recommended)

