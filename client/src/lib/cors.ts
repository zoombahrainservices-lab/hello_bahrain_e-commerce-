import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS configuration for API routes
 * Allows mobile apps and other origins to access the API
 */

// Get allowed origins from environment variable or use defaults
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  
  // Default origins - includes mobile app origins and website origins
  return [
    // Website origins
    'http://localhost:3000',
    'http://localhost:3001',
    'https://hellobahrain.com',
    'https://www.hellobahrain.com',
    'https://hello-bahrain-e-commerce-client.vercel.app',
    // Mobile app origins (React Native/Expo)
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:19006',
    'exp://localhost:8081',
  ];
};

/**
 * Check if the origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  
  // Allow all origins in development (for testing)
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Check if origin matches any allowed origin
  return allowedOrigins.some(allowed => {
    // Exact match
    if (origin === allowed) return true;
    
    // Wildcard support (e.g., *.example.com)
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    
    return false;
  });
}

/**
 * Get CORS headers for a response
 * Simplified version that works with the pattern: { headers: getCorsHeaders(origin) }
 */
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const requestOrigin = origin || '*';
  const allowedOrigins = getAllowedOrigins();
  
  // Allow all origins in development (for testing)
  if (process.env.NODE_ENV === 'development') {
    return {
      'Access-Control-Allow-Origin': requestOrigin === '*' ? '*' : requestOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  // Check if origin is in allowed list
  const allowOrigin = allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : '*';
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight requests (OPTIONS)
 */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  
  if (request.method === 'OPTIONS') {
    const headers = getCorsHeaders(origin);
    return new NextResponse(null, {
      status: 204,
      headers,
    });
  }
  
  return null;
}

/**
 * Add CORS headers to a NextResponse
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);
  
  // Add CORS headers to response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * CORS wrapper for API route handlers
 * Usage:
 * export async function POST(request: NextRequest) {
 *   const corsResponse = handleCorsPreflight(request);
 *   if (corsResponse) return corsResponse;
 *   
 *   const response = NextResponse.json({ data: '...' });
 *   return addCorsHeaders(response, request);
 * }
 */
export const cors = {
  handlePreflight: handleCorsPreflight,
  addHeaders: addCorsHeaders,
  isOriginAllowed,
  getCorsHeaders,
};

