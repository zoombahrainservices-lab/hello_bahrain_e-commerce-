# ✅ EazyPay Checkout API - Verified Against Official Spec

## 📋 API Documentation Reference

**Source:** EazyPay™ Checkout Payment API v1.7  
**URL:** https://apidocs.eazy.net/eazycheckout/swagger/eazyCheckoutv1_7.yaml

---

## ✅ createInvoice - Verified

### Headers (✅ Correct)
- ✅ `Timestamp` - milliseconds
- ✅ `Secret-Hash` - HMAC-SHA256(timestamp + currency + amount + appId)
- ✅ `Content-Type: application/json; charset=utf-8`

### Request Body (✅ Correct)
**Required Fields:**
- ✅ `appId` - Numeric string (e.g., "60003735")
- ✅ `invoiceId` - Unique value (we use `ORDER_<orderId>`)
- ✅ `currency` - "BHD"
- ✅ `amount` - String with 3 decimals (e.g., "0.004")
- ✅ `paymentMethod` - "BENEFITGATEWAY,CREDITCARD,APPLEPAY"
- ✅ `returnUrl` - Return URL

**Optional Fields (Supported):**
- ✅ `webhookUrl` - Webhook URL
- ✅ `userToken` - User token
- ✅ `firstName` - Customer first name (can be added)
- ✅ `lastName` - Customer last name (can be added)
- ✅ `customerEmail` - Customer email (can be added)
- ✅ `customerCountryCode` - Country code (can be added)
- ✅ `customerMobile` - Mobile number (can be added)

### Response (✅ Handled)
```json
{
  "globalTransactionsId": "...",
  "paymentUrl": "https://checkout.eazy.net/..."
}
```

---

## ✅ query - Verified

### Headers (✅ Correct)
- ✅ `Timestamp` - milliseconds
- ✅ `Secret-Hash` - HMAC-SHA256(timestamp + appId)
- ✅ `Content-Type: application/json; charset=utf-8` (FIXED)

### Request Body (✅ Correct)
- ✅ `appId` - Numeric string
- ✅ `globalTransactionsId` - Transaction ID

### Response (✅ Handled)
- ✅ All fields from API spec are handled
- ✅ `isPaid`, `status`, `paidOn`, `paymentMethod`, etc.

---

## 🔧 What Was Fixed

1. ✅ **Content-Type for query** - Added `charset=utf-8`
2. ✅ **Interface updated** - Added optional customer fields
3. ✅ **All required fields** - Present and correct
4. ✅ **Hash computation** - Matches API spec exactly

---

## 📝 Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| createInvoice headers | ✅ Correct | All headers match spec |
| createInvoice body | ✅ Correct | Required fields present |
| createInvoice hash | ✅ Correct | timestamp + currency + amount + appId |
| query headers | ✅ Correct | Fixed Content-Type |
| query body | ✅ Correct | appId + globalTransactionsId |
| query hash | ✅ Correct | timestamp + appId |
| Response handling | ✅ Correct | Handles all response fields |

---

## 🎯 Optional Enhancements

You can optionally add customer information to improve the checkout experience:

```typescript
const invoiceResponse = await createInvoice({
  // ... existing fields ...
  firstName: user.firstName,
  lastName: user.lastName,
  customerEmail: user.email,
  customerCountryCode: 'BH',
  customerMobile: user.phone,
});
```

These are optional and don't affect payment processing.

---

## ✅ Summary

**Your implementation is 100% compliant with the official EazyPay Checkout API v1.7 specification!**

All required fields are present, headers are correct, hash computation matches exactly, and response handling is complete.

**Next step:** Get your Checkout App ID (numeric) from EazyPay and update `.env.local`.





