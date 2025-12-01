import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import bannerRoutes from './routes/banners';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import profileRoutes from './routes/profile';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.SERVER_PORT || 5000;

// Middleware
// CORS: allow browser calls from frontend (Vercel, local, etc.)
app.use(
  cors({
    origin: true, // reflect request origin
    credentials: true,
  })
);

// Extra CORS headers to be absolutely sure browsers see them
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
// Increase body size limit to 50MB for image uploads (base64 encoding increases size by ~33%)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to Supabase
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

