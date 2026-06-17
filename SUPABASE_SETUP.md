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

## Step 2: Verify Setup

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

### Test Connection

After setting up Vercel environment variables, your API routes should be able to:
- ✅ Read/write to database
- ✅ Upload images to Cloudflare R2 storage

---

## Quick Checklist

- [ ] Run `schema.sql` in SQL Editor
- [ ] Run `schema-updates.sql` in SQL Editor
- [ ] Verify all tables exist
- [ ] Set environment variables in Vercel (see `VERCEL_DEPLOYMENT.md`)

---

## Troubleshooting

### "Table does not exist" errors
- Make sure you ran both SQL files
- Check the SQL Editor for any errors
- Verify tables in Table Editor

### Images not displaying
- Check image URLs are correct Cloudflare R2 public URLs (`https://media.helloonebahrain.com/...`)
- Verify R2 bucket `helloonebahrain` is publicly accessible

---

## Need Help?

If you get errors:
1. Check Supabase SQL Editor for error messages
2. Check Vercel function logs for API errors
3. Verify all environment variables are set correctly

