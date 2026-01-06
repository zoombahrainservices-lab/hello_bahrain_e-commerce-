# BenefitPay Integration - Deployment Instructions

## ✅ Code Changes Deployed

All code changes have been pushed to GitHub and will automatically deploy to Vercel.

**Commit:** `3247b63` - "Fix BenefitPay ACK flow - separate acknowledgement from processing"

## 🚨 Critical Next Steps

You MUST complete these steps for the integration to work:

### Step 1: Run Database Migration

Go to Supabase SQL Editor and run:

```sql
-- Add benefit_track_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS benefit_track_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_orders_benefit_track_id ON orders(benefit_track_id);
COMMENT ON COLUMN orders.benefit_track_id IS 'Numeric trackId used for BenefitPay transactions (timestamp-based)';
```

Or copy/paste from: `ADD_BENEFIT_TRACK_ID.sql`

### Step 2: Update Vercel Environment Variables

**CRITICAL**: Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Update or add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `CLIENT_URL` | `https://helloonebahrain.com` | ⚠️ MUST be production URL (never localhost) |
| `BENEFIT_TRANPORTAL_ID` | (your value) | From BenefitPay portal |
| `BENEFIT_TRANPORTAL_PASSWORD` | (your value) | From BenefitPay portal |
| `BENEFIT_RESOURCE_KEY` | (your value) | From BenefitPay portal |
| `BENEFIT_ENDPOINT` | `https://test.benefit-gateway.bh/payment/API/hosted.htm` | Test environment |

**Important:**
- Select "Production", "Preview", and "Development" for each variable
- After updating, click "Redeploy" on the latest deployment

### Step 3: Verify Deployment

Once Vercel deployment completes, test the ACK endpoint:

```bash
curl https://helloonebahrain.com/api/payments/benefit/ack?orderId=test
```

Expected response:
```
REDIRECT=https://helloonebahrain.com/pay/benefit/response?orderId=test
```

If you get this response, the ACK endpoint is working correctly! ✅

### Step 4: Test Complete Payment Flow

1. **Create a test order** on your site
2. **Select BenefitPay** as payment method
3. **Complete payment** on BenefitPay gateway
4. **Verify redirect** to response page
5. **Check order status** in database (should be "paid")

## 📋 What Changed

### New Files Created
- ✅ `client/src/app/api/payments/benefit/ack/route.ts` - Fast ACK endpoint
- ✅ `ADD_BENEFIT_TRACK_ID.sql` - Database migration
- ✅ `BENEFIT_ENV_VARIABLES.md` - Environment setup guide
- ✅ `BENEFIT_IMPLEMENTATION_SUMMARY.md` - Technical details
- ✅ `DEPLOYMENT_INSTRUCTIONS.md` - This file

### Files Modified
- ✅ `client/src/app/api/payments/benefit/init/route.ts` - Uses ACK URL, numeric trackId
- ✅ `client/src/app/pay/benefit/response/page.tsx` - Simplified processing

### Files Deleted
- ✅ `client/src/app/api/payments/benefit/callback/route.ts` - Replaced by ACK endpoint

## 🔍 How to Verify It's Working

### 1. Check ACK Endpoint
```bash
curl https://helloonebahrain.com/api/payments/benefit/ack?orderId=test
```
Should return: `REDIRECT=https://helloonebahrain.com/pay/benefit/response?orderId=test`

### 2. Check Vercel Logs
- Go to Vercel Dashboard → Your Project → Deployments
- Click on latest deployment → Functions
- Look for `/api/payments/benefit/ack` logs

### 3. Test Payment Flow
- Complete a real payment (or test payment if available)
- Should NOT see IPAY0400001 error
- Should NOT see HTTP 405 error
- Should redirect to response page successfully

## 🐛 Troubleshooting

### Still getting IPAY0400001?

**Check:**
1. Is `CLIENT_URL` set to `https://helloonebahrain.com` in Vercel? (not localhost)
2. Did you redeploy after updating environment variables?
3. Is the ACK endpoint publicly accessible? (test with curl)

**Fix:**
- Update `CLIENT_URL` in Vercel
- Redeploy the application
- Wait 1-2 minutes for deployment to complete

### Still getting HTTP 405?

**Check:**
1. Is the response page deployed correctly?
2. Are there any build errors in Vercel?

**Fix:**
- Check Vercel build logs
- Redeploy if needed

### Payment not updating in database?

**Check:**
1. Did you run the database migration?
2. Are Supabase credentials correct?
3. Check Vercel function logs for errors

**Fix:**
- Run `ADD_BENEFIT_TRACK_ID.sql` in Supabase
- Verify Supabase environment variables

## 📚 Documentation

For more details, see:
- `BENEFIT_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `BENEFIT_ENV_VARIABLES.md` - Environment variables guide
- `ADD_BENEFIT_TRACK_ID.sql` - Database migration script

## ✅ Deployment Checklist

- [x] Code pushed to GitHub
- [x] Vercel deployment triggered automatically
- [ ] Database migration run in Supabase
- [ ] Environment variables updated in Vercel
- [ ] Vercel redeployed after env var update
- [ ] ACK endpoint tested with curl
- [ ] Complete payment flow tested
- [ ] Order status verified in database

## 🎉 Success Criteria

You'll know it's working when:
1. ✅ No IPAY0400001 error
2. ✅ No HTTP 405 error
3. ✅ Payment redirects to response page
4. ✅ Order status updates to "paid"
5. ✅ Transaction details displayed correctly

## 🆘 Need Help?

If issues persist after completing all steps:
1. Check Vercel function logs
2. Check Supabase logs
3. Verify all environment variables are set correctly
4. Test ACK endpoint accessibility
5. Review BenefitPay portal settings (ensure Merchant Notification is enabled)

---

**Next Action:** Complete Steps 1-4 above, then test the payment flow!



