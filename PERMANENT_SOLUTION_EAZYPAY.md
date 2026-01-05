# 🚨 PERMANENT SOLUTION FOR EAZYPAY "INVALID NUMBER OF INPUTS" ERROR

## Current Status

**Error:** "Invalid number of inputs" (Code: -4)  
**Status:** PERSISTS after trying:
- ✅ 3 fields (currency, amount, returnUrl) - FAILED
- ✅ 4 fields (appId, currency, amount, returnUrl) - FAILED
- ✅ Different key sets (POS vs PORTAL) - FAILED
- ✅ appId in header vs body - FAILED

---

## 🔧 What I Just Changed

**Trying snake_case field names:**
- `appId` → `app_id`
- `returnUrl` → `return_url`
- Keeping `currency` and `amount` as-is

**Why:** Many APIs (especially non-JavaScript APIs) use snake_case instead of camelCase.

---

## 🎯 If This Still Fails - PERMANENT SOLUTION

### Option 1: Contact EazyPay Support (RECOMMENDED)

**This error is too specific** - EazyPay knows exactly what they expect. We need their exact requirements.

**Email Template:**

```
Subject: URGENT - Checkout API createInvoice Error -4 "Invalid number of inputs"

Hi EazyPay Support,

I'm getting error -4 "Invalid number of inputs" when calling createInvoice.

**My Setup:**
- Endpoint: POST https://api.eazy.net/merchant/checkout/createInvoice
- App ID: [YOUR_APP_ID]
- Terminal ID: 30021461

**What I've Tried:**
1. camelCase fields (appId, returnUrl) - FAILED
2. snake_case fields (app_id, return_url) - FAILED
3. 3 fields vs 4 fields - BOTH FAILED

**My Questions:**
1. What are the EXACT required fields for createInvoice?
2. What field name format? (camelCase or snake_case?)
3. Should appId/app_id be in body, header, or neither?
4. Can you provide a working example request body?
5. Is there API documentation I can reference?

**Current Request:**
Headers:
- Content-Type: application/json
- Timestamp: [timestamp]
- Secret-Hash: [HMAC-SHA256 hash]

Body (tried multiple formats):
- { "app_id": "...", "currency": "BHD", "amount": "5.000", "return_url": "..." }
- { "appId": "...", "currency": "BHD", "amount": "5.000", "returnUrl": "..." }
- { "currency": "BHD", "amount": "5.000", "returnUrl": "..." }

All return error -4.

**URGENT:** Need exact requirements to complete integration.

Thank you!
```

---

### Option 2: Check EazyPay Dashboard for API Documentation

1. **Login to EazyPay Dashboard**
2. **Look for:**
   - "API Documentation" section
   - "Integration Guide"
   - "Developer Resources"
   - "API Reference"
3. **Check for:**
   - Example requests
   - Field requirements
   - Request/response formats

---

### Option 3: Try Different Endpoint Variations

The endpoint might be wrong. Try:

1. `/createInvoice` (current)
2. `/create-invoice` (hyphenated)
3. `/invoice` (short)
4. `/merchant/invoice/create` (different path)

---

### Option 4: Check if API Requires Additional Fields

Maybe we're missing required fields. Try adding:

```json
{
  "app_id": "...",
  "currency": "BHD",
  "amount": "5.000",
  "return_url": "...",
  "terminal_id": "30021461",  // Your Terminal ID
  "merchant_id": "...",        // If you have Merchant ID
  "description": "Order #123"  // Optional but might be required
}
```

---

## 📋 Action Plan

1. ✅ **Try checkout now** with snake_case fields
2. ❌ **If fails** → Contact EazyPay support (use email template above)
3. ❌ **If still fails** → Check EazyPay dashboard for API docs
4. ❌ **If still fails** → Try different endpoint paths
5. ❌ **If still fails** → Try adding terminal_id, merchant_id fields

---

## 🔍 Root Cause Analysis

**The error "Invalid number of inputs" means:**
- EazyPay is counting the fields
- We're not matching their exact count/names
- This is a **validation error**, not authentication

**Possible causes:**
1. Wrong field names (camelCase vs snake_case)
2. Missing required fields
3. Extra fields that shouldn't be there
4. Wrong endpoint
5. API version mismatch

---

## 💡 Bottom Line

**We've exhausted all guessing.** The only permanent solution is to get EazyPay's exact API requirements.

**Next step:** Contact EazyPay support with the email template above.




