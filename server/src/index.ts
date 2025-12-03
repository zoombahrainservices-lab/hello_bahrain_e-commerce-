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
// Prefer the platform-provided PORT (e.g. Render) and fall back to SERVER_PORT/local 5000
const PORT = Number(process.env.PORT) || Number(process.env.SERVER_PORT) || 5000;

// Middleware
// CORS: for this project, allow all browser origins (includes all Vercel previews and production)
app.use(
  cors({
    origin: true, // Reflect the request Origin header
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
  })
);
// Increase body size limit to 50MB for image uploads (base64 encoding increases size by ~33%)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(passport.initialize());

// Health check (works even if DB connection fails)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin || 'no origin',
    timestamp: new Date().toISOString()
  });
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
    console.log('🔌 Attempting to connect to Supabase...');
    console.log(`📋 SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`📋 SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`📋 SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
    
    // Connect to Supabase
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`🔒 CORS enabled for: localhost:3000, *.vercel.app, and hello-bahrain-e-commerce.onrender.com`);
    });
  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    console.error('💡 Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are set in your environment variables');
    process.exit(1);
  }
};

startServer();

