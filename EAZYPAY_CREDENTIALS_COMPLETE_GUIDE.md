# EazyPay Credentials - Complete Guide

## Which POS Key to Use (Both Have POS)

### ✅ **Use Merchant Details (Bank Details) POS Key**

**Why:**
- ✅ Already has webhook configured: `POST https://helloonebahrain.com/api/payments/eazypay/webhook`
- ✅ Merchant-level (works for all stores)
- ✅ Standard approach
- ✅ Ready to use immediately

**Use these credentials:**
```env
# From "Merchant Details" → "API Keys" tab
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
```

**Store Details POS Key:**
- ⚠️ Can use if you prefer store-level
- ⚠️ But you'll need to configure webhook manually
- ⚠️ Less flexible for future expansion

**Recommendation:** Use Merchant Details (Bank Details) POS key because webhook is already configured!

---

## Old Credentials (NOT NEEDED for New Integration)

### ❌ These are from OLD integration - You DON'T need them!

```env
EAZYPAY_API_PASSWORD=your_api_password_here
EAZYPAY_API_BASE_URL=https://your_eazypay_api_base_url_here
NEXT_PUBLIC_EAZYPAY_CHECKOUT_JS=https://your_eazypay_checkout_js_url_here
```

**Why you don't need them:**
- ❌ These are for OLD EazyPay integration (MPGS direct integration)
- ❌ Our NEW integration uses Checkout API (different approach)
- ❌ Checkout API uses App ID + Secret Key (not API Password)
- ❌ Base URL is hardcoded: `https://api.eazy.net/merchant/checkout`
- ❌ No Checkout.js script needed (we redirect to EazyPay's payment page)

**What to do:**
- ✅ Remove or ignore these old credentials
- ✅ They're not used in the new Checkout API integration
- ✅ Only use the new Checkout API credentials

---

## What Each Credential Is For

### ✅ **NEW Integration (What You Need):**

#### 1. EAZYPAY_CHECKOUT_APP_ID
- **What:** Your POS API Key (Application ID)
- **Where:** Merchant Details → API Keys → POS Key → Api Key
- **Value:** `057af880-525c-42d7-9a0c-678563fdeab4`
- **Used for:** Creating invoices, querying payments
- **Required:** ✅ Yes

#### 2. EAZYPAY_CHECKOUT_SECRET_KEY
- **What:** Your POS Secret Key
- **Where:** Merchant Details → API Keys → POS Key → Secret Key
- **Value:** `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`
- **Used for:** HMAC signing of API requests
- **Required:** ✅ Yes

#### 3. EAZYPAY_PORTAL_API_KEY
- **What:** Your PORTAL API Key (for admin features)
- **Where:** Merchant Details → API Keys → PORTAL Key → Api Key
- **Value:** `a6cf4de0-adad-448b-98e6-cfccc6a6dddd`
- **Used for:** Admin dashboard (transactions, settlements)
- **Required:** ⚠️ Optional (only if you want admin features)

#### 4. EAZYPAY_PORTAL_SECRET_KEY
- **What:** Your PORTAL Secret Key
- **Where:** Merchant Details → API Keys → PORTAL Key → Secret Key
- **Value:** `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464`
- **Used for:** HMAC signing of Portal API requests
- **Required:** ⚠️ Optional (only if you want admin features)

---

### ❌ **OLD Integration (NOT NEEDED):**

#### 1. EAZYPAY_API_PASSWORD
- **What:** Old API password (for MPGS direct integration)
- **Where:** Not available in new Checkout API
- **Used for:** Old integration method
- **Required:** ❌ No (not used in new integration)

#### 2. EAZYPAY_API_BASE_URL
- **What:** Old API base URL
- **Where:** Not needed - hardcoded in code
- **Value:** Always `https://api.eazy.net/merchant/checkout`
- **Used for:** Old integration method
- **Required:** ❌ No (hardcoded in code)

#### 3. NEXT_PUBLIC_EAZYPAY_CHECKOUT_JS
- **What:** Old Checkout.js script URL
- **Where:** Not needed - we redirect to EazyPay page
- **Used for:** Old integration (embedded payment form)
- **Required:** ❌ No (we redirect instead)

---

## Complete .env.local (What You Actually Need)

```env
# ✅ REQUIRED - EazyPay Checkout API (Customer Payments)
# From "Merchant Details" → "API Keys" tab → POS Key
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec

# ⚠️ OPTIONAL - EazyPay Portal API (Admin Features)
# From "Merchant Details" → "API Keys" tab → PORTAL Key
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464

# ✅ REQUIRED - Client URL
CLIENT_URL=https://helloonebahrain.com

# ❌ OLD CREDENTIALS - Can be removed or ignored
# EAZYPAY_API_PASSWORD=your_api_password_here  (NOT NEEDED)
# EAZYPAY_API_BASE_URL=https://your_eazypay_api_base_url_here  (NOT NEEDED)
# NEXT_PUBLIC_EAZYPAY_CHECKOUT_JS=https://your_eazypay_checkout_js_url_here  (NOT NEEDED)
```

---

## Why Old Credentials Exist

**They're from an older integration method:**
- Old method: Direct MPGS integration (embedded payment form)
- New method: Checkout API (redirect to EazyPay page)

**Our code uses:**
- ✅ Checkout API (new method)
- ✅ App ID + Secret Key
- ✅ Base URL hardcoded: `https://api.eazy.net/merchant/checkout`
- ✅ Redirect to EazyPay payment page (no embedded form)

**Old credentials are:**
- ❌ Not used in new integration
- ❌ Can be safely removed or ignored
- ❌ Left in .env.local for backward compatibility (old routes still exist)

---

## Summary

### ✅ **Use These (NEW Integration):**
1. `EAZYPAY_CHECKOUT_APP_ID` = POS API Key from Merchant Details
2. `EAZYPAY_CHECKOUT_SECRET_KEY` = POS Secret Key from Merchant Details
3. `EAZYPAY_PORTAL_API_KEY` = PORTAL API Key (optional)
4. `EAZYPAY_PORTAL_SECRET_KEY` = PORTAL Secret Key (optional)

### ❌ **Don't Need These (OLD Integration):**
1. `EAZYPAY_API_PASSWORD` = Not needed
2. `EAZYPAY_API_BASE_URL` = Not needed (hardcoded)
3. `NEXT_PUBLIC_EAZYPAY_CHECKOUT_JS` = Not needed (we redirect)

### 🎯 **Which POS Key:**
- ✅ Use Merchant Details POS key (webhook already configured)
- ⚠️ Store Details POS key works too, but needs webhook setup

---

## Next Steps

1. **Update .env.local with Merchant Details POS keys:**
   ```env
   EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
   EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
   ```

2. **Remove or ignore old credentials** (they're not used)

3. **Test the payment flow!**

---

**Bottom Line:**
- Use Merchant Details POS key (webhook configured)
- Ignore old credentials (API_PASSWORD, API_BASE_URL, CHECKOUT_JS)
- Only need App ID + Secret Key for new integration





