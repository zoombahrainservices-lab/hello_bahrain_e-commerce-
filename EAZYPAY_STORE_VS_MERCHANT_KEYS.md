# EazyPay: Store vs Merchant API Keys - Which to Use?

## The Two Locations

### 1. **Merchant Details** → API Keys
- **Level:** Merchant-level (applies to all stores)
- **Location:** `mms.eazy.net/#/merchants/merchant-details` → API Keys tab
- **Keys shown:**
  - POS Key: `057af880-525c-42d7-9a0c-678563fdeab4`
  - PORTAL Key: `a6cf4de0-adad-448b-98e6-cfccc6a6dddd`

### 2. **Store Details** → API Keys
- **Level:** Store-level (specific to one store)
- **Location:** `mms.eazy.net/#/merchants/store-details` → API Keys section
- **Keys shown:**
  - PORTAL Key: `bb905241-747d-4e95-9e26-0b33e6148eb3`

---

## Which One Should You Use?

### ✅ **Use Merchant-Level Keys (Recommended)**

**Why:**
- ✅ Works for all stores under your merchant account
- ✅ More flexible if you add more stores later
- ✅ Standard approach for single-store setups
- ✅ The POS key with webhook is at merchant level

**Use these:**
```env
# From "Merchant Details" → API Keys tab
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

### ⚠️ **Store-Level Keys (Only if needed)**

**When to use:**
- If you have multiple stores and need store-specific keys
- If merchant-level keys don't work for some reason
- If EazyPay support tells you to use store-level

**Use these (if needed):**
```env
# From "Store Details" → API Keys section
# Note: Store Details might only show PORTAL key
# You may need to check if there's a POS key at store level
```

---

## Key Differences

| Feature | Merchant-Level | Store-Level |
|---------|---------------|-------------|
| **Scope** | All stores | One store only |
| **Flexibility** | ✅ More flexible | ⚠️ Store-specific |
| **POS Key** | ✅ Available | ⚠️ May not be available |
| **Webhook** | ✅ Already configured | ⚠️ May need setup |
| **Recommended** | ✅ Yes (for most cases) | ⚠️ Only if needed |

---

## How to Check Which One to Use

### Check 1: Does Store Details have a POS key?
- Go to "Store Details" → API Keys section
- Look for a POS key (not just PORTAL)
- If you see a POS key with webhook configured, you can use that
- If you only see PORTAL key, use merchant-level

### Check 2: Which one has webhook configured?
- The POS key with webhook URL configured is the one to use
- From the images, merchant-level POS key has webhook: `POST https://helloonebahrain.com/api/payments/eazypay/webhook`
- This is the one you should use!

### Check 3: Ask yourself:
- Do you have multiple stores? → Use store-level (if available)
- Do you have one store? → Use merchant-level ✅

---

## Recommendation

### ✅ **Use Merchant-Level Keys**

**Reason:**
1. ✅ Your POS key at merchant level already has webhook configured
2. ✅ More standard approach
3. ✅ Works for all stores
4. ✅ Easier to manage

**Credentials to use:**
```env
# From "Merchant Details" → API Keys tab
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

---

## Quick Decision Guide

**Use Merchant-Level if:**
- ✅ You have one store (helloonebahrain.com)
- ✅ POS key has webhook configured (it does!)
- ✅ You want standard setup

**Use Store-Level if:**
- ⚠️ You have multiple stores
- ⚠️ Merchant-level doesn't work
- ⚠️ EazyPay support specifically tells you to

---

## What I Recommend

**Use the Merchant-Level keys** because:
1. ✅ POS key already has webhook configured
2. ✅ Standard approach for single-store setups
3. ✅ More flexible for future expansion
4. ✅ All keys are available (POS + PORTAL)

---

## Final Answer

**Use the keys from "Merchant Details" → API Keys tab:**
- POS Key: `057af880-525c-42d7-9a0c-678563fdeab4` (App ID)
- POS Secret: `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`
- PORTAL Key: `a6cf4de0-adad-448b-98e6-cfccc6a6dddd`
- PORTAL Secret: `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464`

**These are the ones with webhook already configured and ready to use!** ✅



