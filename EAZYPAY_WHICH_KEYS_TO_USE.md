# EazyPay: Which API Keys to Use - Store vs Bank/Merchant

## The Two Locations

### 1. **Store Settings** (Store Details)
- **Location:** `mms.eazy.net/#/merchants/store-details` → API Keys section
- **Level:** Store-specific
- **Keys:** May have PORTAL key, possibly POS key

### 2. **Bank Details** (Merchant Details)
- **Location:** `mms.eazy.net/#/merchants/merchant-details` → API Keys tab
- **Level:** Merchant-level (applies to all stores)
- **Keys:** Should have both POS and PORTAL keys

---

## Critical Question: Which One Has POS Key with Webhook?

### ✅ **Use the one with POS Key + Webhook configured**

**Why:**
- POS key is required for customer payments
- Webhook must be configured for payment notifications
- Without webhook, you won't receive payment confirmations

---

## How to Decide

### Step 1: Check Both Locations

**Store Settings (Store Details):**
- Go to: `mms.eazy.net/#/merchants/store-details`
- Look for: API Keys section
- Check: Does it have a POS key?
- Check: Does the POS key have a webhook URL configured?

**Bank Details (Merchant Details):**
- Go to: `mms.eazy.net/#/merchants/merchant-details`
- Click: "API Keys" tab
- Check: Does it have a POS key?
- Check: Does the POS key have a webhook URL configured?

### Step 2: Compare

| Location | POS Key? | Webhook Configured? | Use For Payments? |
|----------|----------|---------------------|-------------------|
| Store Settings | ? | ? | ? |
| Bank Details | ? | ? | ? |

### Step 3: Choose Based on This Priority

**Priority 1:** POS key with webhook configured ✅
- This is the one you MUST use for payments
- Webhook URL should be: `POST https://helloonebahrain.com/api/payments/eazypay/webhook`

**Priority 2:** POS key without webhook
- Can use, but you'll need to configure webhook
- Less ideal, but works

**Priority 3:** Only PORTAL key
- ❌ Cannot use for customer payments
- Only for admin dashboard features

---

## Recommendation Based on What We Know

### ✅ **Use Bank Details (Merchant Details) Keys**

**From the images we saw earlier:**
- Bank Details (Merchant Details) has:
  - ✅ POS Key: `057af880-525c-42d7-9a0c-678563fdeab4`
  - ✅ Webhook configured: `POST https://helloonebahrain.com/api/payments/eazypay/webhook`
  - ✅ PORTAL Key: `a6cf4de0-adad-448b-98e6-cfccc6a6dddd`

**Use these:**
```env
# From "Merchant Details" → API Keys tab (Bank Details)
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
EAZYPAY_PORTAL_API_KEY=a6cf4de0-adad-448b-98e6-cfccc6a6dddd
EAZYPAY_PORTAL_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
```

---

## Quick Decision Guide

### ✅ Use Bank Details (Merchant Details) if:
- ✅ It has a POS key
- ✅ POS key has webhook configured
- ✅ You want merchant-level access (all stores)

### ⚠️ Use Store Settings (Store Details) if:
- ⚠️ Bank Details doesn't have POS key
- ⚠️ Store Settings has POS key with webhook
- ⚠️ You need store-specific keys

---

## What to Check Right Now

**Please check both locations and tell me:**

1. **Store Settings (Store Details):**
   - Does it have a POS key? (Yes/No)
   - If yes, does it have webhook URL? (Yes/No)
   - What is the POS API Key value?

2. **Bank Details (Merchant Details):**
   - Does it have a POS key? (Yes/No)
   - If yes, does it have webhook URL? (Yes/No)
   - What is the POS API Key value?

**Based on your answers, I'll tell you exactly which one to use!**

---

## General Rule

**Always use the POS key that has webhook configured!**

- If Bank Details has POS + webhook → Use Bank Details ✅
- If Store Settings has POS + webhook → Use Store Settings ✅
- If both have it → Use Bank Details (merchant-level is better) ✅

---

## Final Answer (Based on What We Know)

**Use Bank Details (Merchant Details) keys** because:
1. ✅ Has POS key with webhook already configured
2. ✅ Merchant-level (works for all stores)
3. ✅ Standard approach
4. ✅ All keys available (POS + PORTAL)

**But please verify:**
- Check if Store Settings also has a POS key
- If Store Settings has POS key with webhook, you can use that too
- But Bank Details is recommended for single-store setups





