# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: HelloBahrain E-Commerce
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
5. Wait for project to be created (2-3 minutes)

## 2. Get Your Supabase Credentials

1. Go to your project dashboard
2. Click on **Settings** (gear icon) → **API**
3. Copy the following:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY) - Keep this secret!

## 3. Create Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the contents of `server/src/config/schema.sql`
4. Click **Run** to execute the SQL
5. Verify tables are created by going to **Table Editor**

## 4. Configure Environment Variables

Update `server/.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:3000
SERVER_PORT=5000
NODE_ENV=development
```

## 5. Seed the Database

After setting up the tables and environment variables:

```bash
cd server
npm run seed
```

This will create:
- Admin user: `admin@hellobahrain.com` / `admin123`
- Test user: `user@example.com` / `user123`
- 8 sample products
- 2 sample banners

## 6. Row Level Security (RLS)

By default, Supabase enables RLS. For this application, we're using the service role key which bypasses RLS. For production, you should:

1. Go to **Authentication** → **Policies**
2. Set up appropriate RLS policies for each table
3. Or disable RLS for tables that need public access (not recommended for production)

## Security Notes

- **Never commit** your `.env` file
- **Never expose** your service_role key to the frontend
- Use **anon key** for client-side operations (if needed)
- Use **service_role key** only on the server
- Enable RLS policies for production

## Troubleshooting

### "relation does not exist"
- Make sure you've run the SQL schema in the SQL Editor
- Check that all tables are created in Table Editor

### "Invalid API key"
- Verify your SUPABASE_URL and keys are correct
- Make sure there are no extra spaces in your .env file

### Connection timeout
- Check your internet connection
- Verify your Supabase project is active
- Check Supabase status page




