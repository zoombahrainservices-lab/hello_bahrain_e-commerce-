# Deployment Guide

## Vercel Deployment

### Quick Setup

1. **Connect Repository to Vercel**
   - Import your GitHub repository in Vercel
   - Vercel will auto-detect Next.js

2. **Set Root Directory** (if needed)
   - Go to **Settings** → **General**
   - Set **Root Directory** to `client`

3. **Add Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Add all required variables (see below)

4. **Deploy**
   - Vercel will automatically deploy on every push to `main`

### Required Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# REQUIRED - Database
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# REQUIRED - Authentication
JWT_SECRET=your_secret_key_minimum_32_characters

# Optional - Payments
EAZYPAY_MERCHANT_ID=...
EAZYPAY_API_PASSWORD=...
EAZYPAY_API_BASE_URL=...
EAZYPAY_RETURN_URL=https://helloonebahrain.com/payment/eazypay/return
EAZYPAY_CANCEL_URL=https://helloonebahrain.com/payment/eazypay/cancel

# Optional - OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://helloonebahrain.com/api/auth/google/callback

# Client URL
CLIENT_URL=https://helloonebahrain.com
```

### Build Settings

Vercel should auto-detect these, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `client` (if repo root is parent directory)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### After Deployment

1. Check deployment logs for errors
2. Test the website:
   - Homepage loads products
   - Admin panel works
   - API routes respond correctly

## Server Directory

The `server/` directory is **no longer needed** for running the application. All functionality is now in Next.js serverless API routes.

**You can:**
- ✅ Keep it for reference/utility scripts
- ✅ Delete it if you don't need the scripts
- ✅ Archive it to a separate branch

**Note**: The server directory is not deployed to Vercel - only the `client/` directory is used.


