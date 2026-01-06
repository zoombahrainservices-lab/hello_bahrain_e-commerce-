# Cart and Orders Sync Verification Guide

## Overview

This document explains how cart and orders are now synced across localhost and production.

## How It Works

### Cart Synchronization

**Storage Strategy:**
- **localStorage**: Immediate storage for fast UI updates (browser-specific)
- **Database (user_carts table)**: Persistent storage synced across all devices/environments

**Sync Flow:**
1. **On App Load/Login**: Load cart from database → Merge with localStorage → Display
2. **On Cart Change**: Update localStorage immediately → Debounce (500ms) → Save to database
3. **On Logout**: Clear both localStorage and database cart

**Benefits:**
- Same cart visible in localhost and production (if logged in)
- Cart persists across devices and browsers
- Works offline (uses localStorage)
- Performance optimized (debounced sync)

### Orders Synchronization

**How Orders Work:**
- Orders are stored in the `orders` table in Supabase
- Each order is linked to a user via `user_id`
- The `/api/orders/my` endpoint filters orders by the authenticated user's ID
- Orders are **already synced** if using the same Supabase database

**Why They're Synced:**
- Both localhost and production connect to the same Supabase database
- Orders are queried by `user_id`, so the same user sees the same orders everywhere
- No browser-specific storage (unlike old cart implementation)

## Verification Steps

### 1. Verify Same Database

Check that both environments use the same Supabase URL:

**Localhost:**
```bash
# In client/.env.local
SUPABASE_URL=https://your-project-id.supabase.co
```

**Production (Vercel):**
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Check `SUPABASE_URL` matches localhost

### 2. Test Cart Sync

**Test Scenario:**
1. Login on localhost
2. Add item to cart
3. Open production site in **same browser** (or different browser)
4. Login with same account
5. **Expected**: Cart shows same item

**Important:**
- Cart sync only works for **logged-in users**
- Guest/anonymous carts remain browser-local
- May take up to 500ms for sync (debounce delay)

### 3. Test Orders Sync

**Test Scenario:**
1. Login on localhost
2. Place an order (any payment method)
3. Go to "My Orders" page
4. Note the order ID
5. Open production site
6. Login with same account
7. Go to "My Orders" page
8. **Expected**: Same order appears with same order ID

### 4. Check Logs

**Localhost Logs:**
Open browser console and check for:
```
[Cart] Loading cart from database for user: <user-id>
[Cart] Loaded X items from database
[Cart] Syncing X items to database
[Cart] Sync successful

[Orders API] Fetching orders for user: <user-id>
[Orders API] Using Supabase URL: https://...
[Orders API] Found X orders for user
```

**Production Logs:**
Check Vercel Function Logs:
1. Go to Vercel Dashboard → Your Project
2. Deployments → Latest Deployment → Functions
3. Look for `/api/cart` and `/api/orders/my` logs

## Database Setup

### Run Migration

Before cart sync works, you **must** create the `user_carts` table:

1. Open Supabase Dashboard (https://app.supabase.com)
2. Select your project
3. Go to SQL Editor
4. Create new query
5. Paste contents from `ADD_USER_CARTS_TABLE.sql`
6. Run the query

### Verify Table Created

In Supabase:
1. Go to Table Editor
2. Check that `user_carts` table exists
3. Columns should include:
   - `id` (uuid)
   - `user_id` (uuid, foreign key to users)
   - `items` (jsonb)
   - `updated_at`, `created_at` (timestamps)

## Troubleshooting

### Cart Not Syncing

**Symptoms:**
- Different cart in localhost vs production
- Cart disappears after login

**Solutions:**
1. Verify `user_carts` table exists in database
2. Check browser console for cart sync errors
3. Ensure user is logged in (anonymous carts don't sync)
4. Clear localStorage and reload: `localStorage.clear()`

### Orders Not Syncing

**Symptoms:**
- Different orders in localhost vs production

**Solutions:**
1. Verify both environments use **same SUPABASE_URL**
2. Check if user is properly authenticated (same user ID)
3. Verify orders have correct `user_id` in database:
   ```sql
   SELECT id, user_id, status, created_at 
   FROM orders 
   WHERE user_id = '<your-user-id>' 
   ORDER BY created_at DESC;
   ```

### Different User IDs

**Symptoms:**
- User logs in but has different ID in localhost vs production

**Possible Causes:**
- Using different Supabase projects (not same database)
- User registered separately in each environment

**Solution:**
- Ensure `SUPABASE_URL` is identical
- Or register/login as same user in both environments

## API Endpoints

### Cart API

**GET /api/cart**
- Returns user's cart from database
- Requires authentication
- Response: `{ items: CartItem[], updatedAt: string }`

**POST /api/cart**
- Saves user's cart to database
- Requires authentication
- Body: `{ items: CartItem[] }`
- Response: `{ success: true, updatedAt: string }`

**DELETE /api/cart**
- Clears user's cart in database
- Requires authentication
- Response: `{ success: true }`

### Orders API

**GET /api/orders/my**
- Returns user's orders from database
- Requires authentication
- Filters by authenticated user's ID
- Response: `Order[]`

## Technical Details

### Cart Debouncing

Cart changes are debounced to prevent excessive API calls:
- After each cart modification, a 500ms timer starts
- If another modification happens, timer resets
- When timer completes, cart syncs to database
- This means rapid cart changes trigger only one sync

### Conflict Resolution

When cart exists in both localStorage and database:
1. Database cart is loaded
2. Database cart **takes precedence**
3. localStorage is updated to match database
4. User sees database cart

### Performance

- **localStorage**: Instant read/write (synchronous)
- **Database sync**: Background operation (async, non-blocking)
- **Cart load**: Database query on login (~50-200ms)
- **Orders load**: Database query on page load (~100-300ms)

## Success Criteria

✅ Cart syncs across localhost and production
✅ Orders appear identical in both environments  
✅ Cart persists across browser sessions (for logged-in users)
✅ Cart works offline (uses localStorage cache)
✅ No performance degradation
✅ Background sync doesn't block UI


