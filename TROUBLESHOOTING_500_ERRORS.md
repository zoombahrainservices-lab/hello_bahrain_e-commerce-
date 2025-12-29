# Troubleshooting 500 Errors on Vercel

## ✅ Step 1: Verify Environment Variables

You've already added:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `JWT_SECRET`

**Important**: After adding environment variables, you **MUST redeploy**!

1. Go to Vercel Dashboard → **Deployments**
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

## ✅ Step 2: Check Vercel Function Logs

The real error is in Vercel's logs, not the browser console.

1. Go to Vercel Dashboard → Your Project
2. Click **"Functions"** tab
3. Click on a failing function (e.g., `/api/products`)
4. Check the **"Logs"** tab
5. Look for the actual error message

Common errors you might see:
- `relation "products" does not exist` → Database tables not created
- `relation "categories" does not exist` → Database tables not created
- `Missing Supabase environment variables` → Variables not set correctly
- `Invalid API key` → Wrong service role key

---

## ✅ Step 3: Set Up Supabase Database

**This is likely the issue!** Your database tables don't exist yet.

### Run SQL Scripts in Supabase

1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New query"**

#### Run Main Schema

1. Open `server/src/config/schema.sql` in your project
2. **Copy ALL contents**
3. Paste into Supabase SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter`)

#### Run Schema Updates

1. Open `server/src/config/schema-updates.sql` in your project
2. **Copy ALL contents**
3. Paste into Supabase SQL Editor
4. Click **"Run"**

### Verify Tables Exist

1. Go to **Table Editor** (left sidebar in Supabase)
2. You should see these tables:
   - ✅ `users`
   - ✅ `products`
   - ✅ `banners`
   - ✅ `orders`
   - ✅ `order_items`
   - ✅ `categories`
   - ✅ `contact_messages`
   - ✅ `user_addresses`

If any are missing, the SQL scripts didn't run successfully. Check the SQL Editor for error messages.

---

## ✅ Step 4: Create Storage Bucket

1. Go to Supabase → **Storage** (left sidebar)
2. Click **"Create bucket"**
3. Name: `product-images` (exactly this)
4. Make it **Public** ✅
5. Click **"Create bucket"**

### Set Storage Policy

1. Click on `product-images` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Select **"For full customization"**
5. Name: `Allow service role uploads`
6. Policy definition:
   ```sql
   (bucket_id = 'product-images'::text)
   ```
7. Check **"INSERT"**, **"UPDATE"**, **"DELETE"**, **"SELECT"**
8. Click **"Review"** → **"Save policy"**

---

## ✅ Step 5: Verify Environment Variables

Double-check your Vercel environment variables:

1. Go to Vercel → **Settings** → **Environment Variables**
2. Verify:
   - `SUPABASE_URL` - Should start with `https://` and end with `.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` - Should be a long string (starts with `eyJ...`)
   - `JWT_SECRET` - Should be at least 32 characters

**Get these from Supabase:**
- Go to https://app.supabase.com → Your Project
- Go to **Settings** → **API**
- Copy **Project URL** → `SUPABASE_URL`
- Copy **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

**Important**: Use the **service_role** key, NOT the **anon** key!

---

## ✅ Step 6: Test After Redeploy

After completing all steps:

1. **Redeploy** on Vercel (even if you just added env vars)
2. Wait for deployment to complete
3. Visit your website
4. Check browser console - should see no 500 errors
5. Check Vercel function logs if still getting errors

---

## Common Issues

### Issue: "relation does not exist"
**Solution**: Run the SQL scripts in Supabase (Step 3)

### Issue: "Missing Supabase environment variables"
**Solution**: 
- Check variables are set in Vercel
- Make sure variable names are exact (case-sensitive)
- Redeploy after adding variables

### Issue: "Invalid API key"
**Solution**: 
- Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Copy the key again from Supabase Settings → API

### Issue: Still getting 500 after everything
**Solution**: 
- Check Vercel function logs (Step 2)
- The actual error message will tell you what's wrong

---

## Quick Checklist

- [ ] Environment variables added to Vercel
- [ ] **Redeployed** after adding variables
- [ ] Ran `schema.sql` in Supabase SQL Editor
- [ ] Ran `schema-updates.sql` in Supabase SQL Editor
- [ ] Verified all tables exist in Supabase Table Editor
- [ ] Created `product-images` storage bucket (public)
- [ ] Set storage policy for `product-images` bucket
- [ ] Checked Vercel function logs for actual error
- [ ] Tested website after redeploy

---

## Still Not Working?

1. **Check Vercel Function Logs** - This will show the exact error
2. **Share the error message** from the logs
3. The error message will tell us exactly what's missing


