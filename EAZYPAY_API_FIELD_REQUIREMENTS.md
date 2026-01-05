# EazyPay API Field Requirements - Troubleshooting

## Current Error
**"Invalid number of inputs" (Code: -4)**

This means EazyPay is rejecting the request because:
- Wrong number of fields (too many or too few)
- Wrong field names
- Missing required fields
- Extra fields that aren't supported

---

## What We're Currently Sending

```json
{
  "currency": "BHD",
  "amount": "5.000",
  "returnUrl": "https://helloonebahrain.com/pay/complete?orderId=...",
  "cancelUrl": "https://helloonebahrain.com/checkout/payment?orderId=...&cancelled=true",
  "webhookUrl": "https://helloonebahrain.com/api/payments/eazypay/webhook",
  "description": "Order #..."
}
```

**Fields count: 6**

---

## Possible Solutions to Try

### Option 1: Include appId in Body
Some APIs require appId in the body even though it's used in hash.

**Try:**
```json
{
  "appId": "057af880-525c-42d7-9a0c-678563fdeab4",
  "currency": "BHD",
  "amount": "5.000",
  "returnUrl": "..."
}
```

### Option 2: Minimal Fields Only
Remove all optional fields, keep only required.

**Try:**
```json
{
  "currency": "BHD",
  "amount": "5.000",
  "returnUrl": "..."
}
```

### Option 3: Snake Case Field Names
Maybe EazyPay expects snake_case instead of camelCase.

**Try:**
```json
{
  "currency": "BHD",
  "amount": "5.000",
  "return_url": "...",
  "cancel_url": "...",
  "webhook_url": "..."
}
```

### Option 4: Check EazyPay Documentation
The exact field requirements should be in EazyPay's API documentation.

---

## Next Steps

1. **Contact EazyPay Support**
   - Ask: "What are the exact required fields for createInvoice API?"
   - Ask: "What field names should I use? (camelCase vs snake_case)"
   - Ask: "Should appId be in request body or only in headers?"

2. **Check EazyPay Integration Guide**
   - Look for "Checkout API" or "Create Invoice" documentation
   - Check for example requests/responses

3. **Try Different Combinations**
   - Test with appId in body
   - Test with minimal fields
   - Test with snake_case names

---

## What to Ask EazyPay Support

**Email them:**
```
Subject: Checkout API createInvoice - "Invalid number of inputs" error

Hi EazyPay Support,

I'm integrating the Checkout API createInvoice endpoint and getting error:
"Invalid number of inputs" (code: -4)

I'm sending:
- currency: "BHD"
- amount: "5.000"
- returnUrl: "https://..."
- cancelUrl: "https://..."
- webhookUrl: "https://..."
- description: "Order #..."

Questions:
1. What are the exact required fields for createInvoice?
2. Should appId be included in request body?
3. What field names should I use? (camelCase or snake_case)
4. Are cancelUrl, webhookUrl, description supported?
5. Can you provide an example request body?

My App ID: 057af880-525c-42d7-9a0c-678563fdeab4

Thank you!
```

---

## Current Status

**Trying:** Including appId in body + minimal fields (currency, amount, returnUrl)

**If this fails:** Need to contact EazyPay for exact field requirements.




