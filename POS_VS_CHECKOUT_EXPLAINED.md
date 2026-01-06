# POS vs Checkout API - Complete Explanation

## 🎯 Quick Answer

**POS = Physical Terminals (in-store)**  
**Checkout = Website Payments (online)**

**You need Checkout API for your website, NOT POS.**

---

## 📋 What is POS?

**POS = Point of Sale**

- **Use Case:** Physical card terminals in stores
- **Example:** Customer swipes card at checkout counter
- **Credentials:** POS API Key (UUID format)
- **For Your Website?** ❌ **NO**

**When you'd use POS:**
- Building a cashier/POS application
- Reconciliation tool for terminal transactions
- Pulling card-present transaction data

---

## 🌐 What is Checkout API?

**Checkout = Online Website Payments**

- **Use Case:** Customer pays on your website
- **Example:** Customer clicks "Pay Now" → redirected to EazyPay
- **Credentials:** Checkout App ID (numeric) + Checkout Secret Key
- **For Your Website?** ✅ **YES**

**When you'd use Checkout:**
- E-commerce website payments
- Online checkout flow
- Card-not-present transactions

---

## 🔑 Credential Differences

### POS API (NOT for Website)
```
API Key: 5dcb3f64-ff9c-42a4-832e-b86511d273f7  (UUID)
Secret: d1a8904c78004e35921d02a8cdf32063abfd74a3517646eaa5e5bec77c49f101
Use: Physical terminals
```

### Checkout API (FOR Website) ⚠️ **YOU NEED THIS**
```
App ID: 50002754  (NUMERIC - 8-9 digits)
Secret: [Get from EazyPay]
Use: Website payments
```

### Portal API (For Admin)
```
API Key: a6cf4de0-adad-448b-98e6-cfccc6a6dddd  (UUID)
Secret: ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
Use: Admin dashboard (transactions, settlements, disputes)
```

---

## ✅ What Your Code Uses

**Your code correctly uses:**
- ✅ `EAZYPAY_CHECKOUT_APP_ID` (for Checkout API)
- ✅ `EAZYPAY_CHECKOUT_SECRET_KEY` (for Checkout API)
- ✅ Does NOT use POS keys
- ✅ Does NOT send `terminal_id` in Checkout requests

**Your code is correct!** You just need the Checkout credentials.

---

## 📝 Your Dashboard Shows

Based on your EazyPay dashboard:

1. **PORTAL** - ✅ You have this (for admin)
2. **POS** - ✅ You have this (for physical terminals, NOT for website)
3. **Checkout** - ⚠️ **Need to find/get this** (for website)

---

## 🔍 How to Get Checkout Credentials

### Option 1: Check Dashboard
- Look for "Checkout API" or "Online Checkout" section
- Checkout App ID should be numeric (8-9 digits)

### Option 2: Contact EazyPay
- Ask for "Checkout App ID" and "Checkout Secret Key"
- Tell them it's for website integration

---

## ⚠️ Common Mistakes

❌ **DON'T:**
- Use POS API Key for website checkout
- Send `terminal_id` in Checkout API requests
- Use Portal API Key for customer payments

✅ **DO:**
- Use Checkout App ID (numeric) for website
- Use Checkout Secret Key for website
- Keep POS keys separate (only for physical terminals)

---

## 🎯 Summary

| What | For | Website? | You Have? |
|------|-----|----------|----------|
| **Checkout API** | Website payments | ✅ YES | ⚠️ Need to get |
| **Portal API** | Admin dashboard | ❌ NO | ✅ Yes |
| **POS API** | Physical terminals | ❌ NO | ✅ Yes (but don't use) |

**Action:** Get Checkout App ID and Secret Key from EazyPay, then update `.env.local`.





