# EazyPay Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Credentials from Eazy
Contact Eazy Financial Services and get:
- Checkout App ID
- Checkout Secret Key
- Portal API Key
- Portal Secret Key

### Step 2: Update `.env.local`

Open `client/.env.local` and replace these values:

```env
EAZYPAY_CHECKOUT_APP_ID=YOUR_ACTUAL_APP_ID
EAZYPAY_CHECKOUT_SECRET_KEY=YOUR_ACTUAL_SECRET_KEY
EAZYPAY_PORTAL_API_KEY=YOUR_ACTUAL_PORTAL_API_KEY
EAZYPAY_PORTAL_SECRET_KEY=YOUR_ACTUAL_PORTAL_SECRET_KEY
```

### Step 3: Start Server

```bash
cd client
npm run dev
```

### Step 4: Test Payment

1. Go to `http://localhost:3000`
2. Add items to cart
3. Go to checkout
4. Select "Credit / Debit Card"
5. Complete payment

### Step 5: Verify

Check Supabase → orders table:
- `global_transactions_id` should be populated
- `payment_status` should be `paid`
- `paid_on` should have timestamp

---

## ✅ That's It!

Your payment gateway is now ready. For detailed instructions, see `EAZYPAY_BUILD_INSTRUCTIONS.md`





