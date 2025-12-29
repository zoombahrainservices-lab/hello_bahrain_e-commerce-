# Supabase Setup Guide

## ✅ Yes, you need to set up your Supabase database!

Your application needs:
1. **Database tables** (run SQL scripts)
2. **Storage buckets** (for product images)

---

## Step 1: Run Database Schema

### Go to Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New query"**

### Run Main Schema

1. Open `server/src/config/schema.sql` in your project
2. **Copy ALL contents** from that file
3. Paste into Supabase SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter`)

This creates:
- ✅ `users` table
- ✅ `products` table
- ✅ `banners` table
- ✅ `orders` table
- ✅ `order_items` table
- ✅ All indexes and triggers

### Run Schema Updates

1. Open `server/src/config/schema-updates.sql` in your project
2. **Copy ALL contents** from that file
3. Paste into Supabase SQL Editor
4. Click **"Run"**

This adds:
- ✅ `categories` table
- ✅ `contact_messages` table
- ✅ `user_addresses` table
- ✅ Phone column to users
- ✅ Seed categories (T-Shirts, Hoodies, Bags, etc.)

---

## Step 2: Set Up Storage Buckets

### Create Storage Buckets

1. Go to **Storage** (left sidebar in Supabase)
2. Click **"Create bucket"**

#### Create `product-images` bucket

- **Name**: `product-images` (exactly this name)
- **Public**: ✅ **Yes** (check this box - important!)
- **File size limit**: 10 MB (or as needed)
- **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`

**Note**: This single bucket stores all images (products, banners, order-items) in different folders.

### Set Storage Policies (Important!)

After creating the bucket, you need to set policies so your API can upload files.

#### For `product-images` bucket:

1. Click on the `product-images` bucket
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

**Note**: Since you're using `SUPABASE_SERVICE_ROLE_KEY` in your API routes, this policy allows the service role to manage files. The bucket is public so images can be displayed on your website.

---

## Step 3: Verify Setup

### Check Tables

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - ✅ `users`
   - ✅ `products`
   - ✅ `banners`
   - ✅ `orders`
   - ✅ `order_items`
   - ✅ `categories`
   - ✅ `contact_messages`
   - ✅ `user_addresses`

### Check Storage

1. Go to **Storage** (left sidebar)
2. You should see:
   - ✅ `product-images` bucket

### Test Connection

After setting up Vercel environment variables, your API routes should be able to:
- ✅ Read/write to database
- ✅ Upload images to storage

---

## Quick Checklist

- [ ] Run `schema.sql` in SQL Editor
- [ ] Run `schema-updates.sql` in SQL Editor
- [ ] Create `product-images` storage bucket (public)
- [ ] Set storage policy for `product-images` bucket
- [ ] Verify all tables exist
- [ ] Set environment variables in Vercel (see `VERCEL_DEPLOYMENT.md`)

---

## Troubleshooting

### "Table does not exist" errors
- Make sure you ran both SQL files
- Check the SQL Editor for any errors
- Verify tables in Table Editor

### "Bucket not found" errors
- Make sure bucket is named exactly: `product-images` (with hyphen)
- Check bucket name is lowercase

### "Permission denied" on image uploads
- Make sure storage policies are set
- Verify you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Check bucket is set to **Public**

### Images not displaying
- Make sure buckets are **Public**
- Check image URLs are correct
- Verify storage policies allow **SELECT**

---

## Need Help?

If you get errors:
1. Check Supabase SQL Editor for error messages
2. Check Vercel function logs for API errors
3. Verify all environment variables are set correctly

