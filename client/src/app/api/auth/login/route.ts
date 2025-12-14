import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { generateToken } from '@/lib/jwt';
import { getCorsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Handle OPTIONS (preflight)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

// POST /api/auth/login
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  try {
    const body = await request.json();
    const { identifier, password } = body; // identifier can be email or phone

    // Validation
    if (!identifier || !password) {
      return NextResponse.json(
        { message: 'Email/phone and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Special admin shortcut
    if (identifier.toLowerCase() === 'admin@hellobahrain.com' && password === 'Admin@1234') {
      const adminEmail = 'admin@hellobahrain.com';
      let adminUser = await supabaseHelpers.findUserByEmail(adminEmail);

      if (!adminUser) {
        const passwordHash = await bcrypt.hash('Admin@1234', 10);
        adminUser = await supabaseHelpers.createUser({
          name: 'Admin User',
          email: adminEmail.toLowerCase(),
          password_hash: passwordHash,
          role: 'admin',
        });
      }

      const token = generateToken(adminUser.id, adminUser.role);
      const response = NextResponse.json({
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
        token,
      });

      response.cookies.set('token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // Determine if identifier is an email or phone
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    // Find user by email or phone
    const user = isEmail
      ? await supabaseHelpers.findUserByEmail(identifier)
      : await supabaseHelpers.findUserByPhone(String(identifier).trim());

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user has a password
    if (!user.password_hash) {
      return NextResponse.json(
        { message: 'Please login with Google' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

    response.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error during login' },
      { status: 500, headers: corsHeaders }
    );
  }
}



