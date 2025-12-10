import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { generateToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone } = body;

    // Validation
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Basic phone validation
    const normalizedPhone = String(phone).trim();
    if (!/^[0-9+\-\s()]{6,20}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { message: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await supabaseHelpers.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Check if phone is already used
    const existingPhoneUser = await supabaseHelpers.findUserByPhone(normalizedPhone);
    if (existingPhoneUser) {
      return NextResponse.json(
        { message: 'User already exists with this phone number' },
        { status: 400 }
      );
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

    // Create response with cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    }, { status: 201 });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Server error during registration' },
      { status: 500 }
    );
  }
}


