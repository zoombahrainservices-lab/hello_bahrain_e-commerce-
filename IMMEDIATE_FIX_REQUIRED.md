# 🚨 IMMEDIATE FIX REQUIRED

## ❌ Current Problem

**You're using the PORTAL secret key with the CHECKOUT App ID!**

From your logs:
- ✅ App ID: `50002754` (correct)
- ❌ Secret Key: `ba88853dad...` (this is PORTAL secret, not Checkout!)

**This causes hash mismatch → "Invalid number of inputs" error**

---

## ✅ SOLUTION (3 Steps)

### Step 1: Get Checkout Secret Key

**You need the Checkout Secret Key that matches App ID `50002754`**

**Where to find:**
1. Login to EazyPay Dashboard
2. Go to "Checkout API" or "Online Checkout" section
3. Find App ID `50002754`
4. Get its Secret Key (should be DIFFERENT from Portal secret)

**If you can't find it:**
- Contact EazyPay support
- Ask: "I need the Checkout Secret Key for App ID 50002754"

### Step 2: Update .env.local

**Current (WRONG):**
```env
EAZYPAY_CHECKOUT_APP_ID=50002754
EAZYPAY_CHECKOUT_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464  ❌ PORTAL secret!
```

**Should be (CORRECT):**
```env
EAZYPAY_CHECKOUT_APP_ID=50002754
EAZYPAY_CHECKOUT_SECRET_KEY=[the Checkout secret key - DIFFERENT from Portal]
```

### Step 3: Restart Server

1. Stop the server (Ctrl+C)
2. Start again: `npm run dev`
3. Try checkout

---

## 🔍 How to Verify

After updating, check terminal logs:

**Should see:**
```
[EazyPay Request] Using Secret Key (first 10 chars): [DIFFERENT from ba88853dad...]
```

**If you still see `ba88853dad...`, you're still using the Portal secret!**

---

## ⚠️ Why This Happens

**EazyPay has separate credentials:**
- **Portal API** → Portal API Key + Portal Secret Key (for admin)
- **Checkout API** → Checkout App ID + Checkout Secret Key (for payments)

**You CANNOT mix them!**

Using Portal secret with Checkout App ID = Hash mismatch = "Invalid number of inputs"

---

## 📧 If You Can't Find Checkout Secret Key

**Contact EazyPay Support:**

```
Subject: Need Checkout Secret Key for App ID 50002754

Hi EazyPay Support,

I'm integrating Checkout API and need the Secret Key for App ID 50002754.

I currently have:
- Portal Secret Key: ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464

I need:
- Checkout Secret Key for App ID 50002754

Can you provide this or point me to where I can find it in the dashboard?

Thank you!
```

---

## ✅ Summary

1. **Problem:** Using Portal secret key with Checkout App ID
2. **Fix:** Get Checkout Secret Key from EazyPay
3. **Update:** `.env.local` with correct key
4. **Restart:** Server and test

**Once you have the correct Checkout Secret Key, it will work!** 🎉





