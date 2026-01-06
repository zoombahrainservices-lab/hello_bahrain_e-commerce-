# Step-by-Step: Building EazyPay Payment Gateway

## ✅ Step 1: Database Migration (Already Done!)

You've already run the SQL migration in Supabase. Great! ✅

---

## 📝 Step 2: Get Your EazyPay Credentials

### What You Need:

Contact **Eazy Financial Services** and request:

1. **For Customer Payments (Checkout API):**
   - `EAZYPAY_CHECKOUT_APP_ID` - Your application ID
   - `EAZYPAY_CHECKOUT_SECRET_KEY` - Your secret key for signing

2. **For Admin Operations (Portal API):**
   - `EAZYPAY_PORTAL_API_KEY` - Your portal API key
   - `EAZYPAY_PORTAL_SECRET_KEY` - Your portal secret key

**Ask them:** "I need credentials for EazyPay Checkout API and Portal API integration"

---

## 🔧 Step 3: Configure Environment Variables

### 3.1 Open the Environment File

Navigate to: `client/.env.local`

**Path:** `C:\Users\DELL\Desktop\hello_bahrain_e-commerce\client\.env.local`

### 3.2 Find These Lines

Look for these lines in the file:

```env
# EazyPay Checkout API (for customer payments)
EAZYPAY_CHECKOUT_APP_ID=your_checkout_app_id_here
EAZYPAY_CHECKOUT_SECRET_KEY=your_checkout_secret_key_here

# EazyPay Portal API (for admin operations)
EAZYPAY_PORTAL_API_KEY=your_portal_api_key_here
EAZYPAY_PORTAL_SECRET_KEY=your_portal_secret_key_here
```

### 3.3 Replace with Your Credentials

Replace the placeholder values:

```env
# EazyPay Checkout API (for customer payments)
EAZYPAY_CHECKOUT_APP_ID=abc123-def456-ghi789
EAZYPAY_CHECKOUT_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# EazyPay Portal API (for admin operations)
EAZYPAY_PORTAL_API_KEY=6fcb6ca8-8a11-4ef4-9b5a-f5f0a0b9d46a
EAZYPAY_PORTAL_SECRET_KEY=your_secret_key_here
```

**Important:** 
- Keep the quotes if your values have special characters
- Don't add spaces around the `=` sign
- Save the file after editing

---

## 🚀 Step 4: Start the Development Server

### 4.1 Open Terminal

Open PowerShell or Command Prompt in your project directory.

### 4.2 Navigate to Client Folder

```bash
cd client
```

### 4.3 Start the Server

```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
✓ Ready in 2.5s
```

**Keep this terminal open!** The server needs to keep running.

---

## 🧪 Step 5: Test the Payment Gateway

### 5.1 Open Your Browser

Go to: `http://localhost:3000`

### 5.2 Test the Payment Flow

1. **Browse Products**
   - Click on any product
   - Add it to cart

2. **Go to Cart**
   - Click cart icon
   - Review items
   - Click "Proceed to Checkout"

3. **Enter Shipping Address**
   - Fill in all required fields:
     - Full Name
     - Address Line 1
     - City
     - Country
     - Postal Code
     - Phone
   - Click "Continue to Payment"

4. **Select Payment Method**
   - Choose **"Credit / Debit Card"** or **"BenefitPay"**
   - Click **"Confirm & Place Order"**

5. **Payment Redirect**
   - You should be redirected to EazyPay payment page
   - Complete the payment (use test credentials if in sandbox mode)

6. **Return to Site**
   - After payment, you'll be redirected back
   - You should see "Payment successful!" message
   - Order will be created and marked as paid

---

## ✅ Step 6: Verify Everything Works

### 6.1 Check the Order in Database

1. Go to **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Go to **Table Editor** → **orders**
4. Find your test order
5. Verify these fields:

   ✅ `global_transactions_id` - Should have a transaction ID
   ✅ `payment_status` - Should be `paid`
   ✅ `paid_on` - Should have a timestamp
   ✅ `payment_method` - Should show the method used
   ✅ `payment_raw_response` - Should contain JSON data

### 6.2 Check Server Logs

Look at your terminal where `npm run dev` is running. You should see:
- No error messages
- Successful API calls logged

### 6.3 Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Look for any errors (should be none)

---

## 🔍 Step 7: Test Admin Endpoints (Optional)

### 7.1 Login as Admin

1. Go to: `http://localhost:3000/auth/login`
2. Login with:
   - Email: `admin@hellobahrain.com`
   - Password: `Admin@1234`

### 7.2 Test Admin API

Open a new terminal and test:

```bash
# Get your token first (from browser after login)
# Then test transactions endpoint:
curl -X GET "http://localhost:3000/api/admin/eazypay/transactions?page=1&size=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** JSON response with transaction data

---

## 🐛 Troubleshooting

### Problem: "EazyPay Checkout credentials not configured"

**Solution:**
1. Check `.env.local` file exists in `client/` folder
2. Verify credentials are set (not placeholder values)
3. **Restart the dev server** after updating `.env.local`
4. Make sure there are no typos in variable names

### Problem: Payment page doesn't redirect

**Solution:**
1. Check browser console for errors (F12)
2. Verify `CLIENT_URL` is set in `.env.local`
3. Check server logs for errors
4. Verify credentials are correct

### Problem: "Order not found" error

**Solution:**
1. Make sure you're logged in
2. Verify order was created before payment
3. Check order exists in Supabase database

### Problem: Webhook not working

**Solution:**
1. For local testing, use ngrok to expose your server
2. Set webhook URL in EazyPay dashboard
3. Verify signature computation is correct
4. Check server logs for webhook requests

---

## 📋 Quick Checklist

Before going live, make sure:

- [ ] Database migration completed ✅ (You did this!)
- [ ] EazyPay credentials obtained
- [ ] `.env.local` file updated with credentials
- [ ] Dev server starts without errors
- [ ] Payment flow works end-to-end
- [ ] Order is created in database
- [ ] Payment status updates correctly
- [ ] Admin endpoints work (if using)

---

## 🚀 Next: Production Deployment

Once testing is complete:

1. **Add credentials to Vercel:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all 4 EazyPay variables
   - Set for Production environment

2. **Configure Webhook:**
   - Set webhook URL in EazyPay dashboard:
   - `https://helloonebahrain.com/api/payments/eazypay/webhook`

3. **Deploy:**
   - Push code to GitHub
   - Vercel will auto-deploy

4. **Test Production:**
   - Make a small test transaction
   - Verify everything works

---

## 📚 Additional Resources

- **Detailed Guide:** `EAZYPAY_BUILD_INSTRUCTIONS.md`
- **Integration Docs:** `EAZYPAY_INTEGRATION_README.md`
- **Quick Start:** `QUICK_START_EASYPAY.md`

---

## 💡 Tips

1. **Start with Test Credentials:** Use sandbox/test mode first
2. **Test Small Amounts:** Test with small transaction amounts
3. **Monitor Logs:** Keep an eye on server logs during testing
4. **Check Database:** Verify data is saved correctly
5. **Test Both Methods:** Test both Card and BenefitPay if available

---

## 🆘 Need Help?

1. **Check Logs:** Server console and browser console
2. **Verify Credentials:** Double-check all environment variables
3. **Review Documentation:** See README files
4. **Contact EazyPay:** For API-related issues
5. **Check Database:** Verify migration was successful

---

## ✅ Success Indicators

You'll know it's working when:

✅ Payment redirects to EazyPay page
✅ Payment completes successfully
✅ You're redirected back to your site
✅ Order shows "paid" status in database
✅ Payment details are stored correctly
✅ No errors in console or logs

---

**You're all set! Follow these steps and your payment gateway will be ready to go! 🎉**





