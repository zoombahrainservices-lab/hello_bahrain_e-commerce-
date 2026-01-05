# Quick Start Guide - Payment Gateway Setup

## 🚀 Get Started in 5 Steps

### Step 1: Add Environment Variables ⚙️

Add to `client/.env.local`:

```env
# EazyPay (Card Payments)
EAZYPAY_CHECKOUT_APP_ID=your_app_id_here
EAZYPAY_CHECKOUT_SECRET_KEY=your_secret_key_here

# BENEFIT (BenefitPay)
BENEFIT_TRANPORTAL_ID=your_tranportal_id_here
BENEFIT_TRANPORTAL_PASSWORD=your_tranportal_password_here
BENEFIT_RESOURCE_KEY=your_32_character_key_here
BENEFIT_ENDPOINT=https://test.benefit-gateway.bh/payment/API/hosted.htm

# Common
CLIENT_URL=http://localhost:3000
```

### Step 2: Run Database Migration 📊

In Supabase SQL Editor:

```sql
-- Run ADD_BENEFIT_PAYMENT_FIELDS.sql
```

### Step 3: Restart Server 🔄

```bash
cd client
npm run dev
```

### Step 4: Test Payments ✅

1. **Card Payment**: Select "Credit / Debit Card" → EazyPay
2. **BenefitPay**: Select "BenefitPay" → BENEFIT Gateway
3. **COD**: Select "Cash on Delivery" → Direct order

### Step 5: Deploy to Production 🚀

Add environment variables to Vercel Dashboard:
- Settings → Environment Variables
- Add all variables from Step 1
- Change endpoints to production URLs
- Deploy!

---

## 📞 Need Credentials?

### EazyPay
- Contact: EazyPay support
- Need: App ID, Secret Key

### BENEFIT
- Contact: support@benefit.bh
- Need: Tranportal ID, Password, Resource Key (32 chars)

---

## 🔍 Quick Troubleshooting

### EazyPay Error: "Invalid number of inputs"
```env
# Try adding this to .env.local:
EAZYPAY_SIGNATURE_FORMULA=all_fields
```

### BENEFIT Error: Decryption fails
- Check: Resource key is exactly 32 characters
- Verify: No spaces or special characters

### Payment Not Working
1. Check environment variables are set
2. Restart development server
3. Check browser console for errors
4. Check server logs for detailed errors

---

## 📚 Full Documentation

- **Implementation Details**: `BENEFIT_IMPLEMENTATION_COMPLETE.md`
- **Environment Setup**: `BENEFIT_ENV_SETUP.md`
- **Payment Summary**: `PAYMENT_GATEWAY_SUMMARY.md`
- **Original Plan**: `BENEFIT_GATEWAY_IMPLEMENTATION_PLAN.md`

---

## ✅ What's Implemented

- ✅ Card payments via EazyPay
- ✅ BenefitPay via BENEFIT Gateway
- ✅ Cash on Delivery
- ✅ Automatic payment routing
- ✅ Error handling
- ✅ Transaction tracking
- ✅ Inventory management
- ✅ Webhook/notification support

---

## 🎯 Payment Flow

```
User selects payment method
         ↓
System routes to correct gateway
         ↓
    Card → EazyPay
    BenefitPay → BENEFIT
    COD → Direct order
         ↓
User completes payment
         ↓
System validates & updates order
         ↓
Success page shown
```

---

## 🔐 Security Notes

- ✅ All credentials server-side only
- ✅ AES-256-CBC encryption for BENEFIT
- ✅ HMAC-SHA256 signatures for EazyPay
- ✅ Amount validation
- ✅ Order validation
- ✅ Idempotent processing

---

## 📊 Database Fields

### Orders Table - New Fields
- `benefit_payment_id` - BENEFIT payment ID
- `benefit_trans_id` - Transaction ID
- `benefit_ref` - Reference number
- `benefit_auth_resp_code` - Auth code

### Payment Status
- `unpaid` - Awaiting payment
- `paid` - Payment successful
- `failed` - Payment failed

---

## 🆘 Support

- **Documentation**: Check markdown files in root
- **EazyPay**: Contact EazyPay support
- **BENEFIT**: support@benefit.bh
- **Technical**: Review implementation files

---

**That's it! You're ready to accept payments! 🎉**


