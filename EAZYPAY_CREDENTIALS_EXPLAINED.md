# EazyPay Credentials Explained

## Why There Are 2 Secret Keys

EazyPay has **TWO separate APIs** that require different credentials:

### 1. **Checkout API** (Customer Payments)
- **Purpose:** For customers to make payments on your website
- **Used for:** Creating invoices, processing payments, webhooks
- **Credentials:**
  - `EAZYPAY_CHECKOUT_APP_ID` - Your application ID
  - `EAZYPAY_CHECKOUT_SECRET_KEY` - Secret key for signing requests

### 2. **Portal API** (Admin Operations)
- **Purpose:** For admin dashboard features (view transactions, settlements, disputes)
- **Used for:** Admin panel, reports, transaction management
- **Credentials:**
  - `EAZYPAY_PORTAL_API_KEY` - Your portal API key
  - `EAZYPAY_PORTAL_SECRET_KEY` - Secret key for portal API

---

## What is App ID?

**App ID** (`EAZYPAY_CHECKOUT_APP_ID`) is your **unique application identifier** for the Checkout API.

### What it looks like:
- Usually a numeric string like: `50002754` or `30021461`
- Sometimes called "Application ID" or "App ID" in EazyPay dashboard

### Where to find it:
1. **EazyPay Merchant Dashboard**
   - Look for "API Settings" or "Checkout API" section
   - May be labeled as "Application ID" or "App ID"
   - Sometimes shown next to the Secret Key

2. **Check your email**
   - EazyPay may have sent it when you registered
   - Look for onboarding emails

3. **Contact EazyPay Support**
   - If you can't find it, ask them for your "Checkout API App ID"

### How it's used:
```typescript
// In createInvoice request
{
  appId: "50002754",  // Your App ID
  currency: "BHD",
  amount: "80.000",
  ...
}

// In HMAC hash computation
const message = timestamp + currency + amount + appId;
// Uses your App ID in the hash
```

---

## Complete Credentials List

### For Customer Payments (Checkout API):
```env
EAZYPAY_CHECKOUT_APP_ID=50002754          # Your App ID (find in dashboard)
EAZYPAY_CHECKOUT_SECRET_KEY=ba88853...   # Secret Key (from Store Details page)
```

### For Admin Operations (Portal API):
```env
EAZYPAY_PORTAL_API_KEY=your_portal_api_key        # Find in Portal API section
EAZYPAY_PORTAL_SECRET_KEY=your_portal_secret_key  # Find in Portal API section
```

---

## Where to Find Each Credential

### 1. Checkout API Credentials (Customer Payments)

**Secret Key:**
- ✅ **You already have this!** 
- Location: Store Details page → API section → "Secret Key" field
- Value: `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464`

**App ID:**
- ⚠️ **You need to find this**
- Location: EazyPay Dashboard → API Settings or Checkout API section
- May be labeled as:
  - "Application ID"
  - "App ID"
  - "Checkout App ID"
  - Sometimes shown as a number like `50002754`

### 2. Portal API Credentials (Admin Features)

**API Key & Secret Key:**
- ⚠️ **You need to find these**
- Location: EazyPay Dashboard → Portal API section or Admin API section
- Look for:
  - "Portal API Key"
  - "Portal Secret Key"
  - Or "Admin API" credentials

---

## Why Two Separate APIs?

### Checkout API (Customer Payments)
- **Who uses it:** Your customers
- **What it does:** Processes payments
- **When it's used:** Every time a customer pays
- **Security:** Must be very secure (handles money)

### Portal API (Admin Operations)
- **Who uses it:** Your admin team
- **What it does:** Views reports, manages disputes
- **When it's used:** When admins check transactions
- **Security:** Also secure, but different access level

**Think of it like:**
- **Checkout API** = Cash register (handles payments)
- **Portal API** = Back office system (views reports)

---

## Quick Checklist

### Checkout API (Required for payments):
- [x] Secret Key: `ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464` ✅ (You have this)
- [ ] App ID: `????` ⚠️ (Need to find in dashboard)

### Portal API (Required for admin features):
- [ ] Portal API Key: `????` ⚠️ (Need to find)
- [ ] Portal Secret Key: `????` ⚠️ (Need to find)

---

## How to Find App ID

### Method 1: Check EazyPay Dashboard
1. Login to EazyPay Merchant Dashboard
2. Go to "API Settings" or "Checkout API" section
3. Look for "Application ID" or "App ID"
4. It's usually a number like `50002754`

### Method 2: Check API Documentation
- Look for API documentation in your EazyPay account
- App ID is usually mentioned there

### Method 3: Contact EazyPay Support
- Email: support@eazy.net (or your account manager)
- Ask: "What is my Checkout API App ID?"
- They should provide it quickly

### Method 4: Check Email History
- Search your email for "EazyPay" or "application ID"
- Check onboarding emails from when you registered

---

## Example .env.local File

```env
# EazyPay Checkout API (Customer Payments)
EAZYPAY_CHECKOUT_APP_ID=50002754
EAZYPAY_CHECKOUT_SECRET_KEY=ba88853dad7e462595621b318560bd8039b5babf1a824ba7b51dc049c0fd0464

# EazyPay Portal API (Admin Operations)
EAZYPAY_PORTAL_API_KEY=your_portal_api_key_here
EAZYPAY_PORTAL_SECRET_KEY=your_portal_secret_key_here

# Other settings
CLIENT_URL=https://helloonebahrain.com
```

---

## Summary

**Why 2 Secret Keys?**
- ✅ **Checkout Secret Key**: For customer payments (you have this)
- ✅ **Portal Secret Key**: For admin dashboard features (need to find)

**What is App ID?**
- ✅ Your unique application identifier for Checkout API
- ✅ Used in API requests and HMAC hash computation
- ✅ Usually a number like `50002754`
- ⚠️ **You need to find this in EazyPay dashboard**

**Next Steps:**
1. Find App ID in EazyPay dashboard
2. Find Portal API credentials (if you need admin features)
3. Add all to `.env.local`
4. Test the payment flow

---

## Still Can't Find App ID?

**Contact EazyPay Support:**
- Email: support@eazy.net
- Phone: Check your EazyPay dashboard for support contact
- Ask: "I need my Checkout API App ID for integration"

They should provide it within 24 hours.




