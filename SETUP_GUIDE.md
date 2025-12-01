# Step-by-Step Setup Guide

Follow these steps to get your HelloBahrain e-commerce application running.

## Prerequisites

Before you begin, make sure you have:
- ✅ Node.js 18 or higher installed ([Download here](https://nodejs.org/))
- ✅ A Supabase account (free tier works fine)
- ✅ Git (if cloning from repository)

## Step 1: Install Dependencies

Open your terminal in the project root directory and run:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Go back to root
cd ..
```

**Expected output:** All packages should install without errors.

---

## Step 2: Create Supabase Project

1. **Go to Supabase**
   - Visit [https://supabase.com](https://supabase.com)
   - Sign up or log in to your account

2. **Create New Project**
   - Click **"New Project"** button
   - Fill in the details:
     - **Name**: `HelloBahrain E-Commerce` (or any name you prefer)
     - **Database Password**: Create a strong password (save it securely!)
     - **Region**: Choose the region closest to you
   - Click **"Create new project"**
   - Wait 2-3 minutes for the project to be created

3. **Get Your Credentials**
   - Once the project is ready, go to **Settings** (gear icon) → **API**
   - You'll see three important values:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **anon public** key (long string starting with `eyJ...`)
     - **service_role** key (long string starting with `eyJ...`) - **Keep this secret!**

---

## Step 3: Set Up Database Tables

1. **Open SQL Editor**
   - In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
   - Click **"New Query"**

2. **Run the Schema**
   - Open the file `server/src/config/schema.sql` in your project
   - Copy **ALL** the contents of that file
   - Paste it into the SQL Editor in Supabase
   - Click **"Run"** (or press Ctrl+Enter)
   - You should see "Success. No rows returned"

3. **Verify Tables Created**
   - Click **"Table Editor"** in the left sidebar
   - You should see these tables:
     - `users`
     - `products`
     - `banners`
     - `orders`
     - `order_items`

---

## Step 4: Configure Environment Variables

### Server Environment Variables

1. **Open or create** `server/.env` file

2. **Add the following content** (replace with your actual Supabase credentials):

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
JWT_SECRET=my_super_secret_jwt_key_for_development_change_this_in_production
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLIENT_URL=http://localhost:3000
SERVER_PORT=5000
NODE_ENV=development
```

**Important:**
- Replace `your-project-id` with your actual Supabase project ID
- Replace `your_service_role_key_here` with your actual service_role key
- Replace `your_anon_key_here` with your actual anon key
- The `JWT_SECRET` can be any random string for development (use a strong one in production)

### Client Environment Variables

1. **Open or create** `client/.env.local` file

2. **Add the following content**:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

---

## Step 5: Seed the Database

This will populate your database with sample data (users, products, banners).

```bash
# Make sure you're in the server directory
cd server

# Run the seed script
npm run seed
```

**Expected output:**
```
🌱 Starting seed process...
🗑️  Clearing existing data...
👤 Creating admin user...
✅ Admin user created: admin@hellobahrain.com
👤 Creating test user...
✅ Test user created: user@example.com
📦 Creating products...
✅ Created 8 products
🎨 Creating banners...
✅ Created 2 banners

🎉 Seed completed successfully!

📋 Login credentials:
Admin: admin@hellobahrain.com / admin123
User: user@example.com / user123
```

**If you see errors:**
- Make sure your Supabase credentials in `.env` are correct
- Verify that you ran the SQL schema in Step 3
- Check that your Supabase project is active

---

## Step 6: Start the Application

From the **root directory** of the project, run:

```bash
npm run dev
```

This will start both the server and client simultaneously.

**Expected output:**
```
[0] 🚀 Server is running on port 5000
[0] 📍 Health check: http://localhost:5000/health
[0] 🌍 Client URL: http://localhost:3000
[0] ✅ Supabase Connected Successfully
[1] ▲ Next.js 14.0.4
[1] - Local:        http://localhost:3000
[1] ✓ Ready in 2.3s
```

---

## Step 7: Access the Application

Open your web browser and visit:

- **Frontend (Main App)**: http://localhost:3000
- **Backend API Health Check**: http://localhost:5000/health
- **Admin Panel**: http://localhost:3000/admin (login required)

---

## Step 8: Test the Application

### Test User Login

1. Go to http://localhost:3000
2. Click **"Login"** in the header
3. Try logging in with:
   - **Admin**: `admin@hellobahrain.com` / `admin123`
   - **User**: `user@example.com` / `user123`

### Browse Products

- You should see 8 sample products on the homepage
- Try filtering by category
- Search for products
- Click on a product to see details

### Test Shopping Cart

1. Add products to cart
2. Go to `/cart` to view your cart
3. Proceed to checkout (requires login)

### Access Admin Panel

1. Login as admin (`admin@hellobahrain.com` / `admin123`)
2. Click on your profile → **"Admin Panel"**
3. You should see the dashboard with statistics

---

## Troubleshooting

### "Supabase connection failed"
- ✅ Check your `SUPABASE_URL` and keys in `server/.env`
- ✅ Make sure there are no extra spaces in the .env file
- ✅ Verify your Supabase project is active

### "relation does not exist"
- ✅ Make sure you ran the SQL schema in Step 3
- ✅ Check that all tables exist in Supabase Table Editor

### "Port already in use"
- ✅ Change `SERVER_PORT` in `server/.env` to a different port (e.g., 5001)
- ✅ Update `NEXT_PUBLIC_API_BASE_URL` in `client/.env.local` to match

### "Cannot find module"
- ✅ Make sure you ran `npm install` in root, server, and client directories
- ✅ Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Server won't start
- ✅ Check that all environment variables are set correctly
- ✅ Look at the error message in the terminal for specific issues

### Client won't start
- ✅ Make sure the server is running first
- ✅ Check that `NEXT_PUBLIC_API_BASE_URL` is correct

---

## Stopping the Application

To stop the application:
- Press `Ctrl + C` in the terminal where it's running
- Both server and client will stop

---

## Next Steps

Once everything is running:

1. **Customize Products**: Add your own products via the admin panel
2. **Update Branding**: Change logo, colors, and text
3. **Configure Google OAuth**: Add Google login (optional)
4. **Deploy**: See `DEPLOYMENT.md` for production deployment

---

## Quick Reference

### Test Accounts
- **Admin**: `admin@hellobahrain.com` / `admin123`
- **User**: `user@example.com` / `user123`

### Important URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Panel: http://localhost:3000/admin

### Key Commands
```bash
# Install all dependencies
npm install && cd server && npm install && cd ../client && npm install

# Seed database
cd server && npm run seed

# Start application
npm run dev

# Start only server
npm run dev:server

# Start only client
npm run dev:client
```

---

## Need Help?

- Check `server/SUPABASE_SETUP.md` for detailed Supabase setup
- Check `README.md` for general project information
- Check `DEPLOYMENT.md` for production deployment

Happy coding! 🚀




