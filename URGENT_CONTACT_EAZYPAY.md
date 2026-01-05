# 🚨 URGENT: Contact EazyPay Support - Exact Issue Details

## 🔍 Problem Summary

**Error:** "Invalid number of inputs" (Code: -4)  
**Status:** Persists despite correct request format

**Your Current Setup:**
- App ID: `50002754` ✅ (numeric, correct format)
- Secret Key: `ba88853dad...` ❌ (This is PORTAL secret key, not Checkout!)
- Request: 6 fields (appId, invoiceId, currency, amount, paymentMethod, returnUrl) ✅
- Hash: `timestamp + currency + amount + appId` ✅

---

## 📧 Email to EazyPay Support

**To:** support@eazy.net (or your account manager)  
**Subject:** URGENT - Checkout API Error -4: Need Checkout Secret Key for App ID 50002754

**Body:**

```
Hi EazyPay Support Team,

I'm getting error -4 "Invalid number of inputs" when calling /checkout/createInvoice.

**My Setup:**
- App ID: 50002754
- Endpoint: POST https://api.eazy.net/merchant/checkout/createInvoice
- Merchant: HelloOneBahrain

**My Request:**
Headers:
- Timestamp: [milliseconds]
- Secret-Hash: HMAC-SHA256(secret, timestamp + currency + amount + appId)
- Content-Type: application/json; charset=utf-8

Body:
{
  "appId": "50002754",
  "invoiceId": "ORDER_...",
  "currency": "BHD",
  "amount": "5.000",
  "paymentMethod": "BENEFITGATEWAY,CREDITCARD,APPLEPAY",
  "returnUrl": "https://helloonebahrain.com/pay/complete?orderId=..."
}

**Response:**
{
  "result": {
    "code": "-4",
    "description": "Invalid number of inputs"
  }
}

**My Questions:**

1. Do I have a separate Checkout Secret Key for App ID 50002754?
   - I currently have Portal Secret Key: ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464
   - Is this the same as Checkout Secret Key, or do I need a different one?

2. Is App ID 50002754 activated/enabled for Checkout API?
   - Do I need to activate it in the dashboard?

3. Can you verify my request format is correct?
   - Am I missing any required fields?
   - Are the field names correct?

4. Can you provide a working example request for App ID 50002754?

**URGENT:** Need to complete payment integration. Please provide exact credentials and requirements.

Thank you!
```

---

## 🔧 What to Check in EazyPay Dashboard

1. **Checkout API Section**
   - Look for App ID `50002754`
   - Find its corresponding Secret Key
   - Verify it's different from Portal secret

2. **API Activation**
   - Check if Checkout API is enabled
   - Verify App ID `50002754` is active

3. **Credentials**
   - Note down the exact Checkout Secret Key
   - Verify it matches App ID `50002754`

---

## ✅ Once You Get Response

1. **Update `.env.local`:**
   ```env
   EAZYPAY_CHECKOUT_APP_ID=50002754
   EAZYPAY_CHECKOUT_SECRET_KEY=[the Checkout secret key they provide]
   ```

2. **Restart server**

3. **Test checkout**

---

## 💡 Why This Is Happening

**Most Likely Cause:** You're using Portal Secret Key with Checkout App ID.

**EazyPay has separate credentials:**
- Portal API → Portal API Key + Portal Secret Key
- Checkout API → Checkout App ID + Checkout Secret Key

**They cannot be mixed!**

If EazyPay says they're the same, then the issue is something else (account activation, API version, etc.).

---

## 🎯 Bottom Line

**Contact EazyPay support with the email above.** They need to:
1. Confirm you have Checkout Secret Key for App ID 50002754
2. Provide the exact secret key
3. Verify your account is activated

This is the only way to fix it permanently.




