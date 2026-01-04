# Troubleshooting: "No payment URL received" Error

## What This Error Means

The error "No payment URL received" happens when:
- The API call to `/api/payments/eazypay/create-invoice` fails
- The response doesn't contain a `paymentUrl`
- EazyPay API call failed (credentials, network, etc.)

---

## Step-by-Step Troubleshooting

### Step 1: Check Server Logs

**Open your terminal where the dev server is running** and look for errors:

```bash
# Look for these error messages:
- "Error creating EazyPay invoice"
- "EazyPay Checkout credentials not configured"
- "EazyPay API error"
```

**What to look for:**
- Missing credentials error
- API authentication error
- Network error
- Invalid response from EazyPay

---

### Step 2: Verify Credentials in .env.local

**Check if credentials are set correctly:**

```env
# Should be set (not "your_checkout_app_id_here")
EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
```

**Common issues:**
- ❌ Still has placeholder: `your_checkout_app_id_here`
- ❌ Wrong secret key (using PORTAL secret instead of POS secret)
- ❌ Missing credentials
- ❌ Credentials not loaded (server needs restart)

---

### Step 3: Check Browser Console

**Open browser DevTools (F12) → Console tab**

**Look for:**
- Network errors (red)
- API call failures
- Error messages from the frontend

**Check Network tab:**
- Go to Network tab
- Try checkout again
- Look for `/api/payments/eazypay/create-invoice` request
- Check the response - what error does it show?

---

### Step 4: Common Causes & Fixes

#### Cause 1: Credentials Not Set ✅ **MOST COMMON**

**Error in logs:**
```
EazyPay Checkout credentials not configured
```

**Fix:**
1. Open `client/.env.local`
2. Update these lines:
   ```env
   EAZYPAY_CHECKOUT_APP_ID=057af880-525c-42d7-9a0c-678563fdeab4
   EAZYPAY_CHECKOUT_SECRET_KEY=3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec
   ```
3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   cd client
   npm run dev
   ```

---

#### Cause 2: Wrong Secret Key

**Error in logs:**
```
EazyPay API error: 401 - Unauthorized
```

**Problem:**
- Using PORTAL secret key instead of POS secret key
- Secret key doesn't match the App ID

**Fix:**
- Use POS Secret Key: `3667a83553e14ca5aa1df7d07862c95ecb2602172be5467ca23aeaacc6c452ec`
- NOT PORTAL Secret Key: `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464`

---

#### Cause 3: API Authentication Failed

**Error in logs:**
```
EazyPay API error: 401
Invalid signature
```

**Problem:**
- HMAC signature computation failed
- Amount formatting mismatch
- Timestamp issue

**Fix:**
- Check amount is formatted correctly (3 decimals: "5.000")
- Verify credentials are correct
- Check server time is correct

---

#### Cause 4: Network Error

**Error in logs:**
```
EazyPay API request timeout
Failed to fetch
```

**Problem:**
- Can't reach EazyPay API
- Network issue
- Firewall blocking

**Fix:**
- Check internet connection
- Verify EazyPay API is accessible: `https://api.eazy.net/merchant/checkout`
- Check firewall settings

---

#### Cause 5: Invalid Response from EazyPay

**Error in logs:**
```
EazyPay API error: 400 - Bad Request
```

**Problem:**
- Invalid request parameters
- Missing required fields
- Amount format issue

**Fix:**
- Check amount is valid (positive number)
- Verify currency is "BHD"
- Check returnUrl format

---

## Quick Fix Checklist

- [ ] **Credentials set correctly** in `.env.local`
- [ ] **Using POS Secret Key** (not PORTAL)
- [ ] **Server restarted** after updating credentials
- [ ] **Check server logs** for actual error
- [ ] **Check browser console** for frontend errors
- [ ] **Check Network tab** for API response

---

## How to Get the Actual Error

### Method 1: Check Server Terminal

**Look at the terminal where `npm run dev` is running:**

You should see something like:
```
Error creating EazyPay invoice: EazyPay API error: 401 - Unauthorized
```

**This tells you the real problem!**

---

### Method 2: Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try checkout again
4. Find `/api/payments/eazypay/create-invoice` request
5. Click on it
6. Check "Response" tab - what error does it show?

---

### Method 3: Check Browser Console

**Open Console tab (F12 → Console)**

Look for:
- Red error messages
- API call errors
- Network errors

---

## Most Likely Issue

**90% of the time, it's one of these:**

1. ✅ **Credentials not set** - Still has placeholder values
2. ✅ **Wrong secret key** - Using PORTAL secret instead of POS secret
3. ✅ **Server not restarted** - Credentials not loaded

---

## Quick Test

**Try this in your browser console (F12):**

```javascript
// Test if credentials are loaded (won't show values, just check if they exist)
fetch('/api/payments/eazypay/create-invoice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'test',
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

## Next Steps

1. **Check server logs** - Find the actual error
2. **Verify credentials** - Make sure they're set correctly
3. **Restart server** - After updating credentials
4. **Share the error** - From server logs or browser console

**Once you share the actual error message, I can give you the exact fix!**



