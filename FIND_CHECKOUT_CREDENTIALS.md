# 🔍 How to Find Your Checkout App ID

## ✅ Good News: Code is Correct!

Your code is **NOT using POS keys** for Checkout API. It's correctly configured to use:
- `EAZYPAY_CHECKOUT_APP_ID` (should be numeric)
- `EAZYPAY_CHECKOUT_SECRET_KEY` (Checkout secret)

**POS keys are NOT used** - they're only for physical terminals.

---

## 📋 Understanding Your EazyPay Dashboard

Based on your dashboard, you have:

### 1. **PORTAL API Key** (for Admin Operations)
- **Key Type:** PORTAL
- **Api Key:** `a6cf4de0-adad-448b-98e6-cfccc6a6dddd` (UUID)
- **Secret Key:** `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464`
- **Use:** Admin dashboard (transactions, settlements, disputes)
- **NOT for:** Customer payments

### 2. **POS API Key** (for Physical Terminals)
- **Key Type:** POS
- **Api Key:** `5dcb3f64-ff9c-42a4-832e-b86511d273f7` (UUID)
- **Secret Key:** `d1a8904c78004e35921d02a8cdf32063abfd74a3517646eaa5e5bec77c49f101`
- **Use:** Physical card terminals (in-store transactions)
- **NOT for:** Website checkout

### 3. **Checkout App ID** (for Website Payments) ⚠️ **YOU NEED THIS**
- **Format:** Numeric (8-9 digits, e.g., `50002754`)
- **Location:** Different section in dashboard
- **Use:** Website checkout (`/checkout/createInvoice`)

---

## 🔍 Where to Find Checkout App ID

### Option 1: Check EazyPay Dashboard

1. **Login to EazyPay Dashboard**
2. **Look for these sections:**
   - "Checkout API" or "Online Checkout"
   - "Web Payments" or "E-commerce"
   - "Application Settings" or "App Configuration"
   - Sometimes under "Merchant Details" → "Checkout" tab

3. **What to look for:**
   - "Checkout App ID" or "Application ID"
   - Should be **numeric** (8-9 digits)
   - NOT a UUID (not like `5dcb3f64-ff9c-42a4-832e-b86511d273f7`)

### Option 2: Check Your Email

- Look for EazyPay onboarding emails
- Check for "Checkout API credentials" or "Application ID"
- May have been sent when you registered

### Option 3: Contact EazyPay Support

If you can't find it, ask EazyPay:

```
Subject: Need Checkout App ID for Website Integration

Hi EazyPay Support,

I'm integrating the Checkout API for my website (helloonebahrain.com).

I can see my Portal API key and POS API key in the dashboard, but I need:
- Checkout App ID (numeric, for /checkout/createInvoice)
- Checkout Secret Key

Can you provide these credentials or point me to where I can find them in the dashboard?

Thank you!
```

---

## ✅ What Your .env.local Should Look Like

```env
# EazyPay Checkout API (for website customer payments)
EAZYPAY_CHECKOUT_APP_ID=50002754  # NUMERIC (8-9 digits) - GET FROM EAZYPAY
EAZYPAY_CHECKOUT_SECRET_KEY=your_checkout_secret_key_here  # GET FROM EAZYPAY

# EazyPay Portal API (for admin operations)
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464

# POS API (for physical terminals - NOT USED IN WEBSITE CODE)
# EAZYPAY_POS_API_KEY=5dcb3f64-ff9c-42a4-832e-b86511d273f7  # Don't use for checkout
# EAZYPAY_POS_SECRET_KEY=d1a8904c78004e35921d02a8cdf32063abfd74a3517646eaa5e5bec77c49f101  # Don't use for checkout
```

---

## 🎯 Key Differences

| Type | Format | Use Case | For Website? |
|------|--------|----------|-------------|
| **Checkout App ID** | Numeric (8-9 digits) | Website payments | ✅ YES |
| **Portal API Key** | UUID | Admin dashboard | ❌ NO |
| **POS API Key** | UUID | Physical terminals | ❌ NO |

---

## ⚠️ Important Notes

1. **POS keys are NOT for website checkout**
   - They're for physical card terminals
   - Don't use them in `.env.local` for checkout

2. **Checkout App ID is numeric**
   - NOT a UUID
   - Usually 8-9 digits
   - Example: `50002754`, `30021462`

3. **Your code is already correct**
   - It uses `EAZYPAY_CHECKOUT_APP_ID`
   - It doesn't send `terminal_id`
   - It uses correct field names (camelCase)

4. **You just need the credentials**
   - Get Checkout App ID from EazyPay
   - Get Checkout Secret Key from EazyPay
   - Update `.env.local`
   - Restart server

---

## 📝 Next Steps

1. ✅ **Find Checkout App ID** in EazyPay dashboard (or contact support)
2. ✅ **Get Checkout Secret Key** from EazyPay
3. ✅ **Update `.env.local`** with numeric App ID
4. ✅ **Restart server**
5. ✅ **Test checkout**

Once you have the Checkout App ID, everything will work! 🎉




