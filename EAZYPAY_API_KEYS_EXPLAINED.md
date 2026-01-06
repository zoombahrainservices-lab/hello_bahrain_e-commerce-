# EazyPay API Keys Explained - Which One to Use

## The Two API Keys You Have

### 1. **PORTAL API Key** (Admin Operations)
- **Key Type:** PORTAL
- **Api Key:** `a6cf4de0-adad-448b-98e6-cfccc6a6dddd`
- **Secret Key:** `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464`
- **WebHook URL:** (empty)
- **Purpose:** For admin dashboard features (transactions, settlements, disputes)

### 2. **POS API Key** (Customer Payments) ✅ **THIS IS FOR PAYMENTS**
- **Key Type:** POS
- **Api Key:** `057af880-525c-42d7-9a0c-678563fdeab4`
- **Secret Key:** `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`
- **WebHook URL:** `POST https://helloonebahrain.com/api/payments/eazypay/webhook` ✅ (Already configured!)
- **Purpose:** For customer payments (Checkout API)

---

## Which One Should You Use?

### For Customer Payments (Checkout API) ✅ **USE POS KEY**

**This is what you need for your payment gateway:**

```env
# POS API Key = Checkout API
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
```

**Why:**
- ✅ POS = Point of Sale = Customer payments
- ✅ This is the one with webhook already configured
- ✅ This is what processes customer payments on your website

### For Admin Dashboard (Portal API) ✅ **USE PORTAL KEY**

**This is for admin features (optional if you only need payments):**

```env
# PORTAL API Key = Admin Operations
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

**Why:**
- ✅ PORTAL = Admin dashboard
- ✅ For viewing transactions, settlements, disputes
- ✅ Only needed if you want admin features

---

## What is "App ID"?

**The App ID is the POS API Key!**

In EazyPay's system:
- **POS API Key** = Your "App ID" for Checkout API
- The UUID `057af880-525c-42d7-9a0c-678563fdeab4` is your App ID

**So:**
```env
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
```

This is what you use in your code!

---

## Complete .env.local Configuration

### Required for Payments (POS Key):
```env
# EazyPay Checkout API (Customer Payments)
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
```

### Optional for Admin Features (Portal Key):
```env
# EazyPay Portal API (Admin Operations)
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

### Other Settings:
```env
CLIENT_URL=https://helloonebahrain.com
```

---

## Quick Reference

| Key Type | Purpose | App ID / API Key | Secret Key | Webhook |
|----------|---------|-----------------|------------|---------|
| **POS** | Customer Payments | `057af880-525c-42d7-9a0c-678563fdeab4` | `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec` | ✅ Configured |
| **PORTAL** | Admin Dashboard | `a6cf4de0-adad-448b-98e6-cfccc6a6dddd` | `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464` | ❌ Not needed |

---

## What Each Key Does

### POS Key (Customer Payments) ✅ **USE THIS FOR PAYMENTS**

**What it does:**
- Creates payment invoices
- Processes customer payments
- Receives webhook notifications
- Queries payment status

**When it's used:**
- Every time a customer pays on your website
- When checking payment status
- When receiving payment confirmations

**Code uses:**
```typescript
// In createInvoice
appId: "057af880-525c-42d7-9a0c-678563fdeab4"  // POS API Key
secretKey: "3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec"
```

### PORTAL Key (Admin Operations) ⚠️ **OPTIONAL**

**What it does:**
- Views transaction lists
- Views settlement reports
- Views VAT reports
- Manages disputes
- Downloads reports

**When it's used:**
- When admin views transactions
- When admin checks settlements
- When admin manages disputes

**Code uses:**
```typescript
// In portal API calls
apiKey: "a6cf4de0-adad-448b-98e6-cfccc6a6dddd"  // PORTAL API Key
secretKey: "ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464"
```

---

## Summary

### For Customer Payments (Required):
✅ **Use POS Key:**
- App ID: `057af880-525c-42d7-9a0c-678563fdeab4`
- Secret Key: `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`
- Webhook: Already configured! ✅

### For Admin Dashboard (Optional):
⚠️ **Use PORTAL Key:**
- API Key: `a6cf4de0-adad-448b-98e6-cfccc6a6dddd`
- Secret Key: `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464`

---

## Next Steps

1. **Add POS credentials to `.env.local`** (for payments):
   ```env
   EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
   EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
   ```

2. **Add PORTAL credentials** (if you want admin features):
   ```env
   EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
   EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
   ```

3. **Test the payment flow!**

---

## Important Notes

✅ **Webhook is already configured!**
- Your POS key already has webhook URL set
- No need to configure it again
- It's pointing to: `https://helloonebahrain.com/api/payments/eazypay/webhook`

✅ **POS Key = Checkout API**
- POS stands for "Point of Sale"
- This is what you use for customer payments
- The "Api Key" is your "App ID"

✅ **Terminal IDs**
- You have 3 terminals: 30021461, 30021462, 40021460
- These are for different payment methods (Benefit Pay, Benefit Gateway, MPGS)
- You don't need to configure these in code - EazyPay handles it

---

**Bottom Line:** Use the **POS Key** for customer payments. That's what you need!





