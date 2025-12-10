# Vercel Deployment Guide

## Why You're Getting 500 Errors

The 500 errors on Vercel are because **environment variables are not set**. The API routes need Supabase credentials to connect to the database.

## Fix: Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project (`helloonebahrain` or similar)
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Required Variables

Add these **REQUIRED** environment variables:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
```

### Step 3: Add Optional Variables (if using)

```env
# EazyPay (if using online payments)
EAZYPAY_MERCHANT_ID=your_merchant_id
EAZYPAY_API_PASSWORD=your_api_password
EAZYPAY_API_BASE_URL=https://your_eazypay_url
EAZYPAY_RETURN_URL=https://helloonebahrain.com/payment/eazypay/return
EAZYPAY_CANCEL_URL=https://helloonebahrain.com/payment/eazypay/cancel

# Google OAuth (if using Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://helloonebahrain.com/api/auth/google/callback

# Client URL
CLIENT_URL=https://helloonebahrain.com
```

### Step 4: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger automatic redeploy

## Important Notes

1. **Environment Scope**: Make sure to add variables for:
   - **Production** (for your live site)
   - **Preview** (for preview deployments)
   - **Development** (optional, for local dev)

2. **No NEXT_PUBLIC_API_BASE_URL**: Don't set this - we're using serverless routes now

3. **Supabase Credentials**: Get these from:
   - https://app.supabase.com
   - Your project → Settings → API
   - Copy **Project URL** → `SUPABASE_URL`
   - Copy **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

## Verify Deployment

After redeploying, check:
1. Visit https://helloonebahrain.com
2. Products should load (no 500 errors)
3. Admin panel should work at https://helloonebahrain.com/admin

## Troubleshooting

### Still getting 500 errors?
1. Check Vercel deployment logs:
   - Go to **Deployments** → Click on latest deployment → **Functions** tab
   - Look for error messages in the logs

2. Common issues:
   - Missing `SUPABASE_URL` → Check it's set correctly
   - Missing `SUPABASE_SERVICE_ROLE_KEY` → Make sure it's the service_role key, not anon key
   - Wrong JWT_SECRET → Should be at least 32 characters
   - Variables not applied → Make sure to redeploy after adding variables

3. Check function logs:
   - In Vercel dashboard, go to **Functions** tab
   - Click on a failing function (e.g., `/api/products`)
   - Check the error message

## Project Structure for Vercel

Vercel automatically detects Next.js projects. Make sure:
- ✅ Root directory is `client/` (or update in Vercel settings)
- ✅ Build command: `npm run build` (default)
- ✅ Output directory: `.next` (default)

If your project root is the repository root, update Vercel settings:
- **Settings** → **General** → **Root Directory**: `client`


