# CORS Configuration for Mobile App

This document explains how CORS (Cross-Origin Resource Sharing) is configured for the mobile app to access the serverless backend API.

## Overview

CORS has been implemented to allow mobile applications and other clients to access the API endpoints. The solution includes:

1. **CORS Utility** (`client/src/lib/cors.ts`) - Reusable CORS functions
2. **Next.js Middleware** (`client/src/middleware.ts`) - Handles preflight OPTIONS requests globally
3. **Route-level CORS** - Individual routes add CORS headers to responses

## Configuration

### Environment Variables

Add the following environment variable to configure allowed origins:

```bash
# .env.local (for development)
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-mobile-app-domain.com,https://your-production-domain.com

# Production (Vercel/Render)
CORS_ALLOWED_ORIGINS=https://hellobahrain.com,https://www.hellobahrain.com,https://your-mobile-app-domain.com
```

### Default Allowed Origins

If `CORS_ALLOWED_ORIGINS` is not set, the following origins are allowed by default:

- `http://localhost:3000`
- `http://localhost:3001`
- `https://hellobahrain.com`
- `https://www.hellobahrain.com`

**Note:** In development mode, all origins are allowed for easier testing.

### Wildcard Support

You can use wildcards in the `CORS_ALLOWED_ORIGINS` environment variable:

```bash
CORS_ALLOWED_ORIGINS=https://*.hellobahrain.com,https://app-*.example.com
```

## How It Works

### 1. Preflight Requests (OPTIONS)

When a mobile app makes a cross-origin request, the browser/app first sends an OPTIONS request (preflight). The middleware automatically handles these:

- **Location**: `client/src/middleware.ts`
- **Handles**: All `/api/*` routes
- **Returns**: Appropriate CORS headers with 204 status

### 2. Actual Requests

Each API route adds CORS headers to its responses:

```typescript
import { cors } from '@/lib/cors';

export async function POST(request: NextRequest) {
  // Handle preflight (optional, middleware handles it)
  const corsResponse = cors.handlePreflight(request);
  if (corsResponse) return corsResponse;
  
  // Your route logic...
  const response = NextResponse.json({ data: '...' });
  
  // Add CORS headers
  return cors.addHeaders(response, request);
}
```

## Updated Routes

The following routes have been updated with CORS support:

- ✅ `/api/auth/login` - User login
- ✅ `/api/auth/register` - User registration
- ✅ `/api/auth/me` - Get current user
- ✅ `/api/products` - Product listing
- ✅ `/api/orders` - Create order

## Mobile App Integration

### Making Requests from Mobile App

When making requests from your mobile app, ensure:

1. **Include the Origin header** (usually automatic)
2. **Include credentials if needed**:
   ```javascript
   fetch('https://your-api.com/api/auth/login', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     credentials: 'include', // If using cookies
     body: JSON.stringify({ email, password })
   })
   ```

3. **Handle Authorization**:
   ```javascript
   fetch('https://your-api.com/api/auth/me', {
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json',
     }
   })
   ```

### Testing CORS

You can test CORS using curl:

```bash
# Test preflight
curl -X OPTIONS https://your-api.com/api/auth/login \
  -H "Origin: https://your-mobile-app.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Test actual request
curl -X POST https://your-api.com/api/auth/login \
  -H "Origin: https://your-mobile-app.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -v
```

## Troubleshooting

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Solution:**
1. Check that your origin is in `CORS_ALLOWED_ORIGINS`
2. Verify the middleware is running (check `client/src/middleware.ts` exists)
3. Ensure the route handler calls `cors.addHeaders(response, request)`

### CORS Error: "Preflight request doesn't pass"

**Solution:**
1. Check that OPTIONS requests are handled (middleware should handle this)
2. Verify the request method is allowed: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
3. Check that required headers are in `Access-Control-Allow-Headers`

### CORS Works in Browser but Not in Mobile App

**Solution:**
1. Mobile apps may not send Origin headers - check your HTTP client configuration
2. Some mobile HTTP clients require explicit CORS configuration
3. Verify the API URL is correct and accessible from the mobile app

## Security Considerations

1. **Don't use `*` for `Access-Control-Allow-Origin` in production** - Always specify allowed origins
2. **Use HTTPS in production** - CORS with credentials requires HTTPS
3. **Validate origins** - The CORS utility validates origins before allowing requests
4. **Keep allowed origins list minimal** - Only add origins you trust

## Adding CORS to New Routes

To add CORS support to a new API route:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cors } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  const corsResponse = cors.handlePreflight(request);
  if (corsResponse) return corsResponse;
  
  // Your route logic
  const response = NextResponse.json({ data: '...' });
  return cors.addHeaders(response, request);
}
```

## Support

If you encounter CORS issues:

1. Check browser/app console for specific error messages
2. Verify environment variables are set correctly
3. Test with curl to isolate the issue
4. Check server logs for CORS-related errors

