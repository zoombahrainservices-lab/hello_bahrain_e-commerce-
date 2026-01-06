# Fix: "No payment URL received" Error on Localhost

## ✅ Localhost is NOT the Problem!

**Why:**
- The API call happens **server-side** (from your Next.js server to EazyPay)
- Localhost works fine for testing
- The issue is **credentials not configured**

---

## 🔍 Step 1: Check Server Terminal for Actual Error

**This is the MOST IMPORTANT step!**

1. **Look at the terminal where `npm run dev` is running**
2. **Try checkout again**
3. **Look for error messages** - you should see something like:

```
Error creating EazyPay invoice: EazyPay Checkout credentials not configured
```

or

```
EazyPay createInvoice error: 401 Unauthorized
```

**Share this error message with me!**

---

## 🔧 Step 2: Verify Credentials Are Set

### Check your `.env.local` file:

**Open:** `client/.env.local`

**Must have these lines (NOT placeholders):**
```env
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
```

**Common mistakes:**
- ❌ Still has: `your_checkout_app_id_here`
- ❌ Wrong secret key (using PORTAL secret instead of POS secret)
- ❌ Missing credentials entirely

---

## 🔄 Step 3: Restart Dev Server (CRITICAL!)

**After updating `.env.local`, you MUST restart the server:**

```bash
# 1. Stop the server (press Ctrl+C in the terminal)

# 2. Restart it:
cd client
npm run dev
```

**Why:**
- Environment variables are loaded when the server starts
- Changes to `.env.local` won't take effect until restart

---

## 🧪 Step 4: Test with Browser Console

**Open browser DevTools (F12) → Console tab**

**Run this test:**
```javascript
fetch('/api/payments/eazypay/create-invoice', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN' // You need to be logged in
  },
  body: JSON.stringify({
    orderId: 'test-order-123',
    amount: '5.000',
    currency: 'BHD'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**This will show you the actual error!**

---

## 🎯 Most Common Issues

### Issue 1: Credentials Not Set ✅ **90% of cases**

**Error in terminal:**
```
EazyPay Checkout credentials not configured
```

**Fix:**
1. Open `client/.env.local`
2. Add/update:
   ```env
   EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
   EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
   ```
3. **Restart server**

---

### Issue 2: Wrong Secret Key

**Error in terminal:**
```
EazyPay API error: 401 - Unauthorized
```

**Problem:**
- Using PORTAL secret key instead of POS secret key

**Fix:**
- Use POS Secret Key: `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`
- NOT: `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464` (this is PORTAL)

---

### Issue 3: Server Not Restarted

**Problem:**
- Updated `.env.local` but didn't restart server
- Old credentials still loaded

**Fix:**
- Stop server (Ctrl+C)
- Restart: `npm run dev`

---

## 📋 Quick Checklist

- [ ] **Credentials set in `.env.local`** (not placeholders)
- [ ] **Using POS Secret Key** (not PORTAL)
- [ ] **Server restarted** after updating credentials
- [ ] **Check server terminal** for actual error message
- [ ] **Check browser console** (F12) for errors

---

## 🔍 How to Find the Real Error

### Method 1: Server Terminal (BEST)

**Look at terminal where `npm run dev` is running:**

You'll see the actual error like:
```
Error creating EazyPay invoice: EazyPay Checkout credentials not configured
```

**This tells you exactly what's wrong!**

---

### Method 2: Browser Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try checkout again
4. Find `/api/payments/eazypay/create-invoice` request
5. Click it → Check **Response** tab
6. You'll see the error message

---

### Method 3: Browser Console

1. Open DevTools (F12) → **Console** tab
2. Try checkout again
3. Look for red error messages
4. They'll show the actual error

---

## 🚀 Quick Fix Steps

1. **Open** `client/.env.local`
2. **Verify** these lines exist:
   ```env
   EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
   EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
   ```
3. **Save** the file
4. **Stop** server (Ctrl+C)
5. **Restart** server: `npm run dev`
6. **Try checkout again**

---

## ❓ Still Not Working?

**Please share:**
1. **Error from server terminal** (the actual error message)
2. **Error from browser console** (F12 → Console)
3. **Response from Network tab** (F12 → Network → click request → Response)

**With the actual error, I can give you the exact fix!**

---

## 💡 Important Notes

- ✅ **Localhost works fine** - not the problem
- ✅ **API calls are server-side** - browser doesn't matter
- ✅ **Most likely:** Credentials not set or server not restarted
- ✅ **Check server terminal** - it shows the real error

---

**Bottom Line:** Check your server terminal for the actual error message - that will tell us exactly what's wrong!





