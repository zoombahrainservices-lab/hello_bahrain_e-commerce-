# Fix: "TypeError: fetch failed" - Invalid Supabase URL

## 🔴 Problem

The health check shows:
- `"supabaseUrl":"https://your-project..."` ← This is a **placeholder**, not a real URL!
- `"error":"TypeError: fetch failed"` ← Cannot connect because URL is invalid

## ✅ Solution: Set Correct Supabase URL

### Step 1: Get Your Real Supabase URL

1. Go to **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API** (left sidebar)
4. Find **"Project URL"**
5. It should look like: `https://xxxxxxxxxxxxx.supabase.co`
6. **Copy this entire URL**

### Step 2: Update in Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Go to **Settings** → **Environment Variables**
3. Find `SUPABASE_URL`
4. Click the **three dots** (⋮) → **Edit**
5. **Replace** the placeholder with your real Supabase URL:
   - ❌ Wrong: `https://your-project-id.supabase.co` (placeholder)
   - ✅ Correct: `https://xxxxxxxxxxxxx.supabase.co` (your actual URL)
6. Click **Save**

### Step 3: Verify SUPABASE_SERVICE_ROLE_KEY

While you're there, also verify:

1. In Supabase: **Settings** → **API**
2. Find **"service_role"** key (the **secret** one, not anon)
3. Copy it
4. In Vercel: Check `SUPABASE_SERVICE_ROLE_KEY`
5. Make sure it matches (should start with `eyJ...`)

### Step 4: Redeploy

**CRITICAL**: After changing environment variables, you **MUST redeploy**:

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 5: Test Again

1. Visit: `https://helloonebahrain.com/api/health`
2. Should now show:
   - ✅ `"supabaseUrlValid": true`
   - ✅ `"connected": true` (if tables exist)
   - ✅ List of tables

---

## Common Mistakes

### ❌ Wrong: Using Placeholder URL
```
SUPABASE_URL=https://your-project-id.supabase.co
```

### ✅ Correct: Using Real URL
```
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

### ❌ Wrong: Using Anon Key
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon key)
```

### ✅ Correct: Using Service Role Key
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
```

---

## Quick Checklist

- [ ] Got real Supabase URL from Supabase Dashboard
- [ ] Updated `SUPABASE_URL` in Vercel (not placeholder)
- [ ] Verified `SUPABASE_SERVICE_ROLE_KEY` is service_role key (not anon)
- [ ] **Redeployed** on Vercel after changes
- [ ] Tested `/api/health` endpoint
- [ ] Should show `"connected": true` if database is set up

---

## After Fixing URL

Once the URL is correct, you may still need to:

1. **Set up database tables** in your production Supabase:
   - Go to Supabase → SQL Editor
   - Run `schema.sql`
   - Run `schema-updates.sql`

But first, **fix the URL** - that's the immediate problem!


