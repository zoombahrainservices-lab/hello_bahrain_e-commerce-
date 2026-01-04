# Setup Instructions

## The Problem
You're getting 500 errors because the `.env.local` file is missing Supabase credentials.

## Quick Fix

### Step 1: Create/Update `.env.local` file

Create or update `client/.env.local` with these **REQUIRED** variables:

```env
# REQUIRED - Supabase Database
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# REQUIRED - JWT Secret
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters

# Optional - Remove this line (not needed for serverless)
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Step 2: Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Generate JWT Secret

Generate a random secret (at least 32 characters):
```bash
# On Windows PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Or use an online generator: https://randomkeygen.com/
```

### Step 4: Restart the Dev Server

After updating `.env.local`:
1. Stop the server (Ctrl+C)
2. Run `npm run dev` again

## How to Run

### Development
```bash
cd client
npm install          # Install dependencies (if not done)
npm run dev          # Start server on http://localhost:3000
```

### Important Notes

1. **No Express Server Needed**: The serverless API routes run automatically with Next.js
2. **Environment Variables**: Must be in `client/.env.local` (not root directory)
3. **Restart Required**: After changing `.env.local`, restart the dev server

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Check that `.env.local` exists in `client/` directory
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Restart the dev server after updating

### Error: 500 Internal Server Error
- Check the terminal/console for the actual error message
- Verify your Supabase credentials are correct
- Make sure your Supabase project is active

### Products/Banners Not Showing
- Check browser console for errors
- Check terminal for server-side errors
- Verify database tables exist in Supabase


