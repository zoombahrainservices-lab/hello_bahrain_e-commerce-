# ⚠️ IMPORTANT: Update .env.local File

## 🔧 What You Need to Do

You must update your `.env.local` file with the **correct numeric Checkout App ID**.

---

## 📋 Current Issue

Your `.env.local` currently has:
```env
EAZYPAY_CHECKOUT_APP_ID=bb905241-747d-4e95-9e26-0b33e6148eb3  # ❌ This is a UUID (Portal API key)
```

**Problem:** This is a UUID format (Portal API key), not the numeric Checkout App ID.

---

## ✅ What You Need

You need the **numeric Checkout App ID** from EazyPay dashboard.

**Format:** 8-9 digits (e.g., `50002754`, `30021462`)

**Where to find it:**
1. Login to EazyPay Dashboard
2. Go to "API Keys" or "Checkout API" section
3. Look for "Checkout App ID" or "Application ID"
4. It should be numeric (not UUID)

---

## 📝 Update .env.local

**Replace this:**
```env
EAZYPAY_CHECKOUT_APP_ID=bb905241-747d-4e95-9e26-0b33e6148eb3
```

**With this (example - use YOUR actual numeric App ID):**
```env
EAZYPAY_CHECKOUT_APP_ID=50002754
```

**Also update Terminal ID:**
```env
EAZYPAY_TERMINAL_ID=30021462
```

---

## 🎯 Complete .env.local Section

Your EazyPay section should look like this:

```env
# EazyPay Checkout API (for customer payments)
EAZYPAY_CHECKOUT_APP_ID=50002754  # NUMERIC App ID (8-9 digits, NOT UUID!)
EAZYPAY_CHECKOUT_SECRET_KEY=your_secret_key_here

# EazyPay Portal API (for admin operations)
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464

# Terminal ID (for reference only, not sent in API)
EAZYPAY_TERMINAL_ID=30021462
```

---

## ✅ After Updating

1. **Save `.env.local`**
2. **Restart your Next.js server** (stop and start again)
3. **Try checkout** - should work now!

---

## 🔍 How to Verify

After updating and restarting, check terminal logs when you try checkout:

**Should see:**
```
[EazyPay Request] Using App ID (should be numeric): 50002754  ✅
```

**Should NOT see:**
```
[EazyPay Request] Using App ID (should be numeric): bb905241-747d-4e95-9e26-0b33e6148eb3  ❌
```

---

## 💡 Key Points

- ✅ **App ID must be numeric** (8-9 digits)
- ❌ **NOT a UUID** (like `bb905241-747d-4e95-9e26-0b33e6148eb3`)
- ✅ **Get it from EazyPay dashboard** (Checkout API section)
- ✅ **Restart server** after updating

Once you update the App ID, the payment gateway should work! 🎉




