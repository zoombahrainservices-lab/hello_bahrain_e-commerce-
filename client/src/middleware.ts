import { NextRequest, NextResponse } from 'next/server';
import { cors } from './lib/cors';

export function middleware(request: NextRequest) {
  // Only handle API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
    }

    // For other requests, we'll add CORS headers in the route handlers
    // This middleware just handles preflight
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

