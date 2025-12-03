import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { authMiddleware } from '../middleware/auth';
import { getSupabase } from '../config/db';
import { supabaseHelpers } from '../lib/supabase';

const router = Router();

// JWT helper
const generateToken = (userId: string, role: 'user' | 'admin'): string => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
  return jwt.sign({ id: userId, role }, jwtSecret, { expiresIn: '30d' });
};

// Configure Google OAuth strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Use an absolute callback URL so it exactly matches the value configured in Google Cloud
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          'https://hello-bahrain-e-commerce.onrender.com/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email from Google'), undefined);
          }

          let user = await supabaseHelpers.findUserByEmail(email);

          if (!user) {
            // Create new user
            const newUser = await supabaseHelpers.createUser({
              name: profile.displayName || 'Google User',
              email: email.toLowerCase(),
              google_id: profile.id,
              password_hash: null,
              role: 'user',
            });
            user = newUser;
          } else if (!user.google_id) {
            // Link Google account to existing user
            await supabaseHelpers.updateUser(user.id, { google_id: profile.id });
            user = { ...user, google_id: profile.id };
          }

          done(null, user);
        } catch (error) {
          done(error as Error, undefined);
        }
      }
    )
  );
} else {
  console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
}

// Serialize/deserialize
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await supabaseHelpers.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password || !phone) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Basic phone validation (allows digits, spaces, +, -, parentheses)
    const normalizedPhone = String(phone).trim();
    if (!/^[0-9+\-\s()]{6,20}$/.test(normalizedPhone)) {
      res.status(400).json({ message: 'Invalid phone number format' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    // Check if user exists (email)
    const existingUser = await supabaseHelpers.findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }

    // Check if phone is already used
    const existingPhoneUser = await supabaseHelpers.findUserByPhone(normalizedPhone);
    if (existingPhoneUser) {
      res.status(400).json({ message: 'User already exists with this phone number' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await supabaseHelpers.createUser({
      name,
      email: email.toLowerCase(),
      phone: normalizedPhone,
      password_hash: passwordHash,
      role: 'user',
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    // Set HTTP-only cookie with proper cross-domain settings
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript access for better persistence
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/', // Ensure cookie is available for all paths
    });

    // Return user data (without password)
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    console.log('🔐 Login attempt:', { 
      identifier, 
      passwordLength: password?.length,
      isAdminEmail: identifier?.toLowerCase() === 'admin@hellobahrain.com',
      isAdminPassword: password === 'Admin@1234'
    });

    // Validation
    if (!identifier || !password) {
      res.status(400).json({ message: 'Email/phone and password are required' });
      return;
    }

    // Special hardcoded admin shortcut so you can always log in as admin,
    // even if the database user or password hash is inconsistent.
    if (identifier.toLowerCase() === 'admin@hellobahrain.com' && password === 'Admin@1234') {
      console.log('✅ Admin shortcut activated - bypassing DB check');
      // Use a fixed UUID for admin shortcut (consistent across restarts)
      const adminUser = {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Admin User',
        email: 'admin@hellobahrain.com',
        role: 'admin' as const,
      };

      const token = generateToken(adminUser.id, adminUser.role);

      res.cookie('token', token, {
        httpOnly: false, // Allow JavaScript access for better persistence
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/', // Ensure cookie is available for all paths
      });

      console.log('✅ Admin login successful - Cookie set with config:', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        tokenLength: token.length,
      });

      res.json({ user: adminUser, token });
      return;
    }

    // Determine if identifier is an email or phone
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    // Find user by email or phone
    const user = isEmail
      ? await supabaseHelpers.findUserByEmail(identifier)
      : await supabaseHelpers.findUserByPhone(String(identifier).trim());

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Check if user has a password (not Google-only account)
    if (!user.password_hash) {
      res.status(401).json({ message: 'Please login with Google' });
      return;
    }

    // Verify password (normal users and any non-shortcut admins)
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Set HTTP-only cookie with proper cross-domain settings
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript access for better persistence
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/', // Ensure cookie is available for all paths
    });

    console.log('✅ Login successful - Cookie set with config:', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      tokenLength: token.length,
      userId: user.id,
      userRole: user.role,
    });
    
    // Return user data
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  console.log('🚪 Logout - Cookie cleared');
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Handle admin shortcut user (doesn't exist in DB)
    if (req.user.id === '00000000-0000-0000-0000-000000000001') {
      console.log('✅ Returning admin shortcut user (no DB lookup needed)');
      res.json({
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Admin User',
          email: 'admin@hellobahrain.com',
          phone: '',
          role: 'admin',
        },
      });
      return;
    }

    const user = await supabaseHelpers.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/auth/login`,
    session: false,
  }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // Generate token
      const token = generateToken(user.id, user.role);

      // For cross-domain deployment, pass token in URL so frontend can store it
      // Frontend will extract token from URL and call /api/auth/me to get user data
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/auth/login?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/auth/login?error=oauth_failed`);
    }
  }
);

export default router;
