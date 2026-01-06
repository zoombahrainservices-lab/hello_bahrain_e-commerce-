# Update .env.local with EazyPay Credentials

## ✅ Credentials to Update

### Current (Incorrect):
```env
EAZYPAY_CHECKOUT_APP_ID=your_checkout_app_id_here
EAZYPAY_CHECKOUT_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

### Updated (Correct):
```env
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
```

---

## 📝 Step-by-Step Instructions

### 1. Open `.env.local` file
- Location: `client/.env.local` (or root `.env.local` if that's where it is)

### 2. Find these lines:
```env
# EazyPay Checkout API (for customer payments)
EAZYPAY_CHECKOUT_APP_ID=your_checkout_app_id_here
  EAZYPAY_CHECKOUT_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

### 3. Replace with:
```env
# EazyPay Checkout API (for customer payments)
# POS API Key = App ID (from Merchant Details → API Keys tab)
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
# POS Secret Key (from Merchant Details → API Keys tab)
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
```

---

## ✅ Complete EazyPay Section (After Update)

```env
# EazyPay Checkout API (for customer payments)
# POS API Key = App ID (from Merchant Details → API Keys tab)
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
# POS Secret Key (from Merchant Details → API Keys tab)
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec

# EazyPay Portal API (for admin operations)
# PORTAL API Key (from Merchant Details → API Keys tab)
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
# PORTAL Secret Key (from Merchant Details → API Keys tab)
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

---

## 🔍 What Changed

### Before:
- ❌ App ID: `your_checkout_app_id_here` (placeholder)
- ❌ Secret Key: `ba88853...` (This was PORTAL secret, not POS secret)

### After:
- ✅ App ID: `057af880-525c-42d7-9a0c-678563fdeab4` (POS API Key)
- ✅ Secret Key: `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec` (POS Secret Key)

---

## ✅ Verification

After updating, verify the credentials are correct:

1. **App ID** should be: `057af880-525c-42d7-9a0c-678563fdeab4`
2. **Checkout Secret Key** should be: `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`
3. **Portal API Key** should be: `a6cf4de0-adad-448b-98e6-cfccc6a6dddd`
4. **Portal Secret Key** should be: `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464`

---

## 🚀 Next Steps

After updating `.env.local`:

1. **Restart your dev server** (if running):
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   cd client
   npm run dev
   ```

2. **Test the payment flow:**
   - Go to checkout
   - Try making a test payment
   - Verify it works

3. **Check logs** for any errors

---

## 📋 Summary

**What to update:**
- `EAZYPAY_CHECKOUT_APP_ID` → `057af880-525c-42d7-9a0c-678563fdeab4`
- `EAZYPAY_CHECKOUT_SECRET_KEY` → `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`

**Portal keys are already correct** (no need to change)

**After update:** Your payment gateway will be ready to use! 🎉





