# Email to EazyPay Support - Copy and Send This

## 📧 Email Template

**To:** support@eazy.net (or your EazyPay account manager)  
**Subject:** URGENT - Checkout API createInvoice Error -4 "Invalid number of inputs"

---

**Body:**

```
Hi EazyPay Support Team,

I'm integrating the Checkout API createInvoice endpoint and consistently getting error:
"Invalid number of inputs" (code: -4)

**My Setup:**
- App ID: bb905241-747d-4e95-9e26-0b33e6148eb3 (Currently using - please confirm if correct)
- Terminal ID: 30021461
- API Endpoint: POST https://api.eazy.net/merchant/checkout/createInvoice
- Merchant: HelloOneBahrain
- I also have POS Key: 057af880-525c-42d7-9a0c-678563fdeab4 (please confirm which to use)

**What I've Tried (ALL FAILED with error -4):**

1. camelCase fields (4 fields):
   {
     "appId": "057af880-525c-42d7-9a0c-678563fdeab4",
     "currency": "BHD",
     "amount": "5.000",
     "returnUrl": "https://helloonebahrain.com/pay/complete?orderId=..."
   }

2. snake_case fields (4 fields):
   {
     "app_id": "057af880-525c-42d7-9a0c-678563fdeab4",
     "currency": "BHD",
     "amount": "5.000",
     "return_url": "https://helloonebahrain.com/pay/complete?orderId=..."
   }

3. Without appId (3 fields):
   {
     "currency": "BHD",
     "amount": "5.000",
     "returnUrl": "https://helloonebahrain.com/pay/complete?orderId=..."
   }

4. With terminal_id (5 fields):
   {
     "app_id": "057af880-525c-42d7-9a0c-678563fdeab4",
     "currency": "BHD",
     "amount": "5.000",
     "return_url": "...",
     "terminal_id": "30021461"
   }

**My Request Format:**
- Method: POST
- Headers:
  - Content-Type: application/json
  - Timestamp: [milliseconds timestamp]
  - Secret-Hash: [HMAC-SHA256(secret, timestamp + currency + amount + appId)]
- Body: (tried all combinations above)

**Response I'm Getting:**
{
  "result": {
    "code": "-4",
    "title": "Error",
    "description": "Invalid number of inputs",
    "isSuccess": false
  },
  "data": null
}

**My Questions:**

1. What are the EXACT required fields for createInvoice API?
2. What field name format should I use? (camelCase: appId, returnUrl OR snake_case: app_id, return_url?)
3. Should appId/app_id be included in the request body, or only used for hash computation?
4. Is terminal_id required? If yes, what field name? (terminalId or terminal_id?)
5. Are these fields supported/required: cancelUrl, webhookUrl, description, userToken?
6. Can you provide a working example request body that I can test?
7. Is there updated API documentation I should reference?

**URGENT:** I need to complete this integration. Please provide exact field requirements.

Thank you for your assistance!

Best regards,
[Your Name]
[Your Contact Info]
```

---

## 📋 Before Sending

1. ✅ Replace `[Your Name]` and `[Your Contact Info]`
2. ✅ Verify your App ID is correct (check EazyPay dashboard)
3. ✅ Verify Terminal ID is correct (30021461)
4. ✅ Send to the correct EazyPay support email

---

## 🎯 What to Expect

EazyPay support should provide:
- Exact field requirements
- Field name format (camelCase vs snake_case)
- Working example request
- Updated API documentation link

---

## ⏰ Follow Up

If you don't hear back in 24-48 hours:
- Call EazyPay support
- Escalate to your account manager
- Check EazyPay dashboard for support chat/phone

