# EazyPay "Invalid number of inputs" - Critical Issue & Solution

## 🚨 The Problem

**Error:** "Invalid number of inputs" (Code: -4)  
**Status:** Persists with ALL field combinations tried

**What we've tried:**
- ✅ With appId in body (4 fields) - FAILED
- ✅ Without appId in body (3 fields) - FAILED  
- ✅ Different field combinations - ALL FAILED

**Conclusion:** We need EazyPay's EXACT API requirements. This error is too specific to guess.

---

## 🔍 Possible Root Causes

### 1. Wrong API Key Type ⚠️ **MOST LIKELY**

**You have:**
- POS API Key: `057af880-525c-42d7-9a0c-678563fdeab4`
- POS Secret Key: `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`

**Question:** Is this the RIGHT key type for Checkout API?

**Check:**
- In EazyPay dashboard, is there a "Checkout API" section separate from "POS"?
- Do you need a different key type for Checkout API vs POS API?
- Are you using the correct credentials for the Checkout endpoint?

---

### 2. Wrong API Endpoint

**Current:** `https://api.eazy.net/merchant/checkout/createInvoice`

**Question:** Is this the correct endpoint?

**Check:**
- Is it `/createInvoice` or `/create-invoice` or `/invoice`?
- Is the base URL correct?
- Should it be `/merchant/checkout` or something else?

---

### 3. Wrong Authentication Method

**Current:** Using HMAC-SHA256 with headers (Timestamp, Secret-Hash)

**Question:** Is this the correct auth method for Checkout API?

**Check:**
- Does Checkout API use different auth than Portal API?
- Should we use Basic Auth instead?
- Are headers correct?

---

### 4. API Not Activated

**Question:** Is your Checkout API activated/enabled?

**Check:**
- In EazyPay dashboard, is Checkout API enabled?
- Do you need to activate it first?
- Are there any pending approvals?

---

## ✅ IMMEDIATE ACTION REQUIRED

### Step 1: Verify API Key Type

**In EazyPay Dashboard:**
1. Go to "Merchant Details" → "API Keys" tab
2. Look at your POS key
3. **Check:** Is this key for "Checkout API" or "POS API"?
4. **Check:** Is there a separate "Checkout API" key section?

**If there's a separate Checkout API key:**
- Use that instead of POS key
- Update `.env.local` with Checkout API credentials

---

### Step 2: Contact EazyPay Support (URGENT)

**Email them immediately with this:**

```
Subject: URGENT - Checkout API createInvoice Error -4 "Invalid number of inputs"

Hi EazyPay Support,

I'm getting error -4 "Invalid number of inputs" when calling createInvoice.

**My Setup:**
- Endpoint: POST https://api.eazy.net/merchant/checkout/createInvoice
- App ID: 057af880-525c-42d7-9a0c-678563fdeab4
- Using: POS API Key from Merchant Details

**What I'm Sending:**
Headers:
- Content-Type: application/json
- Timestamp: [timestamp]
- Secret-Hash: [HMAC-SHA256 hash]

Body (tried multiple combinations):
1. { "currency": "BHD", "amount": "5.000", "returnUrl": "..." } - FAILED
2. { "appId": "...", "currency": "BHD", "amount": "5.000", "returnUrl": "..." } - FAILED

**Questions:**
1. Am I using the CORRECT API key type? (POS vs Checkout API)
2. What are the EXACT required fields for createInvoice?
3. Should appId be in body, header, or neither?
4. What field names should I use? (camelCase vs snake_case)
5. Can you provide a working example request?

**URGENT:** Need exact requirements to complete integration.

Thank you!
```

---

### Step 3: Check EazyPay Dashboard

**Look for:**
1. **Checkout API section** (separate from POS)
2. **API activation status** (is it enabled?)
3. **API documentation** (integration guides)
4. **Example requests** (sample code)

---

## 🎯 Most Likely Issue

**You're using POS API key for Checkout API**

**POS API** and **Checkout API** might be different:
- POS API = Point of Sale (different endpoint/structure)
- Checkout API = Online checkout (what we need)

**Solution:**
- Check if there's a separate "Checkout API" key in dashboard
- Use Checkout API credentials, not POS credentials

---

## 📋 Quick Checklist

- [ ] **Check EazyPay dashboard** for "Checkout API" section (separate from POS)
- [ ] **Verify API key type** - Is POS key correct for Checkout API?
- [ ] **Check API activation** - Is Checkout API enabled?
- [ ] **Contact EazyPay support** - Get exact requirements
- [ ] **Check API documentation** - Look for createInvoice examples

---

## 🔧 What I Just Changed

**Added appId as header:**
- Now trying `App-Id` header instead of body
- This might be how EazyPay identifies the app

**Try checkout again** - if it still fails, we MUST contact EazyPay.

---

## 💡 Bottom Line

**The error is too specific** - EazyPay knows exactly what it expects, and we're not matching it.

**We need:**
1. ✅ Confirmation we're using the RIGHT API key type
2. ✅ Exact field requirements from EazyPay
3. ✅ Working example request

**Contact EazyPay support NOW** - this can't be fixed without their exact requirements.




