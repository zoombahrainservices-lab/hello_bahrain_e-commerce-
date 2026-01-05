# EazyPay Payment Gateway - Step-by-Step Build Instructions

## Prerequisites ✅

- [x] Database migration run in Supabase
- [ ] EazyPay credentials obtained from Eazy Financial Services
- [ ] Next.js development environment ready

---

## Step 1: Get EazyPay Credentials

Contact **Eazy Financial Services** and request:

1. **Checkout API Credentials** (for customer payments):
   - `EAZYPAY_CHECKOUT_APP_ID`
   - `EAZYPAY_CHECKOUT_SECRET_KEY`

2. **Portal API Credentials** (for admin operations):
   - `EAZYPAY_PORTAL_API_KEY`
   - `EAZYPAY_PORTAL_SECRET_KEY`

**Note:** Ask if you're getting **test/sandbox** or **production** credentials. Start with test credentials for development.

---

## Step 2: Update Environment Variables

### 2.1 Open `.env.local` file

Navigate to: `client/.env.local`

### 2.2 Add EazyPay Credentials

Find these lines in the file:

```env
# EazyPay Checkout API (for customer payments)
EAZYPAY_CHECKOUT_APP_ID=your_checkout_app_id_here
EAZYPAY_CHECKOUT_SECRET_KEY=your_checkout_secret_key_here

# EazyPay Portal API (for admin operations)
EAZYPAY_PORTAL_API_KEY=your_portal_api_key_here
EAZYPAY_PORTAL_SECRET_KEY=your_portal_secret_key_here
```

Replace the placeholder values with your actual credentials:

```env
# EazyPay Checkout API (for customer payments)
EAZYPAY_CHECKOUT_APP_ID=abc123-def456-ghi789
EAZYPAY_CHECKOUT_SECRET_KEY=your_actual_secret_key_here

# EazyPay Portal API (for admin operations)
EAZYPAY_PORTAL_API_KEY=xyz789-abc123-def456
EAZYPAY_PORTAL_SECRET_KEY=your_actual_portal_secret_here
```

### 2.3 Verify Other Variables

Make sure these are also set correctly:

```env
CLIENT_URL=https://helloonebahrain.com
# Or for local testing:
# CLIENT_URL=http://localhost:3000
```

**Save the file** after updating.

---

## Step 3: Install Dependencies (if needed)

The project uses Node.js built-in `crypto` module, so no additional packages are needed. However, verify dependencies are installed:

```bash
cd client
npm install
```

---

## Step 4: Start Development Server

```bash
cd client
npm run dev
```

The server should start on `http://localhost:3000`

**Expected output:**
```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

---

## Step 5: Test the Payment Gateway

### 5.1 Test Invoice Creation (Backend Test)

Open a new terminal and test the create-invoice endpoint:

```bash
# First, get a JWT token by logging in
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@hellobahrain.com","password":"Admin@1234"}'
```

Copy the `token` from the response, then:

```bash
# Create a test order first (you'll need a valid order ID)
# Then test invoice creation:
curl -X POST http://localhost:3000/api/payments/eazypay/create-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "orderId": "test-order-123",
    "amount": "10.500",
    "currency": "BHD",
    "description": "Test Order"
  }'
```

**Expected Response:**
```json
{
  "paymentUrl": "https://checkout.eazy.net/...",
  "globalTransactionsId": "txn-123456",
  "userToken": "token-789"
}
```

### 5.2 Test Full Payment Flow (Frontend Test)

1. **Open browser**: Go to `http://localhost:3000`

2. **Add items to cart**:
   - Browse products
   - Add items to cart
   - Go to cart page

3. **Proceed to checkout**:
   - Click "Checkout"
   - Fill in shipping address
   - Click "Continue to Payment"

4. **Select payment method**:
   - Choose "Credit / Debit Card" or "BenefitPay"
   - Click "Confirm & Place Order"

5. **Payment redirect**:
   - You should be redirected to EazyPay payment page
   - Complete test payment (use test card if in sandbox mode)

6. **Return to site**:
   - After payment, you'll be redirected to `/pay/complete`
   - Payment status will be verified
   - Order will be updated to "paid" status

---

## Step 6: Verify Database Updates

### 6.1 Check Order in Supabase

1. Go to **Supabase Dashboard** → **Table Editor** → **orders**
2. Find your test order
3. Verify these fields are populated:
   - `global_transactions_id` - Should have EazyPay transaction ID
   - `payment_status` - Should be `paid` after successful payment
   - `paid_on` - Should have timestamp
   - `payment_method` - Should show payment method used
   - `payment_raw_response` - Should contain JSON response

### 6.2 Verify Payment Fields

Check that all new columns exist:
- `global_transactions_id`
- `payment_method`
- `paid_on`
- `payment_raw_response`
- `user_token`
- `dcc_uptake`
- `dcc_receipt_text`

---

## Step 7: Test Webhook (Optional - Advanced)

### 7.1 Set up Webhook Testing

For local testing, you can use a tool like **ngrok** to expose your local server:

```bash
# Install ngrok (if not installed)
# Then run:
ngrok http 3000
```

This will give you a public URL like: `https://abc123.ngrok.io`

### 7.2 Configure Webhook in EazyPay

1. Log into EazyPay merchant portal
2. Go to Webhook settings
3. Set webhook URL to: `https://your-ngrok-url.ngrok.io/api/payments/eazypay/webhook`
4. Save settings

### 7.3 Test Webhook

Make a test payment and verify:
- Webhook is received
- Signature is verified
- Order status is updated

**Note:** For production, set webhook URL to:
`https://helloonebahrain.com/api/payments/eazypay/webhook`

---

## Step 8: Test Admin Portal APIs

### 8.1 Test Transactions Endpoint

```bash
curl -X GET "http://localhost:3000/api/admin/eazypay/transactions?page=1&size=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 8.2 Test Settlements Endpoint

```bash
curl -X GET "http://localhost:3000/api/admin/eazypay/settlements?from=2024-01-01&to=2024-01-31" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 8.3 Test Other Admin Endpoints

- VAT Report: `/api/admin/eazypay/vat?from=...&to=...`
- Disputes: `/api/admin/eazypay/disputes?page=1&size=20`
- Transaction Details: `/api/admin/eazypay/transaction-details?rrn=...&authCode=...`

---

## Step 9: Verify Error Handling

### 9.1 Test Invalid Credentials

Temporarily change a credential to an invalid value and verify:
- Error messages are logged (check console)
- User-friendly error is returned
- No sensitive data is exposed

### 9.2 Test Missing Parameters

Test endpoints with missing required parameters:
- Should return 400 Bad Request
- Should have clear error message

### 9.3 Test Unauthorized Access

Test admin endpoints without authentication:
- Should return 401 Unauthorized

---

## Step 10: Production Deployment

### 10.1 Add Environment Variables to Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add all EazyPay variables:
   - `EAZYPAY_CHECKOUT_APP_ID`
   - `EAZYPAY_CHECKOUT_SECRET_KEY`
   - `EAZYPAY_PORTAL_API_KEY`
   - `EAZYPAY_PORTAL_SECRET_KEY`
   - `CLIENT_URL` (should be `https://helloonebahrain.com`)

3. Set for **Production**, **Preview**, and **Development** environments

### 10.2 Configure Webhook in EazyPay

1. Log into EazyPay merchant portal
2. Set production webhook URL:
   ```
   https://helloonebahrain.com/api/payments/eazypay/webhook
   ```
3. Save settings

### 10.3 Deploy to Vercel

```bash
# Push to your repository
git add .
git commit -m "Add EazyPay integration"
git push origin main
```

Vercel will automatically deploy.

### 10.4 Test Production

1. Make a small test transaction
2. Verify payment processes correctly
3. Check order status updates
4. Verify webhook is received
5. Check admin endpoints work

---

## Troubleshooting

### Issue: "EazyPay Checkout credentials not configured"

**Solution:** 
- Check `.env.local` file exists
- Verify credentials are set correctly
- Restart dev server after updating `.env.local`

### Issue: "Order not found" error

**Solution:**
- Verify order exists in database
- Check order belongs to authenticated user
- Verify order ID is correct

### Issue: "Invalid signature" in webhook

**Solution:**
- Verify `EAZYPAY_CHECKOUT_SECRET_KEY` matches EazyPay dashboard
- Check signature computation logic
- Verify timestamp format (milliseconds)

### Issue: Payment redirect not working

**Solution:**
- Check `CLIENT_URL` is set correctly
- Verify return URL in invoice creation
- Check browser console for errors

### Issue: Admin endpoints return 403

**Solution:**
- Verify user has admin role
- Check JWT token is valid
- Ensure `requireAdmin` middleware is working

---

## Testing Checklist

Before going live, complete this checklist:

### Development Testing
- [ ] Environment variables configured
- [ ] Invoice creation works
- [ ] Payment redirect works
- [ ] Payment completion page works
- [ ] Order status updates correctly
- [ ] Database fields are populated
- [ ] Error handling works

### Admin Testing
- [ ] Transactions endpoint works
- [ ] Settlements endpoint works
- [ ] VAT endpoint works
- [ ] Disputes endpoints work
- [ ] Transaction lookup works

### Production Testing
- [ ] Environment variables set in Vercel
- [ ] Webhook URL configured
- [ ] Test transaction successful
- [ ] Webhook receives notifications
- [ ] Order updates correctly
- [ ] Admin endpoints accessible

---

## Next Steps After Testing

1. **Monitor logs** for any errors
2. **Test with real transactions** (small amounts first)
3. **Verify webhook reliability**
4. **Set up monitoring/alerts** for payment failures
5. **Document any customizations** made

---

## Support

If you encounter issues:

1. **Check logs**: Server console and browser console
2. **Verify credentials**: Double-check all environment variables
3. **Test endpoints**: Use curl/Postman to test API endpoints directly
4. **Contact EazyPay**: For API-related issues
5. **Review documentation**: See `EAZYPAY_INTEGRATION_README.md`

---

## Quick Reference

### Key Files
- Services: `client/src/lib/services/eazypayCheckout.ts`
- Payment API: `client/src/app/api/payments/eazypay/`
- Admin API: `client/src/app/api/admin/eazypay/`
- Payment Page: `client/src/app/pay/complete/page.tsx`

### Key Endpoints
- Create Invoice: `POST /api/payments/eazypay/create-invoice`
- Query Payment: `POST /api/payments/eazypay/query`
- Webhook: `POST /api/payments/eazypay/webhook`
- Admin Transactions: `GET /api/admin/eazypay/transactions`

### Environment Variables
- `EAZYPAY_CHECKOUT_APP_ID`
- `EAZYPAY_CHECKOUT_SECRET_KEY`
- `EAZYPAY_PORTAL_API_KEY`
- `EAZYPAY_PORTAL_SECRET_KEY`
- `CLIENT_URL`




