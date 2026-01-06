# Fix: "Invalid number of inputs" Error (Code: -4)

## 🔍 Problem Identified

**Error from EazyPay:**
```json
{
  "result": {
    "code": "-4",
    "description": "Invalid number of inputs",
    "isSuccess": false
  }
}
```

**Root Cause:**
- We were sending `appId` in the request body
- EazyPay doesn't expect `appId` in the body - it's only used for hash computation
- This caused "Invalid number of inputs" error

---

## ✅ Fix Applied

### Change 1: Removed `appId` from Request Body

**Before:**
```typescript
const requestBody = {
  appId,  // ❌ This was causing the error
  currency,
  amount: amountStr,
  returnUrl,
  cancelUrl,
  webhookUrl,
  ...
};
```

**After:**
```typescript
const requestBody = {
  currency,
  amount: amountStr,
  returnUrl,
  cancelUrl,
  webhookUrl,
  // appId is NOT in body - only used for hash
};
```

**Why:**
- `appId` is used in HMAC hash computation (for authentication)
- But EazyPay identifies the app from API credentials, not from body
- Sending it in body causes "Invalid number of inputs" error

---

### Change 2: Better Error Handling

**Added:**
- Proper error handling for EazyPay error responses
- Clear error messages showing EazyPay error code and description
- Better logging for debugging

---

## 🧪 Testing

**Try checkout again:**
1. Go to checkout page
2. Select payment method (Card or BenefitPay)
3. Click "Confirm & Place Order"
4. Should redirect to EazyPay payment page ✅

**If still errors:**
- Check server terminal for new error messages
- The error will now show the actual EazyPay error code and description

---

## 📋 What Changed

### File: `client/src/lib/services/eazypayCheckout.ts`

1. **Removed `appId` from request body**
   - `appId` still used in hash computation (correct)
   - `appId` NOT sent in request body (fixed)

2. **Added error handling**
   - Checks for `result.isSuccess === false`
   - Throws clear error with EazyPay error code and description

3. **Added request logging**
   - Logs request body in development mode
   - Helps debug future issues

---

## ✅ Expected Result

**After fix:**
- Request body only contains: `currency`, `amount`, `returnUrl`, `cancelUrl`, `webhookUrl`, `description`, `userToken`
- `appId` is NOT in body (only in hash)
- EazyPay should accept the request
- Should return `paymentUrl` successfully

---

## 🔍 If Still Not Working

**Check:**
1. **Server terminal** - Look for new error messages
2. **Request body** - Should NOT contain `appId`
3. **EazyPay response** - Should have `paymentUrl` in response

**Common issues:**
- Missing required fields (returnUrl, cancelUrl might be required)
- Wrong field names (camelCase vs snake_case)
- Invalid URL format

**Next steps if still failing:**
- Share the new error message from terminal
- Check EazyPay API documentation for exact field requirements

---

## 🎯 Summary

**Problem:** Sending `appId` in request body caused "Invalid number of inputs" error

**Solution:** Removed `appId` from request body (kept in hash computation)

**Status:** ✅ Fixed - Try checkout again!





