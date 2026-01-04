# Contact EazyPay Support - Required Information

## 🚨 Critical Issue: "Invalid number of inputs" Error

We've tried multiple field combinations and the error persists. **We need EazyPay's exact API requirements.**

---

## Email Template for EazyPay Support

**To:** support@eazy.net (or your account manager)

**Subject:** Checkout API createInvoice - "Invalid number of inputs" Error (Code: -4)

**Body:**

```
Hi EazyPay Support Team,

I'm integrating the Checkout API createInvoice endpoint and consistently getting error:
"Invalid number of inputs" (code: -4)

**My Setup:**
- App ID: 057af880-525c-42d7-9a0c-678563fdeab4
- API Endpoint: POST https://api.eazy.net/merchant/checkout/createInvoice
- Terminal ID: 30021461

**What I've Tried:**

1. With appId in body (4 fields):
   {
     "appId": "057af880-525c-42d7-9a0c-678563fdeab4",
     "currency": "BHD",
     "amount": "5.000",
     "returnUrl": "https://helloonebahrain.com/pay/complete?orderId=..."
   }
   Result: Error -4 "Invalid number of inputs"

2. Without appId in body (3 fields):
   {
     "currency": "BHD",
     "amount": "5.000",
     "returnUrl": "https://helloonebahrain.com/pay/complete?orderId=..."
   }
   Result: Error -4 "Invalid number of inputs"

**My Questions:**

1. What are the EXACT required fields for createInvoice API?
2. Should appId be included in the request body or only in headers/hash?
3. What field names should I use? (camelCase: returnUrl or snake_case: return_url?)
4. Are these fields supported: cancelUrl, webhookUrl, description, userToken?
5. Can you provide a working example request body?
6. What is the exact request body structure you expect?

**Current Request:**
- Method: POST
- Headers: Content-Type: application/json, Timestamp, Secret-Hash
- Hash: HMAC-SHA256(secret, timestamp + currency + amount + appId)
- Body: (tried multiple combinations, all fail with -4)

**Response I'm Getting:**
{
  "result": {
    "code": "-4",
    "description": "Invalid number of inputs",
    "isSuccess": false
  },
  "data": null
}

Please provide the exact field requirements so I can complete the integration.

Thank you!
```

---

## What to Ask Specifically

1. **Exact field list** - What fields are required vs optional?
2. **Field names** - camelCase or snake_case?
3. **appId location** - In body or only in hash?
4. **Example request** - Can they provide a working example?
5. **API documentation** - Where can I find the complete API docs?

---

## While Waiting for Response

**Try these in order:**

1. ✅ **Current:** Without appId, 3 fields (currency, amount, returnUrl)
2. ⏭️ **Next:** Try with snake_case: `return_url` instead of `returnUrl`
3. ⏭️ **Next:** Try with only 2 fields: currency, amount (no returnUrl)
4. ⏭️ **Next:** Check EazyPay dashboard for API documentation

---

## Why This Is Needed

The error "Invalid number of inputs" is very specific - it means:
- EazyPay knows exactly how many fields it expects
- We're not matching that exact number
- Without their documentation, we're guessing

**Only EazyPay can tell us the exact requirements!**

---

## Next Steps

1. **Send the email above** to EazyPay support
2. **Try checkout again** with current fix (3 fields, no appId)
3. **If still fails**, wait for EazyPay response with exact requirements
4. **Once we have requirements**, I'll update the code immediately

---

**Bottom Line:** We need EazyPay's exact API field requirements. The error is too specific for us to guess correctly.



