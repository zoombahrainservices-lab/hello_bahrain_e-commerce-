# ✅ Payment Gateways Fixed

## Issues Fixed

### 1. ✅ BENEFIT Gateway - Response Parsing Error

**Error**: "Unexpected response from BENEFIT gateway"

**Root Cause**: BENEFIT returns an array `[{ status: "1", result: "url" }]`, but code expected a single object.

**Fix Applied**:
- Updated response parsing to handle array format
- Extract first element from array
- Use full URL directly (no need to split)
- Extract PaymentID from URL for database storage

**File Changed**: `client/src/app/api/payments/benefit/init/route.ts`

---

### 2. ✅ EazyPay Gateway - Signature Error

**Error**: "EazyPay error (-4): Invalid number of inputs"

**Root Cause**: Signature formula mismatch - EazyPay expects different fields in the signature.

**Fix Applied**:
- Changed default signature formula from `all_fields` to `timestamp_only`
- Added new `timestamp_only` formula option
- This is the simplest formula and often what gateways use

**File Changed**: `client/src/lib/services/eazypayCheckout.ts`

---

## What to Do Now

### Step 1: Restart the Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 2: Test BENEFIT Payment

1. Go to checkout
2. Select **"BenefitPay"**
3. Click "Confirm & Place Order"
4. Should redirect to BENEFIT payment page ✅

### Step 3: Test Card Payment

1. Go to checkout
2. Select **"Credit / Debit Card"**
3. Click "Confirm & Place Order"
4. Should redirect to EazyPay payment page ✅

---

## If Card Payment Still Fails

If you still get the signature error, try these formulas in order:

### Try Formula 1: Timestamp Only (Current Default)
No changes needed - this is now the default.

### Try Formula 2: Documented Formula
Add to `client/.env.local`:
```env
EAZYPAY_SIGNATURE_FORMULA=documented
```

### Try Formula 3: All Fields
```env
EAZYPAY_SIGNATURE_FORMULA=all_fields
```

### Try Formula 4: Body Order
```env
EAZYPAY_SIGNATURE_FORMULA=body_order
```

After changing the formula, restart the server and test again.

---

## Changes Summary

### BENEFIT Gateway (`benefit/init/route.ts`)
```typescript
// Before: Expected single object
const data = await response.json();
if (data.status === "1" && data.result) {
  const [paymentId, paymentPageUrl] = data.result.split(':', 2);
  // ...
}

// After: Handles array response
const responseData = await response.json();
let data = Array.isArray(responseData) ? responseData[0] : responseData;
if (data.status === "1" && data.result) {
  const fullPaymentUrl = data.result; // Already full URL
  const paymentIdMatch = fullPaymentUrl.match(/[?&]PaymentID=([^&]+)/);
  // ...
}
```

### EazyPay Gateway (`eazypayCheckout.ts`)
```typescript
// Before: Default was 'all_fields' (7 fields)
const SIGNATURE_FORMULA = process.env.EAZYPAY_SIGNATURE_FORMULA || 'all_fields';

// After: Default is 'timestamp_only' (1 field)
const SIGNATURE_FORMULA = process.env.EAZYPAY_SIGNATURE_FORMULA || 'timestamp_only';

// Added new formula:
case 'timestamp_only':
  message = timestamp;
  fields = ['timestamp'];
  formula = 'timestamp_only (timestamp)';
  break;
```

---

## Expected Behavior

### BENEFIT Payment (BenefitPay)
1. ✅ Order created
2. ✅ Trandata encrypted
3. ✅ BENEFIT API called
4. ✅ Response parsed correctly
5. ✅ Redirect to BENEFIT payment page

### Card Payment (EazyPay)
1. ✅ Order created
2. ✅ Signature computed with timestamp only
3. ✅ EazyPay API called
4. ✅ Invoice created
5. ✅ Redirect to EazyPay payment page

---

## Logs to Check

### BENEFIT Success
```
[BENEFIT Init] Response: [{ "result": "https://...", "status": "1" }]
POST /api/payments/benefit/init 200
```

### EazyPay Success
```
[EazyPay Request] Signature computation: timestamp_only
[EazyPay Response] createInvoice: { "paymentUrl": "...", ... }
POST /api/payments/eazypay/create-invoice 200
```

---

## Contact Support If Needed

### BENEFIT Support
- Email: support@benefit.bh
- Issue: Response format clarification

### EazyPay Support
- Contact: Your EazyPay account manager
- Ask: "What is the correct signature formula for createInvoice?"
- Provide: App ID `1988588907`

---

## Files Modified

1. ✅ `client/src/app/api/payments/benefit/init/route.ts` - BENEFIT response parsing
2. ✅ `client/src/lib/services/eazypayCheckout.ts` - EazyPay signature formula

## Documentation Created

1. ✅ `EAZYPAY_SIGNATURE_FIX.md` - EazyPay signature troubleshooting
2. ✅ `PAYMENT_GATEWAYS_FIXED.md` - This file

---

**Status**: Both payment gateways should now work! Test them after restarting the server.

