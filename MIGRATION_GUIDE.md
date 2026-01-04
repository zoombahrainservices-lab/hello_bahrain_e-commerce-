# Serverless Migration Guide

## Overview
This project has been migrated from Express.js to Next.js serverless API routes. The Express server (`server/` directory) can be removed once all routes are confirmed working.

## Completed Routes ✅

### Core Routes
- ✅ `/api/products` - GET (list products)
- ✅ `/api/products/[slug]` - GET (single product)
- ✅ `/api/categories` - GET (list categories)
- ✅ `/api/banners/active` - GET (active banners)
- ✅ `/api/contact` - POST (contact form)

### Auth Routes
- ✅ `/api/auth/register` - POST
- ✅ `/api/auth/login` - POST
- ✅ `/api/auth/logout` - POST
- ✅ `/api/auth/me` - GET

### Order Routes
- ✅ `/api/orders` - POST (create order)
- ✅ `/api/orders/my` - GET (user orders)

### Profile Routes
- ✅ `/api/profile` - GET, PUT (profile management)
- ⚠️ `/api/profile/password` - PUT (needs conversion)
- ⚠️ `/api/profile/addresses` - GET, POST, PUT, DELETE (needs conversion)

### Payment Routes
- ✅ `/api/eazypay/session` - POST
- ✅ `/api/eazypay/status` - POST

## Remaining Routes ⚠️

### Admin Routes (Need Conversion)
All admin routes require authentication + admin role. Follow this pattern:

```typescript
// Example: client/src/app/api/admin/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Your logic here
  return NextResponse.json(data);
}
```

Routes to convert:
- `/api/admin/summary` - GET
- `/api/admin/products` - GET, POST, PUT, DELETE
- `/api/admin/products/[id]` - GET, PUT, DELETE
- `/api/admin/categories` - GET, POST, PUT, DELETE
- `/api/admin/categories/[id]` - PUT, DELETE
- `/api/admin/banners` - GET, POST, PUT, DELETE
- `/api/admin/banners/[id]` - PUT, DELETE
- `/api/admin/orders` - GET
- `/api/admin/orders/[id]/status` - PATCH
- `/api/admin/users` - GET
- `/api/admin/users/[id]/role` - PATCH

### Profile Sub-routes
- `/api/profile/password` - PUT
- `/api/profile/addresses` - GET, POST
- `/api/profile/addresses/[id]` - PUT, DELETE

### Auth Routes
- ⚠️ `/api/auth/google` - GET (OAuth - needs special handling)
- ⚠️ `/api/auth/google/callback` - GET (OAuth callback)

## Key Changes

### 1. Database Connection
- **Before**: `server/src/config/db.ts`
- **After**: `client/src/lib/db.ts`
- Uses singleton pattern for Supabase client

### 2. Auth Middleware
- **Before**: Express middleware functions
- **After**: `client/src/lib/auth-middleware.ts`
- Returns `NextResponse` on error, or `{ user }` object on success

### 3. API Client
- **Before**: `baseURL: 'http://localhost:5000'`
- **After**: `baseURL: ''` (relative paths for Next.js API routes)

### 4. Route Structure
- **Before**: `server/src/routes/products.ts` → `router.get('/')`
- **After**: `client/src/app/api/products/route.ts` → `export async function GET()`

## Environment Variables

All environment variables remain the same. Make sure they're set in:
- `.env.local` (for local development)
- Vercel/Render environment variables (for production)

Required variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `EAZYPAY_*` (for payments)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (for OAuth)

## Testing

1. Start the Next.js dev server: `npm run dev` (in `client/` directory)
2. Test each API route using the frontend or Postman
3. Verify authentication works
4. Test admin routes with admin credentials

## Next Steps

1. Convert remaining admin routes following the pattern above
2. Convert profile sub-routes (password, addresses)
3. Handle Google OAuth (may need NextAuth.js or custom implementation)
4. Remove Express server once all routes are migrated
5. Update deployment configuration (remove server deployment, use only Next.js)

## Notes

- All routes use `export const dynamic = 'force-dynamic'` for serverless compatibility
- Cookie handling works the same way (NextResponse.cookies)
- Error handling follows Next.js patterns (return NextResponse.json with status)
- File uploads (base64 images) work the same way


