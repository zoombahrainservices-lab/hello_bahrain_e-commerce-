import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { generateToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

// GET /api/auth/google/callback - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.CLIENT_URL || 'https://helloonebahrain.com'}/auth/login?error=google_auth_failed`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.CLIENT_URL || 'https://helloonebahrain.com'}/auth/login?error=no_code`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 
      `${process.env.CLIENT_URL || 'https://helloonebahrain.com'}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.CLIENT_URL || 'https://helloonebahrain.com'}/auth/login?error=not_configured`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.CLIENT_URL || 'https://helloonebahrain.com'}/auth/login?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info from Google');
      return NextResponse.redirect(
        `${process.env.CLIENT_URL || 'https://helloonebahrain.com'}/auth/login?error=user_info_failed`
      );
    }

    const googleUser = await userInfoResponse.json();
    const email = googleUser.email?.toLowerCase();

    if (!email) {
      return NextResponse.redirect(
        `${process.env.CLIENT_URL || 'https://helloonebahrain.com'}/auth/login?error=no_email`
      );
    }

    // Find or create user
    let user = await supabaseHelpers.findUserByEmail(email);

    if (!user) {
      // Create new user
      user = await supabaseHelpers.createUser({
        name: googleUser.name || 'Google User',
        email: email,
        google_id: googleUser.id,
        password_hash: null,
        role: 'user',
      });
    } else if (!user.google_id) {
      // Link Google account to existing user
      await supabaseHelpers.updateUser(user.id, { google_id: googleUser.id });
      user = { ...user, google_id: googleUser.id };
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    // Create redirect URL with token
    const redirectUrl = new URL(
      `${process.env.CLIENT_URL || 'https://helloonebahrain.com'}/auth/google/success`
    );
    redirectUrl.searchParams.set('token', token);

    // Set cookie
    const response = NextResponse.redirect(redirectUrl.toString());
    response.cookies.set('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.CLIENT_URL || 'https://helloonebahrain.com'}/auth/login?error=callback_error`
    );
  }
}


