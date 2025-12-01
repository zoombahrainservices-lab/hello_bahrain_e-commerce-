# HelloBahrain E-Commerce Application

A complete, production-ready full-stack e-commerce application built with Next.js, Express, and Supabase (PostgreSQL).

## Features

### User-Facing Features
- 🛍️ **Product Listing** - Browse products with search, filtering, and sorting
- 📦 **Product Details** - Detailed product pages with image galleries and related products
- 🛒 **Shopping Cart** - Add multiple items with quantity management
- ✅ **Checkout** - Complete order flow with shipping information
- 👤 **User Authentication** - Email/password login and Google OAuth
- 📋 **Order History** - Track all your orders and their status
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

### Admin Panel Features
- 📊 **Dashboard** - Overview of key metrics (users, orders, revenue)
- 📦 **Product Management** - Create, edit, and delete products
- 🛒 **Order Management** - View and update order statuses
- 👥 **User Management** - Manage user roles (user/admin)
- 🎨 **Banner Management** - Create and manage homepage banners

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Axios**

### Backend
- **Node.js**
- **Express**
- **TypeScript**
- **Supabase** (PostgreSQL) for database
- **JWT** for authentication
- **Passport** for Google OAuth
- **bcrypt** for password hashing

## Project Structure

```
.
├── client/               # Next.js frontend
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts (Auth, Cart)
│   │   └── lib/         # Utilities and types
│   └── package.json
│
├── server/              # Express backend
│   ├── src/
│   │   ├── config/      # Database configuration
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Express middleware
│   │   ├── index.ts     # Server entry point
│   │   └── seed.ts      # Database seeding script
│   └── package.json
│
└── package.json         # Root package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works fine)
- Google OAuth credentials (optional, for Google login)

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

cd ..
```

### 2. Configure Environment Variables

#### Server Environment Variables

Create `server/.env` file:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
CLIENT_URL=http://localhost:3000
SERVER_PORT=5000
NODE_ENV=development
```

**Get Supabase credentials:**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → API
3. Copy Project URL, anon key, and service_role key
4. See `server/SUPABASE_SETUP.md` for detailed setup instructions

#### Client Environment Variables

Create `client/.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 3. Set Up Supabase Database

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Run the SQL schema**:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents from `server/src/config/schema.sql`
   - Paste and run in SQL Editor
3. **Update `server/.env`** with your Supabase credentials (see above)

### 4. Seed the Database

Populate the database with sample products, banners, and users:

```bash
cd server
npm run seed
```

This creates:
- **Admin User**: `admin@hellobahrain.com` / `admin123`
- **Test User**: `user@example.com` / `user123`
- 8 sample products
- 2 sample banners

### 5. Run the Application

From the root directory:

```bash
# Run both client and server concurrently
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## Google OAuth Setup (Optional)

To enable Google login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `server/.env`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Products
- `GET /api/products` - Get all products (with filters, search, pagination)
- `GET /api/products/:slug` - Get product by slug

### Banners
- `GET /api/banners/active` - Get active banners

### Orders
- `POST /api/orders` - Create new order (protected)
- `GET /api/orders/my` - Get user's orders (protected)

### Admin Routes (require admin role)
- `GET /api/admin/summary` - Dashboard statistics
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - Get all orders
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/role` - Update user role
- `GET /api/admin/banners` - Get all banners
- `POST /api/admin/banners` - Create banner
- `PUT /api/admin/banners/:id` - Update banner
- `DELETE /api/admin/banners/:id` - Delete banner

## Features Checklist

### User Side ✅
- [x] Product listing with grid layout
- [x] Category filtering
- [x] Search functionality
- [x] Sorting (price, rating, newest)
- [x] Pagination
- [x] Product detail page with image gallery
- [x] Shopping cart with local storage persistence
- [x] Cart supports 5+ different items
- [x] Quantity management in cart
- [x] Checkout with shipping form
- [x] User registration and login
- [x] Google OAuth integration
- [x] Order history page
- [x] Protected routes (checkout, orders)
- [x] Responsive design
- [x] Hero banners

### Admin Panel ✅
- [x] Admin dashboard with stats
- [x] Product CRUD operations
- [x] Order management with status updates
- [x] User management with role changes
- [x] Banner management
- [x] Protected admin routes
- [x] Admin sidebar navigation

### Backend ✅
- [x] Express API with TypeScript
- [x] MongoDB with Mongoose
- [x] JWT authentication
- [x] Google OAuth with Passport
- [x] HTTP-only cookies
- [x] Password hashing with bcrypt
- [x] Role-based access control
- [x] Input validation
- [x] Error handling
- [x] CORS configuration

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in environment variables
2. Update `MONGODB_URI` to production database
3. Update `CLIENT_URL` to production frontend URL
4. Set secure `JWT_SECRET`
5. Configure Google OAuth production redirect URIs
6. Deploy to service like Heroku, Railway, or DigitalOcean

### Frontend
1. Update `NEXT_PUBLIC_API_BASE_URL` to production API URL
2. Build the application: `npm run build`
3. Deploy to Vercel, Netlify, or similar service

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ using Next.js, Express, and MongoDB

