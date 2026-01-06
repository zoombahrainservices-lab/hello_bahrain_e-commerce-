# BENEFIT Redirect URLs - Localhost Configuration

## What Was Changed

The BENEFIT payment gateway redirect URLs have been updated to use `localhost:3000` for development testing.

## Changes Made

**File**: `client/src/app/api/payments/benefit/init/route.ts`

The URLs now automatically use:
- **Development**: `http://localhost:3000` (when `NODE_ENV === 'development'`)
- **Production**: `https://helloonebahrain.com` (when deployed)

## URLs Generated

### Development (Localhost)
- Response URL: `http://localhost:3000/pay/benefit/response?orderId=...`
- Error URL: `http://localhost:3000/pay/benefit/error?orderId=...`

### Production
- Response URL: `https://helloonebahrain.com/pay/benefit/response?orderId=...`
- Error URL: `https://helloonebahrain.com/pay/benefit/error?orderId=...`

## Testing Locally

1. **Start development server**:
   ```bash
   cd client
   npm run dev
   ```

2. **Make a payment**:
   - Go to checkout
   - Select "BenefitPay"
   - Complete payment on BENEFIT gateway

3. **BENEFIT will redirect to**:
   - Success: `http://localhost:3000/pay/benefit/response?orderId=...`
   - Error: `http://localhost:3000/pay/benefit/error?orderId=...`

## Important Notes

⚠️ **BENEFIT Gateway URL Requirements**:
- URLs must be publicly accessible (localhost won't work from BENEFIT's servers)
- For **actual testing with BENEFIT**, you may need to:
  - Use a service like **ngrok** to expose localhost
  - Or test in production/staging environment
  - Or use BENEFIT's test environment that supports localhost

## Using ngrok for Testing (Optional)

If BENEFIT gateway can't reach localhost directly:

1. **Install ngrok**:
   ```bash
   npm install -g ngrok
   # Or download from https://ngrok.com
   ```

2. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

3. **Update code temporarily** to use ngrok URL:
   ```typescript
   const baseUrl = process.env.NGROK_URL || 'http://localhost:3000';
   ```

4. **Set environment variable**:
   ```env
   NGROK_URL=https://your-ngrok-url.ngrok.io
   ```

## Revert to Production URLs

If you want to use production URLs even in development, you can:

1. Set `CLIENT_URL` in `.env.local`:
   ```env
   CLIENT_URL=https://helloonebahrain.com
   ```

2. Or modify the code to always use `CLIENT_URL`:
   ```typescript
   const baseUrl = process.env.CLIENT_URL || 'https://helloonebahrain.com';
   ```

---

**Current Status**: ✅ URLs will use `localhost:3000` in development mode automatically.



