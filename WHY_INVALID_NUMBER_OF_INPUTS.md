# Why "Invalid Number of Inputs" Error? - Complete Explanation

## 🔍 What This Error Means

**Error Code: -4**  
**Message: "Invalid number of inputs"**

This error means:
- ✅ EazyPay **received** your request
- ✅ Your **authentication** (hash) is working (otherwise you'd get auth error)
- ❌ The **number of fields** in your request body doesn't match what EazyPay expects

**Think of it like this:**
- EazyPay expects exactly 3 fields → You send 4 → Error
- EazyPay expects exactly 5 fields → You send 3 → Error
- EazyPay expects specific field names → You use wrong names → Error

---

## 🎯 Why It's Happening

**Root Cause:** We don't have EazyPay's exact API specification.

**What we know:**
- ✅ Endpoint: `POST https://api.eazy.net/merchant/checkout/createInvoice`
- ✅ Authentication: HMAC-SHA256 hash works (no auth errors)
- ❌ **Exact field requirements: UNKNOWN**

**What we've tried:**
1. ❌ 3 fields: `currency`, `amount`, `returnUrl` → FAILED
2. ❌ 4 fields: `appId`, `currency`, `amount`, `returnUrl` → FAILED
3. ❌ 5 fields: `app_id`, `currency`, `amount`, `return_url`, `terminal_id` → FAILED
4. ❌ camelCase field names → FAILED
5. ❌ snake_case field names → FAILED
6. ❌ Different API keys (POS vs PORTAL) → FAILED

**Conclusion:** EazyPay expects a **specific combination** we haven't found yet.

---

## 🔧 Possible Reasons

### 1. Wrong Field Names
**Maybe EazyPay expects:**
- `appId` (not `app_id`)
- `returnUrl` (not `return_url`)
- `terminalId` (not `terminal_id`)

**OR:**
- `app_id` (not `appId`)
- `return_url` (not `returnUrl`)
- `terminal_id` (not `terminalId`)

**We've tried both - both failed.**

---

### 2. Missing Required Fields
**Maybe EazyPay requires fields we're not sending:**
- `merchant_id` (your merchant ID)
- `description` (order description)
- `webhook_url` (webhook URL)
- `cancel_url` (cancel URL)
- `user_token` (user token)

**We haven't tried all combinations yet.**

---

### 3. Extra Fields Not Allowed
**Maybe EazyPay doesn't want:**
- `terminal_id` (maybe it's derived from API key)
- `app_id` (maybe it's in headers only)

**We've tried with and without - both failed.**

---

### 4. Wrong Endpoint Path
**Current:** `/merchant/checkout/createInvoice`

**Maybe it should be:**
- `/merchant/checkout/create-invoice` (hyphenated)
- `/merchant/invoice/create`
- `/checkout/createInvoice`
- `/api/checkout/createInvoice`

**We haven't tried different paths yet.**

---

### 5. Wrong API Version
**Maybe the API changed:**
- Old version expects 3 fields
- New version expects 5 fields
- We're using wrong version

**We don't know the API version.**

---

## ✅ THE PERMANENT SOLUTION

### **Contact EazyPay Support - This is the ONLY way**

**Why:**
- We've exhausted all guessing
- The error is too specific
- Only EazyPay knows their exact requirements

**What to ask:**
1. Exact required fields for `createInvoice`
2. Field name format (camelCase vs snake_case)
3. Working example request body
4. API documentation link

**Email template:** See `EMAIL_TO_EAZYPAY_SUPPORT.md`

---

## 🚀 What We Can Try While Waiting

### Option 1: Try Different Endpoint Paths

```typescript
// Try these endpoints one by one:
1. https://api.eazy.net/merchant/checkout/create-invoice (hyphenated)
2. https://api.eazy.net/merchant/invoice/create
3. https://api.eazy.net/checkout/createInvoice
```

### Option 2: Try Adding More Fields

```json
{
  "app_id": "...",
  "currency": "BHD",
  "amount": "5.000",
  "return_url": "...",
  "terminal_id": "30021461",
  "description": "Order #123",
  "webhook_url": "https://helloonebahrain.com/api/payments/eazypay/webhook",
  "cancel_url": "https://helloonebahrain.com/checkout/payment"
}
```

### Option 3: Try Removing terminal_id

Maybe `terminal_id` is not allowed (it's derived from API key):

```json
{
  "app_id": "...",
  "currency": "BHD",
  "amount": "5.000",
  "return_url": "..."
}
```

---

## 📋 Action Plan

1. ✅ **Send email to EazyPay support** (use `EMAIL_TO_EAZYPAY_SUPPORT.md`)
2. ⏳ **While waiting**, try different endpoint paths
3. ⏳ **While waiting**, try adding/removing fields
4. ✅ **Once EazyPay responds**, update code with exact requirements

---

## 💡 Bottom Line

**The error "Invalid number of inputs" means:**
- Your request structure doesn't match EazyPay's expectations
- We need their exact API specification
- **Contacting EazyPay support is the only permanent solution**

**Don't give up!** Once EazyPay provides the exact requirements, we'll fix it in 5 minutes.




