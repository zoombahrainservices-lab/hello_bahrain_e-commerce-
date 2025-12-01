# Quick Setup with Your Supabase Credentials

## Step 1: Get Your Service Role Key

The key you provided (`sb_publishable_sIbxsa38qkO9RYvcMptCgw_Ft5qJ5D3`) looks like a publishable key, not a service role key.

**To get your service_role key:**
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs
2. Click **Settings** (gear icon) → **API**
3. Scroll down to find **service_role** key (it's a long JWT token starting with `eyJ...`)
4. Copy that key

## Step 2: Create server/.env File

Create a file named `.env` in the `server` folder with this content:

```env
SUPABASE_URL=https://clmhzxiuzqvebzlkbdjs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbWh6eGl1enF2ZWJ6bGtiZGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Nzg0MjIsImV4cCI6MjA4MDA1NDQyMn0.pSUjWc4Ryu7xJ94n7DFAngGYMzT6gFi8K77OUVYeb3Y
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE
JWT_SECRET=my_super_secret_jwt_key_for_development_change_this_in_production
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLIENT_URL=http://localhost:3000
SERVER_PORT=5000
NODE_ENV=development
```

**Replace `PASTE_YOUR_SERVICE_ROLE_KEY_HERE` with your actual service_role key from Step 1.**

## Step 3: Create client/.env.local File

Create a file named `.env.local` in the `client` folder with this content:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## Step 4: Set Up Database Tables

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `server/src/config/schema.sql` from your project
5. Copy ALL the contents
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

You should see "Success. No rows returned"

## Step 5: Seed the Database

Run this command:

```bash
cd server
npm run seed
```

This will create:
- Admin user: `admin@hellobahrain.com` / `admin123`
- Test user: `user@example.com` / `user123`
- 8 sample products
- 2 sample banners

## Step 6: Start the Application

From the root directory:

```bash
npm run dev
```

## Step 7: Access the App

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

**Test Login:**
- Admin: `admin@hellobahrain.com` / `admin123`
- User: `user@example.com` / `user123`

---

## Need Help?

If you get errors:
1. Make sure you copied the **service_role** key (not anon key)
2. Verify the SQL schema was run successfully
3. Check that all environment variables are set correctly




