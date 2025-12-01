# Quick Start Guide

Get the HelloBahrain e-commerce app running in 5 minutes!

## 1. Prerequisites

Make sure you have:
- Node.js 18+ installed
- MongoDB installed and running locally

## 2. Install Dependencies

```bash
# From the root directory
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

## 3. Set Up Environment Variables

### Server (.env file in server/ directory)
```bash
# Create server/.env
cat > server/.env << EOF
MONGODB_URI=mongodb://localhost:27017/hellobahrain_ecommerce
JWT_SECRET=my_super_secret_key_for_development
GOOGLE_CLIENT_ID=optional_leave_empty_for_now
GOOGLE_CLIENT_SECRET=optional_leave_empty_for_now
CLIENT_URL=http://localhost:3000
SERVER_PORT=5000
NODE_ENV=development
EOF
```

### Client (.env.local file in client/ directory)
```bash
# Create client/.env.local
cat > client/.env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
EOF
```

## 4. Seed the Database

```bash
cd server
npm run seed
cd ..
```

This creates sample data including:
- Admin user: `admin@hellobahrain.com` / `admin123`
- Regular user: `user@example.com` / `user123`
- 8 sample products
- 2 sample banners

## 5. Start the Application

From the root directory:
```bash
npm run dev
```

This starts both the server (port 5000) and client (port 3000) simultaneously.

## 6. Access the Application

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin (login as admin first)
- **API**: http://localhost:5000

## Test Accounts

### Admin Access
- Email: `admin@hellobahrain.com`
- Password: `admin123`
- Access: Full admin panel access

### Regular User
- Email: `user@example.com`
- Password: `user123`
- Access: Can browse, shop, and place orders

## What to Try

1. **Browse Products** - View the merch page with products
2. **Filter & Search** - Try category filters and search
3. **Product Details** - Click on any product
4. **Add to Cart** - Add multiple items (supports 5+ items)
5. **Checkout** - Login and complete an order
6. **View Orders** - Check your order history
7. **Admin Panel** - Login as admin and manage products/orders/users

## Common Issues

### MongoDB Connection Error
- Make sure MongoDB is running: `mongod` or check if it's running as a service
- Or use MongoDB Atlas (cloud database) - see README.md

### Port Already in Use
- Change ports in environment variables if 3000 or 5000 are taken

### Can't Login
- Make sure you ran the seed script
- Clear browser cookies/cache
- Check server logs for errors

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Customize the products, categories, and styling
- Add your own logo and branding

## Stopping the Application

Press `Ctrl+C` in the terminal to stop both servers.

---

Need help? Check the full README.md or create an issue on GitHub.

