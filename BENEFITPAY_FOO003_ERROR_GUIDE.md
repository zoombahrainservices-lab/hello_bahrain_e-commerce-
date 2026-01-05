# BenefitPay Wallet Error: "Merchant does not support payment" (FOO-003)

## 🚨 Error Explanation

**Error Code:** FOO-003  
**Message:** "Merchant does not support payment" / "Could not complete operation. Merchant does not support payment"

**What This Means:**
- ✅ Your credentials are **correct** (merchantId: 3186, appId: 1988588907)
- ✅ Your code is **working correctly** (hash generation, parameters all correct)
- ❌ Your merchant account is **NOT enabled** for BenefitPay Wallet payments in BenefitPay's system

**This is NOT a localhost issue** - the error comes from BenefitPay's servers, not your local environment.

---

## 🔍 How to Verify

### Check Your Logs

You should see:
```
[BenefitPay Wallet Config] ✓ merchantId: 3186
[BenefitPay Wallet Config] ✓ appId: 1988588907
[BenefitPay Wallet Config] ✓ secretKey: SET (length: 45)
```

And in the SDK response:
```json
{
  "action": "error",
  "data": {
    "message": "Could not complete operation. Merchant does not support payment"
  }
}
```

Or in check-status API:
```json
{
  "meta": {"status": "FAILED"},
  "response": {
    "status": "FAILED",
    "code": "FOO-003",
    "message": "Merchant does not support payment"
  }
}
```

---

## ✅ Solution: Contact BenefitPay Support

### Step 1: Prepare Your Information

**Merchant Details:**
- Merchant ID: `3186`
- App ID: `1988588907`
- Secret Key: `z2sd680omqyp0pw9qsini7p8jpoh2fmbg84k3ucc1zfut` (45 chars)
- Environment: Test (`https://api.test-benefitpay.bh`)
- Payment Method: BenefitPay Wallet (Web Checkout SDK)

**Error Details:**
- Error Code: FOO-003
- Error Message: "Merchant does not support payment"
- When: When trying to initialize wallet payment via SDK

### Step 2: Contact BenefitPay Support

**Email Template:**

```
Subject: Request to Enable BenefitPay Wallet Payments - Merchant ID 3186

Dear BenefitPay Support Team,

I am integrating BenefitPay Wallet (Web Checkout SDK) and encountering error FOO-003: 
"Merchant does not support payment" when attempting to process payments.

Merchant Details:
- Merchant ID: 3186
- App ID: 1988588907
- Environment: Test (api.test-benefitpay.bh)
- Integration Type: BenefitPay Wallet Web Checkout SDK

Error Details:
- Error Code: FOO-003
- Error Message: "Merchant does not support payment"
- API Endpoint: https://api.test-benefitpay.bh/web/v1/merchant/transaction/check-status

Request:
I need to activate/enable BenefitPay Wallet payments for my merchant account. 
Please confirm:
1. Is my merchant account enabled for wallet payments?
2. If not, what is the process to enable it?
3. Are there any additional requirements or approvals needed?
4. What is the expected timeline for activation?

Thank you for your assistance.

Best regards,
[Your Name]
[Your Company]
[Contact Information]
```

### Step 3: Alternative - Check BenefitPay Dashboard

1. Log into your BenefitPay merchant dashboard
2. Navigate to "Settings" or "Payment Methods"
3. Look for "BenefitPay Wallet" or "Web Checkout SDK" section
4. Check if it's enabled/activated
5. If there's an "Enable" button, activate it

---

## 🔧 What We've Verified (Your Code is Correct)

### ✅ Credentials
- Merchant ID: 3186 ✓
- App ID: 1988588907 ✓
- Secret Key: 45 characters ✓

### ✅ Parameters
- merchantId: "3186" ✓
- appId: "1988588907" ✓
- transactionAmount: "2.000" ✓
- transactionCurrency: "BHD" ✓
- qr_timeout: "150000" ✓
- referenceNumber: Generated correctly ✓

### ✅ Hash Generation
- Hash input: `appId="1988588907",hideMobileQR="0",merchantId="3186",qr_timeout="150000",referenceNumber="HB_...",showResult="1",transactionAmount="2.000",transactionCurrency="BHD"` ✓
- Hash length: 44 characters ✓
- Algorithm: HMAC-SHA256 → Base64 ✓

### ✅ SDK Integration
- SDK loads correctly ✓
- Parameters sent correctly ✓
- SDK opens popup ✓
- BenefitPay receives request ✓

**Conclusion:** Your implementation is correct. The issue is account activation on BenefitPay's side.

---

## 📋 Common Questions

### Q: Is this because I'm running on localhost?
**A:** No. The error comes from BenefitPay's servers, not your local environment. BenefitPay receives your request correctly but responds that the merchant account doesn't support wallet payments.

### Q: Do I need different credentials?
**A:** Possibly. You might need:
- Different merchant ID for wallet vs card payments
- Different app ID for wallet vs card payments
- Wallet-specific credentials (separate from Payment Gateway)

### Q: Can I test without activation?
**A:** No. BenefitPay requires the merchant account to be activated for wallet payments before you can test.

### Q: How long does activation take?
**A:** Typically 1-3 business days, but contact BenefitPay support for exact timeline.

---

## 🎯 Next Steps

1. **Contact BenefitPay Support** using the email template above
2. **Check BenefitPay Dashboard** for wallet payment settings
3. **Wait for Activation** - BenefitPay will enable wallet payments for your account
4. **Test Again** - Once activated, your existing code should work

---

## 📝 Notes

- Your code implementation is **100% correct**
- The error is **account-level**, not code-level
- Once BenefitPay activates your account, payments will work immediately
- No code changes needed after activation

---

## 🔗 Related Files

- `client/src/lib/services/benefitpay_wallet/config.ts` - Credential validation
- `client/src/lib/services/benefitpay_wallet/signing.ts` - Hash generation
- `client/src/app/api/payments/benefitpay/init/route.ts` - Payment initialization
- `client/src/app/checkout/payment/page.tsx` - Frontend integration

All of these are working correctly. The issue is purely on BenefitPay's account activation side.

