# EazyPay Keys Complete Guide - Differences Explained

## The Two Types of API Keys

### 1. **POS API Key** (Point of Sale) = Customer Payments
- **Purpose:** Process customer payments on your website
- **Used for:** Checkout API (createInvoice, query, webhook)
- **Location:** Merchant Details → API Keys tab

### 2. **PORTAL API Key** = Admin Dashboard
- **Purpose:** Admin operations (view transactions, settlements, disputes)
- **Used for:** Portal API (admin features)
- **Location:** Merchant Details → API Keys tab

---

## App ID vs Terminal ID - They Are NOT the Same!

### ❌ **App ID ≠ Terminal ID**

### **App ID** (Application ID)
- **What it is:** Your unique application identifier for Checkout API
- **Format:** UUID like `057af880-525c-42d7-9a0c-678563fdeab4`
- **Where:** POS API Key = App ID
- **Used in:** API requests and HMAC hash computation
- **Example:**
  ```typescript
  {
    appId: "057af880-525c-42d7-9a0c-678563fdeab4",  // This is App ID
    currency: "BHD",
    amount: "80.000"
  }
  ```

### **Terminal ID** (Terminal Identifier)
- **What it is:** Physical/Logical payment terminal identifier
- **Format:** Number like `30021461`, `30021462`, `40021460`
- **Where:** Store Details → Terminals Details table
- **Used for:** Different payment methods (Benefit Pay, MPGS, etc.)
- **Example:**
  - `30021461` = ZOOM CONSULTANCY - BENEFIT PAY
  - `30021462` = ZOOM CONSULTANCY - BENEFIT GATEWAY
  - `40021460` = ZOOM CONSULTANCY - MPGS

**Key Difference:**
- **App ID** = Your application (one per merchant account)
- **Terminal ID** = Payment terminals (multiple per merchant, for different payment methods)

---

## Complete Key Comparison

| Key Type | What It Is | Format | Where to Find | Used For |
|----------|------------|--------|---------------|----------|
| **App ID** | Application identifier | UUID: `057af880-525c-42d7-9a0c-678563fdeab4` | POS API Key | Checkout API requests |
| **Terminal ID** | Payment terminal | Number: `30021461` | Store Details → Terminals | Different payment methods |
| **POS Secret Key** | Secret for POS API | Hex: `3667a83553e14ca5...` | POS API Key row | HMAC signing for Checkout |
| **PORTAL Secret Key** | Secret for Portal API | Hex: `ba88853dad7e4625...` | PORTAL API Key row | HMAC signing for Portal |

---

## Which Keys to Use (From Your Dashboard)

### For Customer Payments (Checkout API):

**From "Merchant Details" → "API Keys" tab:**

```env
# POS Key = Checkout API
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
```

**Why:**
- ✅ POS = Point of Sale = Customer payments
- ✅ This is your App ID (the POS API Key)
- ✅ Webhook already configured on this key

### For Admin Dashboard (Portal API):

**From "Merchant Details" → "API Keys" tab:**

```env
# PORTAL Key = Admin Operations
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

**Why:**
- ✅ PORTAL = Admin dashboard
- ✅ For viewing transactions, settlements, disputes

---

## Terminal IDs - What They're For

**You have 3 terminals:**

1. **Terminal ID: 30021461**
   - Name: ZOOM CONSULTANCY - BENEFIT PAY
   - Category: BENEFIT
   - Status: ACTIVE

2. **Terminal ID: 30021462**
   - Name: ZOOM CONSULTANCY - BENEFIT GATEWAY
   - Category: BENEFIT
   - Status: ACTIVE

3. **Terminal ID: 40021460**
   - Name: ZOOM CONSULTANCY - MPGS
   - Category: MPGS
   - Status: ACTIVE

**Do you need Terminal IDs in your code?**

**Answer: NO** - You don't need to configure Terminal IDs in your code!

**Why:**
- EazyPay automatically routes payments to the correct terminal
- Based on payment method selected (Benefit Pay, Card, etc.)
- Your code just uses App ID, not Terminal ID

**When Terminal ID is used:**
- In admin queries (optional filter)
- In dispute creation (optional)
- In settlement reports (optional filter)
- **NOT required for basic payment processing**

---

## Key Differences Summary

### POS vs PORTAL Keys:

| Feature | POS Key | PORTAL Key |
|---------|---------|------------|
| **Purpose** | Customer payments | Admin dashboard |
| **API** | Checkout API | Portal API |
| **Used by** | Your website (customers) | Your admin panel |
| **When used** | Every payment | Admin operations |
| **Required for** | Payment processing | Admin features (optional) |

### App ID vs Terminal ID:

| Feature | App ID | Terminal ID |
|---------|--------|-------------|
| **What it is** | Application identifier | Payment terminal |
| **Format** | UUID: `057af880-...` | Number: `30021461` |
| **Quantity** | One per merchant | Multiple per merchant |
| **Used in code** | ✅ Yes (required) | ❌ No (not needed) |
| **Location** | API Keys tab | Terminals Details |

---

## Complete .env.local Configuration

### Required for Payments:

```env
# POS Key from "Merchant Details" → "API Keys" tab
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
```

### Optional for Admin Features:

```env
# PORTAL Key from "Merchant Details" → "API Keys" tab
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

### Other Settings:

```env
CLIENT_URL=https://helloonebahrain.com
```

---

## Quick Reference

### What You Need for Payments:
- ✅ **App ID** = POS API Key (`057af880-525c-42d7-9a0c-678563fdeab4`)
- ✅ **Secret Key** = POS Secret Key (`3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`)
- ❌ **Terminal ID** = NOT needed in code

### What Terminal IDs Are For:
- Different payment methods (Benefit Pay, MPGS, etc.)
- EazyPay handles routing automatically
- You don't configure them in your code

---

## Common Questions

### Q: Do I need Terminal ID in my code?
**A:** No! EazyPay automatically routes payments to the correct terminal based on payment method.

### Q: Is App ID the same as Terminal ID?
**A:** No! They're completely different:
- App ID = Your application identifier (UUID)
- Terminal ID = Payment terminal number

### Q: Which keys do I use for payments?
**A:** Use POS keys from "Merchant Details" → "API Keys" tab:
- App ID = POS API Key
- Secret Key = POS Secret Key

### Q: What about the PORTAL keys?
**A:** Only needed if you want admin dashboard features (viewing transactions, settlements, etc.)

---

## Summary

**Two Types of Keys:**
1. **POS Key** = Customer payments (required)
2. **PORTAL Key** = Admin dashboard (optional)

**App ID vs Terminal ID:**
- **App ID** = POS API Key (UUID) - ✅ Use this in code
- **Terminal ID** = Terminal number - ❌ Don't need in code

**For Payments, Use:**
- App ID: `057af880-525c-42d7-9a0c-678563fdeab4` (POS API Key)
- Secret: `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec` (POS Secret Key)

**Terminal IDs:**
- You have 3 terminals (30021461, 30021462, 40021460)
- EazyPay handles them automatically
- No need to configure in your code

---

**Bottom Line:**
- Use **POS keys** for customer payments
- **App ID** = POS API Key (not Terminal ID)
- **Terminal IDs** are handled automatically by EazyPay



