# Testing Both EazyPay Key Sets

## Current Setup

You have **TWO API key sets** in your EazyPay dashboard:

### 1. PORTAL Key (for Admin APIs)
- **Api Key:** `a6cf4de0-adad-448b-98e6-cfccc6a6dddd`
- **Secret Key:** `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464`
- **WebHook URL:** (empty)
- **Purpose:** Admin operations (transactions, settlements, disputes)

### 2. POS Key (for Checkout API)
- **Api Key:** `057af880-525c-42d7-9a0c-678563fdeab4`
- **Secret Key:** `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`
- **WebHook URL:** `https://helloonebahrain.com/api/payments/eazypay/webhook`
- **Purpose:** Customer payments (Checkout API)

---

## What I Just Changed

**Added `appId` back to request body** - Now sending 4 fields:
1. `appId` - Your POS API key
2. `currency` - "BHD"
3. `amount` - "5.000"
4. `returnUrl` - Your return URL

**Why:** The error "Invalid number of inputs" might mean we need exactly 4 fields, not 3.

---

## Test This First

**Current setup uses POS key** (which is correct for Checkout API).

**Try checkout now** - if it still fails, we'll try PORTAL key next.

---

## If Still Failing - Try PORTAL Key

If POS key still doesn't work, we can try PORTAL key by updating `.env.local`:

```env
# Try PORTAL key instead of POS key
EAZYPAY_CHECKOUT_APP_ID=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_CHECKOUT_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

**Note:** This is unusual (PORTAL for Checkout), but let's test it if POS fails.

---

## Next Steps

1. ✅ **Try checkout now** with appId in body (4 fields)
2. ❌ If fails → Try PORTAL key
3. ❌ If still fails → Contact EazyPay support with exact error




