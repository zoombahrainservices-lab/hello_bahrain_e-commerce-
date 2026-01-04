import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { generateToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

// GET /api/auth/google - Initiate Google OAuth
export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 
      `${process.env.CLIENT_URL || 'https://helloonebahrain.com'}/api/auth/google/callback`;

    if (!clientId) {
      return NextResponse.json(
        { message: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');

    // Redirect to Google
    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error: any) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { message: 'Error initiating Google OAuth', error: error.message },
      { status: 500 }
    );
  }
}


