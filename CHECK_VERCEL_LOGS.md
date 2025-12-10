# How to Check Vercel Function Logs for 500 Errors

## ⚠️ IMPORTANT: The Real Error is in Vercel Logs, Not Browser Console!

The browser console only shows "500 Internal Server Error" - the **actual error message** is in Vercel's function logs.

---

## Step 1: Check Vercel Function Logs

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your project (`helloonebahrain` or similar)
3. Click **"Functions"** tab (top navigation)
4. You'll see a list of API routes:
   - `/api/products`
   - `/api/categories`
   - `/api/banners/active`
5. Click on any failing function (e.g., `/api/products`)
6. Click the **"Logs"** tab
7. **Look for the actual error message** - it will tell you exactly what's wrong!

Common errors you might see:
- `relation "products" does not exist` → Database tables not created in production Supabase
- `Missing Supabase environment variables` → Environment variables not set correctly
- `Invalid API key` → Wrong service_role key
- `permission denied for table` → Database permissions issue

---

## Step 2: Use the Health Check Endpoint

I've created a diagnostic endpoint to help debug:

1. Visit: `https://helloonebahrain.com/api/health`
2. This will show you:
   - ✅ Environment variables status
   - ✅ Database connection status
   - ✅ Which tables exist
   - ✅ Any errors

**This will tell you exactly what's missing!**

---

## Step 3: Common Issues & Fixes

### Issue: "relation does not exist"
**Problem**: Database tables don't exist in your **production** Supabase instance.

**Solution**:
1. Go to your **production** Supabase project (the one connected to Vercel)
2. Run the SQL scripts (`schema.sql` and `schema-updates.sql`)
3. Verify tables exist in Table Editor
4. Redeploy on Vercel

**Note**: Your local Supabase and production Supabase are **different databases**! You need to set up both.

### Issue: "Missing Supabase environment variables"
**Problem**: Environment variables not set or not redeployed.

**Solution**:
1. Go to Vercel → Settings → Environment Variables
2. Verify all variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
3. **Redeploy** after adding/changing variables

### Issue: "Invalid API key"
**Problem**: Wrong service_role key or key from wrong Supabase project.

**Solution**:
1. Go to Supabase → Settings → API
2. Copy the **service_role** key (not anon key)
3. Make sure it's from the **same project** as `SUPABASE_URL`
4. Update in Vercel and redeploy

---

## Step 4: Verify Production Database Setup

**Important**: Your local database and production database are **separate**!

1. **Check which Supabase project Vercel is using**:
   - Look at `SUPABASE_URL` in Vercel environment variables
   - It should be something like: `https://xxxxx.supabase.co`

2. **Go to that Supabase project**:
   - https://app.supabase.com
   - Select the project matching the URL

3. **Verify tables exist**:
   - Go to **Table Editor**
   - Check if these tables exist:
     - ✅ `users`
     - ✅ `products`
     - ✅ `banners`
     - ✅ `orders`
     - ✅ `order_items`
     - ✅ `categories`
     - ✅ `contact_messages`
     - ✅ `user_addresses`

4. **If tables don't exist, run SQL scripts**:
   - Go to **SQL Editor**
   - Run `schema.sql`
   - Run `schema-updates.sql`

---

## Quick Diagnostic Steps

1. ✅ Visit `https://helloonebahrain.com/api/health` - Check what it says
2. ✅ Check Vercel function logs - See actual error
3. ✅ Verify environment variables in Vercel
4. ✅ Verify database tables exist in **production** Supabase
5. ✅ Redeploy on Vercel after any changes

---

## Still Not Working?

1. **Share the error from Vercel logs** (not browser console)
2. **Share the output from `/api/health` endpoint**
3. This will tell us exactly what's wrong!


