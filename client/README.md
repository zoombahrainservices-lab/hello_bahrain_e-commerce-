# HelloOneBahrain E-Commerce - Serverless Next.js

This is a serverless Next.js application with API routes. All backend functionality is now integrated into Next.js API routes.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the `client/` directory with the following variables:

```env
# Supabase Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR use ANON_KEY if SERVICE_ROLE_KEY is not available
# SUPABASE_ANON_KEY=your_anon_key

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here

# EazyPay Payment Gateway (Optional - only if using online payments)
EAZYPAY_MERCHANT_ID=your_merchant_id
EAZYPAY_API_PASSWORD=your_api_password
EAZYPAY_API_BASE_URL=https://your_eazypay_api_url
EAZYPAY_RETURN_URL=https://your_domain.com/payment/eazypay/return
EAZYPAY_CANCEL_URL=https://your_domain.com/payment/eazypay/cancel

# Google OAuth (Optional - only if using Google login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your_domain.com/api/auth/google/callback

# Client URL (for OAuth redirects)
CLIENT_URL=http://localhost:3000
```

**Important Notes:**
- Replace all placeholder values with your actual credentials
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- For production, set these in your hosting platform's environment variables

### 3. Run Development Server

```bash
npm run dev
```

The application will start at **http://localhost:3000**

### 4. Test the Application

1. **Homepage**: Visit http://localhost:3000
   - Should show products (hardcoded during cold start, then real data)

2. **API Routes**: Test API endpoints directly:
   - Products: http://localhost:3000/api/products
   - Categories: http://localhost:3000/api/categories
   - Auth: http://localhost:3000/api/auth/me (requires authentication)

3. **Admin Login**:
   - Email: `admin@hellobahrain.com`
   - Password: `Admin@1234`

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server (port 3000)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## 🏗️ Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── api/              # Serverless API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── products/     # Product endpoints
│   │   │   ├── orders/       # Order endpoints
│   │   │   └── ...
│   │   ├── admin/            # Admin pages
│   │   ├── auth/             # Auth pages (login/register)
│   │   └── ...               # Other pages
│   ├── lib/
│   │   ├── db.ts             # Supabase connection
│   │   ├── auth-middleware.ts # Auth middleware
│   │   └── ...               # Utilities
│   └── components/           # React components
├── .env.local                # Environment variables (create this)
└── package.json
```

## 🔧 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY`) are set in `.env.local`

### Issue: "Cannot connect to database"
**Solution**: 
1. Verify your Supabase credentials are correct
2. Check if your Supabase project is active
3. Ensure database tables are created (run SQL schema if needed)

### Issue: "JWT verification failed"
**Solution**: Make sure `JWT_SECRET` is set in `.env.local` and matches what was used to create tokens

### Issue: API routes return 404
**Solution**: 
1. Make sure you're running `npm run dev` from the `client/` directory
2. Check that API route files exist in `src/app/api/`
3. Restart the dev server

### Issue: CORS errors
**Solution**: This shouldn't happen with serverless routes, but if it does:
- Make sure you're accessing the API from the same origin (localhost:3000)
- Check that `NEXT_PUBLIC_API_BASE_URL` is not set (should be empty for relative paths)

## 📦 Building for Production

### 1. Build the Application

```bash
npm run build
```

### 2. Start Production Server

```bash
npm run start
```

### 3. Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

**Vercel automatically:**
- Detects Next.js projects
- Runs `npm run build`
- Deploys serverless functions
- Handles API routes automatically

## 🔐 Environment Variables for Production

When deploying, set these in your hosting platform:

**Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY`)
- `JWT_SECRET`

**Optional:**
- `EAZYPAY_*` (for payments)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (for OAuth)
- `CLIENT_URL` (your production domain)

## 📚 API Routes

All API routes are serverless functions in `src/app/api/`:

- `/api/products` - Product listing
- `/api/products/[slug]` - Single product
- `/api/categories` - Categories list
- `/api/banners/active` - Active banners
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/logout` - User logout
- `/api/auth/me` - Get current user
- `/api/orders` - Create order
- `/api/orders/my` - User's orders
- `/api/profile` - User profile
- `/api/contact` - Contact form
- `/api/eazypay/session` - Payment session
- `/api/eazypay/status` - Payment status

## 🆘 Need Help?

- Check `MIGRATION_GUIDE.md` for migration details
- Review API route files in `src/app/api/` for examples
- Check browser console for API errors
- Check terminal for server errors

## ✅ Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Create `.env.local` with your credentials
3. ✅ Run `npm run dev`
4. ⚠️ Convert remaining admin routes (see `MIGRATION_GUIDE.md`)
5. ⚠️ Test all functionality
6. ⚠️ Deploy to production


