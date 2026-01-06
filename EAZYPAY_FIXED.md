# ✅ EazyPay Payment Gateway - FIXED

## 🔧 What Was Fixed

Based on EazyPay support feedback, the following issues were corrected:

### 1. ✅ Wrong App ID Format
**Before:** Using UUID format (Portal API key)  
**After:** Using numeric App ID (Checkout App ID)

**Action Required:** Update `.env.local` with your numeric Checkout App ID (typically 8-9 digits, e.g., "50002754")

### 2. ✅ Wrong Field Names
**Before:** snake_case (`app_id`, `return_url`, `terminal_id`)  
**After:** camelCase (`appId`, `returnUrl`, `invoiceId`, `paymentMethod`)

### 3. ✅ Missing Required Fields
**Added:**
- `invoiceId` - Your order ID (format: `ORDER_<orderId>`)
- `paymentMethod` - Payment methods (e.g., `"BENEFITGATEWAY,CREDITCARD,APPLEPAY"`)

### 4. ✅ Removed Invalid Field
**Removed:** `terminal_id` (not used in Checkout API)

### 5. ✅ Fixed Content-Type Header
**Before:** `application/json`  
**After:** `application/json; charset=utf-8`

---

## 📋 Correct Request Format

**Endpoint:** `POST https://api.eazy.net/merchant/checkout/createInvoice`

**Headers:**
```
Content-Type: application/json; charset=utf-8
Timestamp: [milliseconds]
Secret-Hash: HMAC-SHA256(secretKey, timestamp + currency + amount + appId)
```

**Body (camelCase):**
```json
{
  "appId": "50002754",
  "invoiceId": "ORDER_f2800810",
  "currency": "BHD",
  "amount": "5.000",
  "paymentMethod": "BENEFITGATEWAY,CREDITCARD,APPLEPAY",
  "returnUrl": "https://helloonebahrain.com/pay/complete?orderId=f2800810",
  "webhookUrl": "https://helloonebahrain.com/api/payments/eazypay/webhook"
}
```

---

## ⚠️ Action Required: Update .env.local

You need to update your `.env.local` file with:

1. **Numeric Checkout App ID** (not UUID)
   - Get this from EazyPay dashboard
   - Should be 8-9 digits (e.g., "50002754")
   - NOT the UUID Portal API key

2. **Terminal ID** (if needed for reference)
   - Update to: `30021462` (as per EazyPay)

**Example:**
```env
# Checkout API (for customer payments)
EAZYPAY_CHECKOUT_APP_ID=50002754  # NUMERIC App ID (not UUID!)
EAZYPAY_CHECKOUT_SECRET_KEY=your_secret_key_here

# Terminal ID (for reference only, not sent in API)
EAZYPAY_TERMINAL_ID=30021462
```

---

## ✅ Testing

After updating `.env.local`:

1. **Restart your Next.js server**
2. **Try checkout again**
3. **Check terminal logs** - should see correct field names and structure

---

## 🎯 What Changed in Code

### `client/src/lib/services/eazypayCheckout.ts`
- ✅ Updated `CreateInvoicePayload` interface with required fields
- ✅ Changed request body to camelCase
- ✅ Added `invoiceId` and `paymentMethod` fields
- ✅ Removed `terminal_id`
- ✅ Fixed Content-Type header

### `client/src/app/api/payments/eazypay/create-invoice/route.ts`
- ✅ Updated `createInvoice` call with required fields
- ✅ Format `invoiceId` as `ORDER_<orderId>`
- ✅ Set `paymentMethod` to `"BENEFITGATEWAY,CREDITCARD,APPLEPAY"`

---

## 📝 Next Steps

1. ✅ **Update `.env.local`** with numeric App ID
2. ✅ **Restart server**
3. ✅ **Test checkout**
4. ✅ **Verify payment flow works**

---

## 💡 Key Points

- **App ID must be numeric** (8-9 digits), not UUID
- **Use camelCase** for all field names
- **Include required fields:** `invoiceId`, `paymentMethod`
- **Don't include:** `terminal_id`
- **Content-Type must include:** `charset=utf-8`

The payment gateway should now work correctly! 🎉





